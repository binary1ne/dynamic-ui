import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../environments/api_controller';

export interface Domain {
  domain_id: number;
  domain_name: string;
  domain_type?: string;
  description?: string;
  active_flag?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DomainService {
  
  constructor(private http: HttpClient) {}

  getDomains(): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.DOMAINS.BASE);
  }

  getDomain(id: number): Observable<Domain> {
    return this.http.get<Domain>(`${API_ENDPOINTS.DOMAINS.BASE}/${id}`);
  }

  createDomain(domain: Partial<Domain>): Observable<Domain> {
    return this.http.post<Domain>(API_ENDPOINTS.DOMAINS.BASE, domain);
  }

  updateDomain(id: number, domain: Partial<Domain>): Observable<Domain> {
    return this.http.put<Domain>(`${API_ENDPOINTS.DOMAINS.BASE}/${id}`, domain);
  }

  deleteDomain(id: number): Observable<any> {
    return this.http.delete(`${API_ENDPOINTS.DOMAINS.BASE}/${id}`);
  }
}
