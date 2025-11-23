import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from '../../../environments/api_controller';

export interface User {
    id: number;
    email: string;
    full_name?: string;
    roles: string[];
    activeRole?: string;
    file_upload_enabled?: boolean;
    two_factor_auth_enabled?: boolean;
    created_at: string;
}

export interface UserDomain {
    domain_id: number;
    domain_name: string;
    domain_type: string;
    available_roles: string[];
}

export interface LoginResponse {
    user: User;
    access_token?: string;
    temp_token?: string;
    requires_2fa?: boolean;
    message?: string;
    email?: string;
    domains?: UserDomain[];
    role?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private accessTokenKey = 'access_token';
    private tempTokenKey = 'temp_token';
    private domainsKey = 'user_domains';
    private selectedDomainKey = 'selected_domain';

    constructor(private http: HttpClient) {
        this.loadUserFromStorage();
    }

    get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }

    isAdmin(): boolean {
        const user = this.currentUserValue;
        return user?.activeRole === 'admin' || user?.roles?.includes('admin') || false;
    }

    checkEmail(email: string): Observable<any> {
        return this.http.post(API_ENDPOINTS.AUTH.CHECK_EMAIL, { email });
    }

    getSignupConfig(): Observable<{ enabled: boolean }> {
        return this.http.get<{ enabled: boolean }>(API_ENDPOINTS.AUTH.SIGNUP_CONFIG);
    }

    updateSignupConfig(enabled: boolean): Observable<any> {
        return this.http.post(API_ENDPOINTS.AUTH.SIGNUP_CONFIG, { enabled });
    }

    signup(email: string, password: string, role: string = 'user', fullName?: string, domain_id?: number): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
            email,
            password,
            role,
            full_name: fullName,
            domain_id
        }).pipe(
            tap(response => this.handleAuthResponse(response))
        );
    }

    login(email: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
            email,
            password
        }).pipe(
            tap(response => {
                this.handleAuthResponse(response);
            })
        );
    }

    completeDomainLogin(email: string, otp: string, domain_id: number, active_role: string): Observable<LoginResponse> {
        const tempToken = this.getTempToken();
        const headers: { [header: string]: string } = {};
        if (tempToken) {
            headers['Authorization'] = `Bearer ${tempToken}`;
        }

        return this.http.post<LoginResponse>(API_ENDPOINTS.AUTH.COMPLETE_LOGIN, {
            email,
            otp: otp || '',
            domain_id,
            active_role
        }, { headers }).pipe(
            tap(response => {
                this.handleAuthResponse(response);
                localStorage.setItem(this.selectedDomainKey, domain_id.toString());
            })
        );
    }

    switchDomain(domain_id: number, active_role?: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(API_ENDPOINTS.AUTH.SWITCH_DOMAIN, {
            domain_id,
            active_role
        }).pipe(
            tap(response => {
                this.handleAuthResponse(response);
                localStorage.setItem(this.selectedDomainKey, domain_id.toString());
            })
        );
    }

    getCurrentDomainId(): number | null {
        const id = localStorage.getItem(this.selectedDomainKey);
        return id ? parseInt(id, 10) : null;
    }

    getCurrentDomainName(): string | null {
        const domainId = this.getCurrentDomainId();
        if (!domainId) return null;

        const domainsStr = localStorage.getItem(this.domainsKey);
        if (!domainsStr) return null;

        try {
            const domains: UserDomain[] = JSON.parse(domainsStr);
            const domain = domains.find(d => d.domain_id === domainId);
            return domain ? domain.domain_name : null;
        } catch (e) {
            console.error('Error parsing domains', e);
            return null;
        }
    }

    getActiveRole(): string | null {
        const token = this.getAccessToken();
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role || null;
        } catch (e) {
            console.error('Error decoding token', e);
            return null;
        }
    }

    logout(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.tempTokenKey);
        localStorage.removeItem(this.domainsKey);
        localStorage.removeItem(this.selectedDomainKey);
        this.currentUserSubject.next(null);
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.accessTokenKey);
    }

    getTempToken(): string | null {
        return localStorage.getItem(this.tempTokenKey);
    }

    storeAccessToken(token: string) {
        localStorage.setItem(this.accessTokenKey, token);
    }

    storeTempToken(token: string) {
        localStorage.setItem(this.tempTokenKey, token);
    }

    private handleAuthResponse(response: LoginResponse) {
        if (!response) {
            return;
        }

        if (response.access_token) {
            this.storeAccessToken(response.access_token);
            localStorage.removeItem(this.tempTokenKey);
        } else if (response.temp_token) {
            this.storeTempToken(response.temp_token);
            localStorage.removeItem(this.accessTokenKey);
        }

        if (response.domains) {
            localStorage.setItem(this.domainsKey, JSON.stringify(response.domains));
        }

        if (response.user) {
            const userWithRole = {
                ...response.user,
                activeRole: response.role || response.user.activeRole
            };
            this.currentUserSubject.next(userWithRole);
        }
    }

    loadUserFromStorage() {
        const access = localStorage.getItem(this.accessTokenKey);
        const domains = localStorage.getItem(this.domainsKey);
        if (access) {
            // optionally call me endpoint to hydrate user data
        }
    }
}
