import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'net.godswillrobwet.dearli',
  appName: 'Dearli',
  webDir: 'dist',
  android: { allowMixedContent: false },
  plugins: { SystemBars: { insetsHandling: 'css', style: 'LIGHT' } },
};
export default config;
