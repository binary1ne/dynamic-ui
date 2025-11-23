import { Component } from '@angular/core';
import { ChatService, ToolChatResponse } from '../../../../core/services/chat.service';

@Component({
  selector: 'app-tool-chat',
  templateUrl: './tool-chat.component.html',
  styleUrls: ['./tool-chat.component.css']
})
export class ToolChatComponent {
  chatHistory: Array<{ type: string; content: string; tools?: string[] }> = [];
  message = '';
  loading = false;

  constructor(private chatService: ChatService) { }

  sendMessage(): void {
    if (!this.message.trim()) return;

    this.chatHistory.push({ type: 'user', content: this.message });
    const userMessage = this.message;
    this.message = '';
    this.loading = true;

    this.chatService.chatWithTools(userMessage).subscribe({
      next: (response) => {
        this.chatHistory.push({
          type: 'ai',
          content: response.answer,
          tools: response.tools_used
        });
        this.loading = false;
      },
      error: (err) => {
        this.chatHistory.push({
          type: 'ai',
          content: 'Error: ' + (err.error?.message || 'Failed to get response')
        });
        this.loading = false;
      }
    });
  }

  clearHistory(): void {
    if (confirm('Clear all chat history?')) {
      this.chatHistory = [];
    }
  }
}
