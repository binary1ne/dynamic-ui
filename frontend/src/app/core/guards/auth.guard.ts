import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isAuth = authService.isAuthenticated();
    const token = authService.getAccessToken();
    
    console.log('AuthGuard check:', { isAuth, hasToken: !!token, token: token?.substring(0, 20) + '...' });

    if (isAuth) {
        return true;
    }

    console.warn('AuthGuard: Not authenticated, redirecting to login');
    router.navigate(['/login']);
    return false;
};

export const adminGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.isAdmin()) {
        return true;
    }

    router.navigate(['/dashboard']);
    return false;
};
