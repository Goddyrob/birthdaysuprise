// Shared creation policy only. Never apply these requirements to legacy reads/unlocks.
const text = value => typeof value === 'string' ? value.trim() : '';
const demoNames = new Set(['my love', 'yours forever']);
const sampleLines = [
 'Wishing you achieve all your dreams, stay happy, and keep smiling the way you do...',
 'Because that smile is truly my favorite thing in the whole world',
 'Every single day is special because you are the main character in my life and heart',
 "Let's share unlimited laughs, endless love, silly fights, and timeless memories",
 'Thank you for being my partner in crime, my safe place, and my greatest blessing.',
 'You are my today and all of my tomorrows. I love you forever and ever!'
];
const normalize = value => text(value).replace(/\s+/g, ' ').toLowerCase();
const samples = new Set(sampleLines.map(normalize));
export function isCreatorPhoto(value) {
 if (typeof value !== 'string') return false;
 // Creator selection is a local image, or an owned persisted upload. Bundled/demo URLs never count.
 return /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value)
  || /^storage:[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i.test(value);
}
export function creationErrors(config) {
 const errors = {};
 for (const [field,label] of [['recipientName','recipient’s name'],['senderName','your name']]) {
  const value = text(config?.[field]);
  if (!value || demoNames.has(value.toLowerCase()) || value.length > 100)
   errors[field] = `Add ${label} (up to 100 characters); replace the sample name.`;
 }
 if (!/^\d{4,12}$/.test(config?.passcode || '')) errors.passcode = 'Choose a passcode of 4 to 12 digits.';
 const photos = [config?.mainPhoto, ...(Array.isArray(config?.galleryPhotos) ? config.galleryPhotos.map(p=>p?.url) : [])];
 if (!photos.some(isCreatorPhoto)) errors.mainPhoto = 'Add at least one of your own photos. Sample illustrations do not count.';
 const paragraphs = Array.isArray(config?.letterBody) ? config.letterBody : [];
 const original = paragraphs.filter(p=>text(p) && !samples.has(normalize(p)));
 if (!original.length || original.map(text).join(' ').replace(/\s/g,'').length < 20 || paragraphs.length > 12)
  errors.letterBody = 'Write a personal message of at least 20 non-space characters, in up to 12 paragraphs. Replace the sample letter.';
 for (const [field,label] of [['letterTitle','letter title'],['letterGreeting','greeting'],['letterClosing','closing']])
  if (!text(config?.[field]) || text(config?.[field]).length > 4000) errors[field] = `Add a ${label}.`;
 return errors;
}
export function creationChecklist(config) {
 const errors = creationErrors(config);
 return {details:!['recipientName','senderName','passcode'].some(k=>errors[k]), photo:!errors.mainPhoto,
  letter:!['letterTitle','letterGreeting','letterBody','letterClosing'].some(k=>errors[k])};
}
export function withCreatorCover(config) {
 if (!config || isCreatorPhoto(config.mainPhoto)) return config;
 const cover = Array.isArray(config.galleryPhotos) && config.galleryPhotos.find(photo=>isCreatorPhoto(photo?.url));
 return cover ? {...config,mainPhoto:cover.url} : config;
}
