import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { publicOrigin } from './api';
const openSurprise = (value: string) => {
  try {
    const url = new URL(value);
    if (url.origin !== publicOrigin || !/^\/surprise\/[0-9a-f-]{36}\/?$/i.test(url.pathname)) return;
    window.location.assign(url.pathname);
  } catch { /* Ignore unrelated links. */ }
};
export async function initializeNative() {
  if (!Capacitor.isNativePlatform()) return;
  await App.addListener('appUrlOpen', ({ url }) => openSurprise(url));
  await App.addListener('backButton', ({ canGoBack }) => {
    // Let the active dialog use its existing Escape/close behavior first.
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.dispatchEvent(escape);
    if (escape.defaultPrevented) return;

    const back = new Event('dearli:back', { cancelable: true });
    window.dispatchEvent(back);
    if (back.defaultPrevented) return;
    if (canGoBack) window.history.back();
    else void App.minimizeApp();
  });
  const launch = await App.getLaunchUrl();
  if (launch?.url) openSurprise(launch.url);
}
