export const audioFileError = (file: Pick<File, 'type' | 'size'>): string | null => {
  if (!['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'].includes(file.type)) return 'Choose an MP3, WAV, OGG or M4A audio file.';
  if (file.size > 15 * 1024 * 1024) return 'Audio must be 15 MB or smaller.';
  if (!file.size) return 'That audio file is empty. Choose another file.';
  return null;
};
