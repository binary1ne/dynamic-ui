import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UserManagementComponent } from './components/user-management/user-management.component';

import { ComponentAssignmentComponent } from './components/component-assignment/component-assignment.component';

@NgModule({
  declarations: [
    UserManagementComponent,
    ComponentAssignmentComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    UserManagementComponent,
    ComponentAssignmentComponent
  ]
})
export class SharedModule { }
