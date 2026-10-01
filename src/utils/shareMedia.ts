const MAX_REQUEST_BYTES = 4_000_000;
const MAX_ENCODED_IMAGE_BYTES = 3_400_000;
const REQUEST_HEADROOM_BYTES = 128_000;
const IMAGE_SIZES = [1600, 1280, 1024, 800, 640];
const IMAGE_QUALITIES = [0.8, 0.72, 0.64, 0.56, 0.48];
const SMALL_IMAGE_BYTES = 500_000;

const loadImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Unable to read selected image'));
  image.src = source;
});

const canvasToWebp = (canvas: HTMLCanvasElement, quality: number) => new Promise<Blob | null>((resolve) => {
  canvas.toBlob(resolve, 'image/webp', quality);
});

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read optimized image'));
  reader.onerror = () => reject(reader.error || new Error('Unable to read optimized image'));
  reader.readAsDataURL(blob);
});

const encodeImage = async (source: string, encodedBudget: number) => {
  if (!source.startsWith('data:image/') || source.startsWith('data:image/gif')) return source;

  const image = await loadImage(source);
  const original = await fetch(source).then((response) => response.blob());
  if (original.size <= SMALL_IMAGE_BYTES && Math.max(image.naturalWidth, image.naturalHeight) <= IMAGE_SIZES[0]) {
    return source;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return source;

  let bestBlob: Blob | null = null;
  const originalSize = Math.max(image.naturalWidth, image.naturalHeight);
  const targetBinaryBytes = Math.max(1, Math.floor((encodedBudget - 32) * 0.72));

  for (let index = 0; index < IMAGE_SIZES.length; index += 1) {
    const scale = Math.min(1, IMAGE_SIZES[index] / originalSize);
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToWebp(canvas, IMAGE_QUALITIES[index]);
    if (!blob || blob.type !== 'image/webp') return source;
    bestBlob = blob;
    if (blob.size <= targetBinaryBytes) break;
  }

  if (!bestBlob || bestBlob.size >= original.size) return source;
  return blobToDataUrl(bestBlob);
};

const mapWithConcurrency = async <T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
};

export const prepareConfigForShare = async <T extends {
  mainPhoto: string;
  galleryPhotos: Array<{ url: string }>;
}>(config: T): Promise<T> => {
  const imageSources = [config.mainPhoto, ...config.galleryPhotos.map((photo) => photo.url)];
  const compressibleCount = imageSources.filter((source) =>
    source.startsWith('data:image/') && !source.startsWith('data:image/gif'),
  ).length;
  const withoutCompressibleImages = {
    ...config,
    mainPhoto: config.mainPhoto.startsWith('data:image/') && !config.mainPhoto.startsWith('data:image/gif')
      ? ''
      : config.mainPhoto,
    galleryPhotos: config.galleryPhotos.map((photo) => ({
      ...photo,
      url: photo.url.startsWith('data:image/') && !photo.url.startsWith('data:image/gif') ? '' : photo.url,
    })),
  };
  const fixedBytes = new TextEncoder().encode(JSON.stringify(withoutCompressibleImages)).length;
  const availableImageBytes = Math.max(0, Math.min(
    MAX_ENCODED_IMAGE_BYTES,
    MAX_REQUEST_BYTES - fixedBytes - REQUEST_HEADROOM_BYTES,
  ));
  const perImageBudget = compressibleCount > 0 ? availableImageBytes / compressibleCount : 0;

  const [mainPhoto, ...preparedGallery] = await mapWithConcurrency(
    imageSources,
    2,
    (source) => encodeImage(source, perImageBudget),
  );
  const galleryPhotos = config.galleryPhotos.map((photo, index) => ({ ...photo, url: preparedGallery[index] }));

  const prepared = { ...config, mainPhoto, galleryPhotos } as T;
  const request = JSON.stringify({ config: prepared });
  if (new TextEncoder().encode(request).length > MAX_REQUEST_BYTES) {
    const error = new Error('Selected media exceeds the safe upload size');
    error.name = 'PayloadTooLargeError';
    throw error;
  }

  return prepared;
};