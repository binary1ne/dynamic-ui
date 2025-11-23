import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

// Feature components - Agentic
import { RagComponent } from './features/agentic/rag/rag.component';
import { ToolChatComponent } from './features/agentic/tool-chat/tool-chat.component';

// Feature components - Guardrails
import { GuardrailsInsightsComponent } from './features/guardrails/guardrails-insights/guardrails-insights.component';
import { GuardrailsConfigComponent } from './features/guardrails/guardrails-config/guardrails-config.component';

// Admin components - Base
import { UserManagementComponent } from './features/admin/user-management/user-management.component';
import { RoleManagementComponent } from './features/admin/role-management/role-management.component';
import { ComponentManagementComponent } from './features/admin/component-management/component-management.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'domain-selection', loadComponent: () => import('./features/auth/domain-selection/domain-selection.component').then(m => m.DomainSelectionComponent), canActivate: [authGuard] },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            // Feature routes - accessible by all authenticated users (with component access)
            {
                path: 'rag',
                component: RagComponent,
                canActivate: [roleGuard],
                data: { requiredComponent: 'AGENTIC_RAG' }
            },
            {
                path: 'chat',
                component: ToolChatComponent,
                canActivate: [roleGuard],
                data: { requiredComponent: 'NORMAL_CHAT' }
            },
            {
                path: 'guardrails',
                component: GuardrailsInsightsComponent,
                canActivate: [roleGuard],
                data: { requiredComponent: 'GUARDRAILS_INSIGHTS' }
            },

            // Admin routes - require specific component access
            {
                path: 'users',
                component: UserManagementComponent,
                canActivate: [roleGuard],
                data: { requiredComponent: 'USER_MANAGEMENT' }
            },
            {
                path: 'roles',
                component: RoleManagementComponent,
                canActivate: [roleGuard],
                data: { requiredComponent: 'ROLE_MANAGEMENT' }
            },
            {
                path: 'components',
                component: ComponentManagementComponent,
                canActivate: [roleGuard],
                data: { requiredComponent: 'COMPONENT_MANAGEMENT' }
            },
            {
                path: 'guardrails/config',
                component: GuardrailsConfigComponent,
                canActivate: [roleGuard],
                data: { requiredComponent: 'GUARDRAILS_CONFIGURATION' }
            },
            
            // Platform Admin Routes
            {
                path: 'domains',
                loadComponent: () => import('./features/platform/domain-management/domain-management.component').then(m => m.DomainManagementComponent),
                canActivate: [roleGuard],
                data: { requiredComponent: 'DOMAIN_MANAGEMENT' }
            },
            {
                path: 'logs',
                loadComponent: () => import('./features/platform/system-logs/system-logs.component').then(m => m.SystemLogsComponent),
                canActivate: [roleGuard],
                data: { requiredComponent: 'SYSTEM_LOGS' }
            },
            {
                path: 'user-domains',
                loadComponent: () => import('./features/platform/user-domain-assignment/user-domain-assignment.component').then(m => m.UserDomainAssignmentComponent),
                canActivate: [roleGuard],
                data: { requiredComponent: 'USER_DOMAIN_ASSIGNMENT' }
            }
        ]
    },
    { path: '**', redirectTo: '/login' }
];
