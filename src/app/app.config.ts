import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { cloudflareInterceptor } from './interceptors/cloudflare.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withHashLocation makes routes work in Electron (file://) and Capacitor (file://)
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([cloudflareInterceptor]))
  ]
};
