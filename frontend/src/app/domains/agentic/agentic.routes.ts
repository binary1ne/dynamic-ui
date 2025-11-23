import { Routes } from '@angular/router';
import { RagComponent } from './components/rag/rag.component';
import { ToolChatComponent } from './components/tool-chat/tool-chat.component';
import { UserManagementComponent } from '../../shared/components/user-management/user-management.component';

export const AGENTIC_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: 'rag', component: RagComponent },
      { path: 'chat', component: ToolChatComponent },
      { path: 'users', component: UserManagementComponent },
      { path: '', redirectTo: 'rag', pathMatch: 'full' }
    ]
  }
];
