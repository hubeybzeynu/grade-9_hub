import type { CapacitorConfig } from '@capacitor/cli';

// IMPORTANT: We intentionally do NOT set `server.url` here.
// When `server.url` points at the Lovable preview, the installed Android/iOS
// app tries to load the web app over the network and shows a black screen
// for anyone who isn't logged into Lovable. Without `server.url`, Capacitor
// loads the bundled assets from `webDir` (./dist) so the app works offline
// and on every device.
const config: CapacitorConfig = {
  appId: 'app.lovable.e548069da9f14d3ebab1e27a9ba52fa9',
  appName: 'Grade 9 Portal',
  webDir: 'dist',
};

export default config;
