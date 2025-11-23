import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  @Input() currentUser: User | null = null;
  @Input() domainName: string | null = null;
  @Input() activeRole: string | null = null;
  @Output() goBack = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onGoBack(): void {
    this.goBack.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
