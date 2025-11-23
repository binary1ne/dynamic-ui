import { Routes } from '@angular/router';
import { DomainManagementComponent } from './components/domain-management/domain-management.component';
import { UserManagementComponent } from '../../shared/components/user-management/user-management.component';

export const PLATFORM_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: 'domains', component: DomainManagementComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'logs', component: DomainManagementComponent },  // TODO: Create SystemLogsComponent
      { path: 'user-domains', component: UserManagementComponent },  // User-domain assignment
      { path: '', redirectTo: 'domains', pathMatch: 'full' }
    ]
  }
];
