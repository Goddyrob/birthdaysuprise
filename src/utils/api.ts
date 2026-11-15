import { Capacitor } from '@capacitor/core';
export const publicOrigin = (import.meta.env.VITE_PUBLIC_ORIGIN || 'https://dearli.vercel.app').replace(/\/$/, '');
const apiOrigin = (import.meta.env.VITE_API_ORIGIN || publicOrigin).replace(/\/$/, '');
export const apiFetch: typeof fetch = (input, init) => {
  const target = Capacitor.isNativePlatform() && typeof input === 'string' && input.startsWith('/api/')
    ? `${apiOrigin}${input}` : input;
  return fetch(target, init);
};
