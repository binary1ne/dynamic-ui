import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

    email = '';
    password = '';
    
    // Stage 2: Domain/Role Selection
    domains: any[] = [];
    selectedDomainId: number | null = null;
    selectedRole = '';
    availableRoles: string[] = [];

    // UI States
    loading = false;
    emailChecked = false; // Track if email has been verified
    showDomainSelection = false;
    showOtpInput = false;
    error = '';
    signupEnabled = true;

    otp = '';

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.checkSignupStatus();
    }

    checkSignupStatus(): void {
        this.authService.getSignupConfig().subscribe({
            next: (config) => {
                this.signupEnabled = config.enabled;
            },
            error: (err) => console.error('Failed to check signup status', err)
        });
    }

    // Step 1: Check Email
    checkEmail(): void {
        if (!this.email || !this.email.includes('@') || this.emailChecked) return;

        this.loading = true;
        this.error = '';

        this.authService.checkEmail(this.email).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.exists) {
                    this.emailChecked = true;
                } else {
                    this.error = 'Email not found. Please sign up.';
                }
            },
            error: () => {
                this.loading = false;
                this.error = 'Error checking email';
            }
        });
    }

    resetForm(): void {
        this.emailChecked = false;
        this.showDomainSelection = false;
        this.showOtpInput = false;
        this.password = '';
        this.otp = '';
        this.selectedDomainId = null;
        this.selectedRole = '';
        this.error = '';
        this.domains = [];
    }

    // Step 2: Login with Password
    onSubmit(): void {
        if (!this.emailChecked) {
            this.checkEmail();
            return;
        }

        if (!this.password) return;

        this.loading = true;
        this.error = '';

        this.authService.login(this.email, this.password).subscribe({
            next: (response) => {
                this.loading = false;
                
                // Check if we need to show domain selection or OTP
                if (response.domains && response.domains.length > 0) {
                    this.domains = response.domains;
                    this.showDomainSelection = true;
                    
                    // Pre-select first domain if available
                    if (this.domains.length === 1) {
                        this.selectDomain(this.domains[0].domain_id);
                    }
                }
                
                if (response.requires_2fa) {
                    this.showOtpInput = true;
                }
            },
            error: (err) => {
                this.error = err.error?.message || 'Login failed';
                this.loading = false;
            }
        });
    }

    // Handle Domain Selection
    selectDomain(domainId: number): void {
        this.selectedDomainId = Number(domainId);
        const domain = this.domains.find(d => d.domain_id === this.selectedDomainId);
        if (domain) {
            this.availableRoles = domain.available_roles || [];
            // Auto-select role if only one
            if (this.availableRoles.length === 1) {
                this.selectedRole = this.availableRoles[0];
            } else {
                this.selectedRole = '';
            }
        }
    }

    // Step 3: Complete Login with Domain, Role, and OTP
    completeLogin(): void {
        if (!this.selectedDomainId || !this.selectedRole) {
            this.error = 'Please select a domain and role';
            return;
        }

        if (this.showOtpInput && (!this.otp || this.otp.length < 6)) {
            this.error = 'Please enter a valid verification code';
            return;
        }

        this.loading = true;
        this.error = '';

        this.authService.completeDomainLogin(
            this.email, 
            this.otp, 
            this.selectedDomainId, 
            this.selectedRole
        ).subscribe({
            next: (response) => {
                this.handleLoginSuccess(response);
            },
            error: (err) => {
                this.error = err.error?.message || 'Login completion failed';
                this.loading = false;
            }
        });
    }

    handleLoginSuccess(response: any): void {
        this.router.navigate(['/dashboard']);
    }
}
