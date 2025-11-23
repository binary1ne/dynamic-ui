import { Component, OnInit, Input } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { User, AuthService } from '../../../core/services/auth.service';
import { RoleService, Role } from '../../../core/services/role.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  @Input() mode: 'global' | 'domain' = 'global';
  users: User[] = [];
  roles: Role[] = [];
  domains: any[] = [];
  showModal = false;
  isEditing = false;
  currentUser: any = { selectedRoles: [], selected_domain_id: null, selected_role: '' };
  
  showAssignmentModal = false;
  selectedUserForAssignment: any = null;

  signupEnabled = true;
  updatingConfig = false;
  error = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadSignupConfig();
    this.loadRoles();
    if (this.mode === 'global') {
      this.loadDomains();
    }
  }

  loadSignupConfig(): void {
    this.authService.getSignupConfig().subscribe({
      next: (config: any) => this.signupEnabled = config.enabled,
      error: (err: any) => console.error('Failed to load signup config', err)
    });
  }

  toggleSignup(event: any): void {
    const enabled = event.target.checked;
    this.updatingConfig = true;
    this.authService.updateSignupConfig(enabled).subscribe({
      next: (res: any) => {
        this.signupEnabled = res.enabled;
        this.updatingConfig = false;
      },
      error: (err: any) => {
        this.error = 'Failed to update signup configuration';
        this.updatingConfig = false;
        event.target.checked = !enabled;
      }
    });
  }

  loadUsers(): void {
    if (this.mode === 'domain') {
      const domainId = this.authService.getCurrentDomainId();
      if (domainId) {
        this.userService.getDomainUsers(domainId).subscribe({
          next: (users: User[]) => {
            this.users = users.map(user => ({
              ...user,
              roles: this.normalizeRoles(user.roles)
            }));
          },
          error: (err: any) => {
            console.error('Failed to load domain users', err);
            this.error = 'Failed to load users. ' + (err.error?.message || err.message);
          }
        });
      } else {
        this.error = 'No active domain found.';
      }
    } else {
      this.userService.getAllUsers().subscribe({
        next: (users: User[]) => {
          this.users = users.map(user => ({
            ...user,
            roles: this.normalizeRoles(user.roles)
          }));
        },
        error: (err: any) => {
          console.error('Failed to load users', err);
          this.error = 'Failed to load users. ' + (err.error?.message || err.message);
        }
      });
    }
  }

  normalizeRoles(roles: any): string[] {
    if (Array.isArray(roles)) return roles;
    if (typeof roles === 'string') {
      try {
        const parsed = JSON.parse(roles);
        return Array.isArray(parsed) ? parsed : [roles];
      } catch {
        return [roles];
      }
    }
    return [];
  }

  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles: Role[]) => {
        this.roles = roles || [];
        if (this.roles.length === 0) {
          this.error = 'No roles available in the system.';
        }
      },
      error: (err: any) => {
        console.error('Failed to load roles', err);
        this.error = 'Failed to load roles. ' + (err.error?.message || err.message);
      }
    });
  }

  loadDomains(): void {
    this.userService.getAllDomains().subscribe({
      next: (domains: any[]) => {
        this.domains = domains || [];
      },
      error: (err: any) => {
        console.error('Failed to load domains', err);
      }
    });
  }

  onDomainSelect(): void {
    const domain = this.domains.find(d => d.domain_id === this.currentUser.selected_domain_id);
    if (domain) {
      this.roles = domain.available_roles?.map((r: string) => ({ role_name: r })) || [];
      this.currentUser.selected_role = '';
    }
  }

  openModal(user?: User): void {
    this.error = '';
    this.isEditing = !!user;
    if (user) {
      const userRoles = this.normalizeRoles(user.roles);
      this.currentUser = {
        ...user,
        selectedRoles: [...userRoles],
        file_upload_enabled: user.file_upload_enabled || false,
        two_factor_auth_enabled: user.two_factor_auth_enabled || false
      };
    } else {
      this.currentUser = {
        email: '',
        password: '',
        full_name: '',
        selectedRoles: [],
        selected_domain_id: null,
        selected_role: '',
        file_upload_enabled: false,
        two_factor_auth_enabled: false
      };
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentUser = { selectedRoles: [] };
  }

  toggleRole(roleName: string): void {
    const index = this.currentUser.selectedRoles.indexOf(roleName);
    if (index > -1) {
      this.currentUser.selectedRoles.splice(index, 1);
    } else {
      this.currentUser.selectedRoles.push(roleName);
    }
  }

  isRoleSelected(roleName: string): boolean {
    return this.currentUser.selectedRoles?.includes(roleName) || false;
  }

  saveUser(): void {
    if (this.isEditing) {
      const updateData: any = {
        full_name: this.currentUser.full_name,
        file_upload_enabled: this.currentUser.file_upload_enabled,
        two_factor_auth_enabled: this.currentUser.two_factor_auth_enabled
      };
      if (this.currentUser.selectedRoles) {
        updateData.roles = this.currentUser.selectedRoles;
      }
      this.userService.updateUser(this.currentUser.id, updateData).subscribe(() => {
        this.loadUsers();
        this.closeModal();
      });
    } else {
      let domainId: number | undefined;
      let roleName: string;
      
      if (this.mode === 'global') {
        // Platform Admin: use selected domain and role
        domainId = this.currentUser.selected_domain_id || undefined;
        roleName = this.currentUser.selected_role || 'user';
      } else {
        // Domain Admin: use current domain
        domainId = this.authService.getCurrentDomainId() || undefined;
        roleName = this.currentUser.selectedRoles[0] || 'user';
      }
      
      this.userService.createUser(
        this.currentUser.email,
        this.currentUser.password,
        roleName,
        this.currentUser.full_name,
        this.currentUser.file_upload_enabled,
        this.currentUser.two_factor_auth_enabled,
        domainId
      ).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (err: any) => {
          console.error('Error creating user:', err);
          const errorMsg = err.error ? JSON.stringify(err.error, null, 2) : err.message;
          alert('Failed to create user:\n' + errorMsg);
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.email}?`)) {
      this.userService.deleteUser(user.id).subscribe(() => this.loadUsers());
    }
  }

  openAssignmentModal(user: User): void {
    this.selectedUserForAssignment = user;
    this.showAssignmentModal = true;
  }

  closeAssignmentModal(): void {
    this.showAssignmentModal = false;
    this.selectedUserForAssignment = null;
  }
}
