import { Component, signal, effect, inject, PLATFORM_ID, OnInit, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { CartStateService } from '../../services/cart-state';
import { WalletService } from '../../services/wallet';
import { UserInfo } from '../../models/auth.interfaces';
import { WalletBalance } from '../../models/wallet.interfaces';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  cartCount = signal(0);
  currentUser = signal<UserInfo | null>(null);
  isAuthenticated = signal(false);
  isScrolled = signal(false);
  showProfileDropdown = signal(false);
  balance = signal<WalletBalance | null>(null);
  
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private cartStateService = inject(CartStateService);
  private walletService = inject(WalletService);
  private router = inject(Router);
  
  menuItems = [
    { 
      label: 'Sản phẩm', 
      route: '/danh-muc',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Tài khoản', route: '/danh-muc/TaiKhoan' },
        { label: 'Phần mềm', route: '/danh-muc/PhanMem' },
        { label: 'Khác', route: '/danh-muc/Khac' }
      ]
    },
    { 
      label: 'Dịch vụ', 
      hasDropdown: true,
      dropdownItems: [
        { label: 'Tăng tương tác', route: '#' },
        { label: 'Blockchain', route: '#' },
        { label: 'Dịch vụ phần mềm', route: '#' },
        { label: 'Khác', route: '#' }
      ]
    },
    { label: 'Hỗ trợ', hasDropdown: false },
    { label: 'Chia sẻ', hasDropdown: false },
    { label: 'Công cụ', hasDropdown: false }
  ];

  activeDropdown = signal<string | null>(null);

  constructor() {
    // effect() phải được gọi trong constructor (injection context)
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        // Chỉ check auth khi đang ở browser
        if (isPlatformBrowser(this.platformId)) {
          this.checkAuth();
        }
      });
      
      // Sync cart count from cart state service
      effect(() => {
        const count = this.cartStateService.getCartCount()();
        this.cartCount.set(count);
      });
    }
  }

  ngOnInit() {
    // Chỉ check auth khi đang ở browser
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuth();
      this.handleScroll();
      this.loadCartCount();
      this.loadBalance();
    }
  }

  @HostListener('window:scroll', [])
  handleScroll() {
    if (!isPlatformBrowser(this.platformId)) return;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.isScrolled.set(scrollTop > 20);
  }

  checkAuth() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.isAuthenticated.set(this.authService.isAuthenticated());
    this.currentUser.set(this.authService.getUser());
    
    // Load balance when authenticated
    if (this.authService.isAuthenticated()) {
      this.loadBalance();
    } else {
      this.balance.set(null);
    }
  }

  logout() {
    this.authService.logout();
    this.checkAuth();
  }

  toggleDropdown(label: string) {
    if (this.activeDropdown() === label) {
      this.activeDropdown.set(null);
    } else {
      this.activeDropdown.set(label);
    }
  }

  handleNavLinkClick(event: MouseEvent, label: string) {
    // Nếu click vào icon dropdown, không làm gì (sẽ được xử lý bởi handleDropdownToggle)
    const target = event.target as HTMLElement;
    if (target.closest('.nav-link-dropdown-toggle')) {
      event.preventDefault();
      return;
    }
    // Nếu click vào link, navigate và đóng dropdown nếu đang mở
    if (this.isDropdownOpen(label)) {
      this.closeDropdown();
    }
  }

  handleDropdownToggle(event: MouseEvent, label: string) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleDropdown(label);
  }

  closeDropdown() {
    this.activeDropdown.set(null);
  }

  isDropdownOpen(label: string): boolean {
    return this.activeDropdown() === label;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-item-wrapper')) {
      this.closeDropdown();
    }
    if (!target.closest('.profile-dropdown-wrapper')) {
      this.showProfileDropdown.set(false);
    }
  }

  toggleProfileDropdown() {
    this.showProfileDropdown.update(value => !value);
  }

  closeProfileDropdown() {
    this.showProfileDropdown.set(false);
  }

  formatBalance(amount: number | null | undefined): string {
    if (!amount) return '0';
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  loadBalance() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (this.authService.isAuthenticated()) {
      this.walletService.getBalance().subscribe({
        next: (balance) => {
          this.balance.set(balance);
        },
        error: (error) => {
          console.error('Error loading balance:', error);
          this.balance.set(null);
        }
      });
    } else {
      this.balance.set(null);
    }
  }

  isSeller(): boolean {
    return this.authService.isSeller();
  }

  navigateToShopManagement() {
    this.router.navigate(['/shop-management']);
    this.closeProfileDropdown();
  }

  navigateToAccountInfo() {
    this.router.navigate(['/account']);
    this.closeProfileDropdown();
  }

  navigateToOrders() {
    // TODO: Navigate to orders page
    this.closeProfileDropdown();
  }

  navigateToPaymentHistory() {
    // TODO: Navigate to payment history page
    this.closeProfileDropdown();
  }

  navigateToChangePassword() {
    // TODO: Navigate to change password page
    this.closeProfileDropdown();
  }

  onLogout() {
    this.logout();
    this.closeProfileDropdown();
  }

  loadCartCount() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (this.authService.isAuthenticated()) {
      this.cartService.getCart().subscribe({
        next: (response) => {
          this.cartStateService.setCartCount(response.totalItems);
        },
        error: (error) => {
          console.error('Error loading cart count:', error);
          this.cartStateService.setCartCount(0);
        }
      });
    } else {
      this.cartStateService.setCartCount(0);
    }
  }

  navigateToCart() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/cart']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
