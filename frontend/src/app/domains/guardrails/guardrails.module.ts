import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { GuardrailsInsightsComponent } from './components/insights/guardrails-insights.component';
import { GuardrailsConfigComponent } from './components/config/guardrails-config.component';
import { GUARDRAILS_ROUTES } from './guardrails.routes';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    GuardrailsInsightsComponent,
    GuardrailsConfigComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(GUARDRAILS_ROUTES)
  ]
})
export class GuardrailsModule { }
