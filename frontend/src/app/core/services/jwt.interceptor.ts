// jwt.interceptor.tsmport { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const accessToken = authService.getAccessToken();
    const tempToken = authService.getTempToken();

    // Use access token if available, otherwise fall back to temp token (for complete-login step)
    const token = accessToken || tempToken;

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }
    return next(req);
};
