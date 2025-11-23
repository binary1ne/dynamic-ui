import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { API_ENDPOINTS } from '../../../../environments/api_controller';

interface Domain {
    domain_id: number;
    domain_name: string;
    domain_type: string;
    description: string;
    available_roles: string[];
}

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
    email = '';
    password = '';
    confirmPassword = '';
    fullName = '';
    selectedDomainId: number | null = null;
    selectedRole = '';

    domains: Domain[] = [];
    availableRoles: string[] = [];
    loading = false;
    error = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.loadSignupEnabledDomains();
    }

    loadSignupEnabledDomains(): void {
        this.http.get<Domain[]>(API_ENDPOINTS.DOMAINS.SIGNUP_ENABLED).subscribe({
            next: (domains) => {
                this.domains = domains;
                // Auto-select if only one domain
                if (domains.length === 1) {
                    this.onDomainSelect(domains[0].domain_id);
                }
            },
            error: (err) => {
                console.error('Failed to load signup-enabled domains', err);
                this.error = 'Failed to load available domains';
            }
        });
    }

    onDomainSelect(domainId: number): void {
        this.selectedDomainId = domainId;
        const domain = this.domains.find(d => d.domain_id === domainId);
        if (domain) {
            this.availableRoles = domain.available_roles || [];
            // Auto-select if only one role
            if (this.availableRoles.length === 1) {
                this.selectedRole = this.availableRoles[0];
            } else {
                this.selectedRole = '';
            }
        }
    }

    isValid(): boolean {
        return !!this.email && !!this.password && !!this.fullName &&
            !!this.selectedDomainId && !!this.selectedRole &&
            this.password === this.confirmPassword && this.password.length >= 6;
    }

    onSubmit(): void {
        if (!this.isValid()) {
            this.error = 'Please fill in all fields correctly';
            return;
        }

        this.loading = true;
        this.error = '';

        this.authService.signup(
            this.email,
            this.password,
            this.selectedRole,
            this.fullName,
            this.selectedDomainId!
        ).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.error = err.error?.message || 'Registration failed';
                this.loading = false;
            },
            complete: () => {
                this.loading = false;
            }
        });
    }
}
