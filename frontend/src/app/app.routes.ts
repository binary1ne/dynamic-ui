import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login/login.component';
import { SignupComponent } from './core/auth/signup/signup.component';
import { DashboardComponent } from './core/layout/dashboard-shell/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            // Platform Domain - Lazy Loaded
            {
                path: 'platform',
                loadChildren: () => import('./domains/platform/platform.module')
                    .then(m => m.PlatformModule)
            },
            
            // Agentic Domain - Lazy Loaded
            {
                path: 'agentic',
                loadChildren: () => import('./domains/agentic/agentic.module')
                    .then(m => m.AgenticModule)
            },
            
            // Guardrails Domain - Lazy Loaded
            {
                path: 'guardrails',
                loadChildren: () => import('./domains/guardrails/guardrails.module')
                    .then(m => m.GuardrailsModule)
            },
            
            // Default redirect handled by DashboardComponent based on permissions
            // { path: '', redirectTo: 'agentic', pathMatch: 'full' }
        ]
    },
    // NOTE: Wildcard redirect removed - it was catching lazy-loaded child routes
    // If needed, add specific 404 handling instead
];
