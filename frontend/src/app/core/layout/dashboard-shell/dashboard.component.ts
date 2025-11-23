import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth.service';
import { ComponentService, NavigationItem } from '../../services/component.service';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  currentUser: User | null = null;
  navItems: NavigationItem[] = [];
  loading: boolean = true;
  currentView: 'home' | 'child' = 'home';
  domainName: string | null = null;
  activeRole: string | null = null;

  constructor(
    private authService: AuthService,
    private componentService: ComponentService,
    private navigationService: NavigationService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUserValue;
    this.domainName = this.authService.getCurrentDomainName();
    this.activeRole = this.authService.getActiveRole();
  }

  ngOnInit(): void {
    this.loadNavigation();

    // Track route changes to update currentView
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentView = event.urlAfterRedirects === '/dashboard' ? 'home' : 'child';
    });
  }

  loadNavigation(): void {
    this.loading = true;
    this.componentService.getNavigationComponents().subscribe({
      next: (items: NavigationItem[]) => {
        this.navItems = items;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading navigation:', err);
        this.loading = false;
      }
    });
  }

  onCardClick(item: NavigationItem): void {
    console.log("item", item);
    const extraParams = { example: 'value' }; //Optional, can be null
    this.navigationService.navigate(item.mode, item.value, extraParams);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
