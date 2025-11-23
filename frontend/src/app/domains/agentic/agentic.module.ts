import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RagComponent } from './components/rag/rag.component';
import { ToolChatComponent } from './components/tool-chat/tool-chat.component';
import { AGENTIC_ROUTES } from './agentic.routes';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    RagComponent,
    ToolChatComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(AGENTIC_ROUTES)
  ]
})
export class AgenticModule { }
