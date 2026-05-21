import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const cloudflareInterceptor: HttpInterceptorFn = (req, next) => {
  // Add Cloudflare Access headers to all API requests
  if (req.url.startsWith(environment.apiBaseUrl)) {
    const modifiedReq = req.clone({
      setHeaders: {
        'CF-Access-Client-Id': environment.cfClientId,
        'CF-Access-Client-Secret': environment.cfClientSecret
      }
    });
    return next(modifiedReq);
  }
  return next(req);
};
