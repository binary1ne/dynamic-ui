import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DomainManagementComponent } from './components/domain-management/domain-management.component';
import { PLATFORM_ROUTES } from './platform.routes';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(PLATFORM_ROUTES),
    DomainManagementComponent  // Import standalone component
  ]
})
export class PlatformModule { }
