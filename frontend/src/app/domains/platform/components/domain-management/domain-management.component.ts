import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../../../environments/api_controller';

interface Domain {
    domain_id: number;
    domain_name: string;
    domain_type: string;
    description: string;
    active_flag: boolean;
    signup_enabled: boolean;
    available_roles: string[];
 }

@Component({
    selector: 'app-domain-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './domain-management.component.html',
    styleUrls: ['./domain-management.component.css']
})
export class DomainManagementComponent implements OnInit {
    domains: Domain[] = [];
    loading = false;
    error = '';
    
    // For creating/editing domain
    showForm = false;
    editingDomain: Domain | null = null;
    domainForm = {
        domain_name: '',
        domain_type: 'Custom',
        description: '',
        signup_enabled: false
    };

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadDomains();
    }

    loadDomains(): void {
        this.loading = true;
        this.error = '';
        
        this.http.get<Domain[]>(API_ENDPOINTS.DOMAINS.LIST).subscribe({
            next: (domains) => {
                this.domains = domains;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load domains';
                this.loading = false;
            }
        });
    }

    openCreateForm(): void {
        this.editingDomain = null;
        this.domainForm = {
            domain_name: '',
            domain_type: 'Custom',
            description: '',
            signup_enabled: false
        };
        this.showForm = true;
    }

    openEditForm(domain: Domain): void {
        this.editingDomain = domain;
        this.domainForm = {
            domain_name: domain.domain_name,
            domain_type: domain.domain_type,
            description: domain.description,
            signup_enabled: domain.signup_enabled
        };
        this.showForm = true;
    }

    closeForm(): void {
        this.showForm = false;
        this.editingDomain = null;
    }

    saveDomain(): void {
        if (!this.domainForm.domain_name) {
            this.error = 'Domain name is required';
            return;
        }

        this.loading = true;
        this.error = '';

        const request = this.editingDomain
            ? this.http.put(`${API_ENDPOINTS.DOMAINS.BY_ID(this.editingDomain.domain_id)}`, this.domainForm)
            : this.http.post(API_ENDPOINTS.DOMAINS.CREATE, this.domainForm);

        request.subscribe({
            next: () => {
                this.loadDomains();
                this.closeForm();
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to save domain';
                this.loading = false;
            }
        });
    }

    toggleSignup(domain: Domain): void {
        this.http.put(`${API_ENDPOINTS.DOMAINS.BY_ID(domain.domain_id)}`, {
            signup_enabled: !domain.signup_enabled
        }).subscribe({
            next: () => {
                domain.signup_enabled = !domain.signup_enabled;
            },
            error: (err) => {
                this.error = 'Failed to toggle signup';
            }
        });
    }

    deleteDomain(domain: Domain): void {
        if (!confirm(`Delete domain "${domain.domain_name}"?`)) {
            return;
        }
        
        this.http.delete(API_ENDPOINTS.DOMAINS.BY_ID(domain.domain_id)).subscribe({
            next: () => {
                this.loadDomains();
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to delete domain';
            }
        });
    }
}
