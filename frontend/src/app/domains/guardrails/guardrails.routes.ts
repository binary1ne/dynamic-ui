import { Routes } from '@angular/router';
import { GuardrailsInsightsComponent } from './components/insights/guardrails-insights.component';
import { GuardrailsConfigComponent } from './components/config/guardrails-config.component';
import { UserManagementComponent } from '../../shared/components/user-management/user-management.component';

export const GUARDRAILS_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: 'insights', component: GuardrailsInsightsComponent },
      { path: 'config', component: GuardrailsConfigComponent },
      { path: 'users', component: UserManagementComponent },
      { path: '', redirectTo: 'insights', pathMatch: 'full' }
    ]
  }
];
