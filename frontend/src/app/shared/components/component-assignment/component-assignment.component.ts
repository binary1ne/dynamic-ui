import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ComponentService } from '../../../core/services/component.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-component-assignment',
  templateUrl: './component-assignment.component.html',
  styleUrls: ['./component-assignment.component.css']
})
export class ComponentAssignmentComponent implements OnInit {
  @Input() userId!: number;
  @Input() userName!: string;
  @Output() close = new EventEmitter<void>();

  availableComponents: string[] = [];
  assignedComponents: string[] = [];
  loading = false;
  error = '';

  constructor(
    private componentService: ComponentService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    // Load available components (filtered by admin's domain/role)
    this.componentService.getAllComponents().subscribe({
      next: (data) => {
        this.availableComponents = data.assignable;
        this.loadUserComponents();
      },
      error: (err) => {
        console.error('Failed to load available components', err);
        this.error = 'Failed to load available components';
        this.loading = false;
      }
    });
  }

  loadUserComponents(): void {
    this.componentService.getUserAssignedComponents(this.userId).subscribe({
      next: (components) => {
        this.assignedComponents = components;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load user components', err);
        this.error = 'Failed to load user components';
        this.loading = false;
      }
    });
  }

  isAssigned(componentName: string): boolean {
    return this.assignedComponents.includes(componentName);
  }

  toggleAssignment(componentName: string, event: any): void {
    const hasAccess = event.target.checked;
    
    // Optimistic update
    if (hasAccess) {
      this.assignedComponents.push(componentName);
    } else {
      this.assignedComponents = this.assignedComponents.filter(c => c !== componentName);
    }

    this.userService.assignComponentToUser(this.userId, componentName, hasAccess).subscribe({
      next: () => {
        // Success
      },
      error: (err) => {
        console.error('Failed to update component assignment', err);
        this.error = 'Failed to update assignment';
        // Revert optimistic update
        if (hasAccess) {
          this.assignedComponents = this.assignedComponents.filter(c => c !== componentName);
        } else {
          this.assignedComponents.push(componentName);
        }
        event.target.checked = !hasAccess;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
