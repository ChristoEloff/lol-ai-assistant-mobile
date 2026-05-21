import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lolai.assistant',
  appName: 'LoL AI Assistant',
  webDir: 'dist/mobile-app/browser',
  server: {
    // Allow the app to make requests to the backend
    // On Android emulator: localhost maps to 10.0.2.2
    // On real device: replace with your PC's LAN IP
    allowNavigation: ['localhost:8080', '10.0.2.2:8080', '192.168.*:8080']
  },
  android: {
    allowMixedContent: true  // allows HTTP calls from HTTPS webview
  }
};

export default config;
