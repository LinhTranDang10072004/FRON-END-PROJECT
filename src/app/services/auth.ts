import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { RegisterDto, LoginDto, GoogleLoginDto, AuthResponse, UserInfo, RefreshTokenDto, BecomeSellerDto, BecomeSellerResponse, SellerProductsResponse, ShopStats, UserProfile, UpdateUserProfileDto, Toggle2FADto, Toggle2FAResponse, ChangePasswordDto, ChangePasswordResponse, BankInfo, UpdateBankInfoDto, UpdateBankInfoResponse } from '../models/auth.interfaces';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  register(registerData: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData).pipe(
      tap(response => this.handleAuthResponse(response, registerData.agreeToTerms))
    );
  }

  login(loginData: LoginDto): Observable<AuthResponse> {
    // Login bắt buộc phải có otpCode
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData).pipe(
      tap(response => this.handleAuthResponse(response, loginData.rememberMe || false))
    );
  }

  loginWithGoogle(googleData: GoogleLoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login-google`, googleData).pipe(
      tap(response => this.handleAuthResponse(response, true))
    );
  }

  refreshToken(token: string, refreshToken: string): Observable<AuthResponse> {
    const refreshData: RefreshTokenDto = { token, refreshToken };
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, refreshData).pipe(
      tap(response => {
        if (this.isBrowser) {
          const rememberMe = localStorage.getItem('rememberMe') === 'true';
          this.handleAuthResponse(response, rememberMe);
        }
      })
    );
  }

  getCurrentUser(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.apiUrl}/auth/me`);
  }

  private handleAuthResponse(response: AuthResponse, rememberMe: boolean): void {
    if (!this.isBrowser) return;
    
    if (rememberMe) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('expiresAt', response.expiresAt);
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('user', JSON.stringify(response.user));
    } else {
      sessionStorage.setItem('token', response.token);
      sessionStorage.setItem('refreshToken', response.refreshToken);
      sessionStorage.setItem('expiresAt', response.expiresAt);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('rememberMe', 'false');
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (rememberMe) {
      return localStorage.getItem('token');
    }
    return sessionStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (rememberMe) {
      return localStorage.getItem('refreshToken');
    }
    return sessionStorage.getItem('refreshToken');
  }

  getUser(): UserInfo | null {
    if (!this.isBrowser) return null;
    
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const userStr = rememberMe 
      ? localStorage.getItem('user') 
      : sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    
    const token = this.getToken();
    if (!token) return false;
    
    // Kiểm tra token có expired không
    if (this.isTokenExpired()) {
      // Token đã hết hạn, xóa token và return false
      this.logout();
      return false;
    }
    
    return true;
  }

  logout(): void {
    if (!this.isBrowser) return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('expiresAt');
    sessionStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  isTokenExpired(): boolean {
    if (!this.isBrowser) return true;
    
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const expiresAt = rememberMe 
      ? localStorage.getItem('expiresAt') 
      : sessionStorage.getItem('expiresAt');
    
    if (!expiresAt) return true;
    
    return new Date(expiresAt) < new Date();
  }

  requestOtp(email: string, purpose: 'login' | 'register' = 'login'): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/request-otp`, {
      email,
      purpose
    });
  }

  verifyOtp(email: string, code: string, purpose: 'login' | 'register' = 'login'): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-otp`, {
      email,
      code,
      purpose
    });
  }

  // Seller Registration
  becomeSeller(data: BecomeSellerDto): Observable<BecomeSellerResponse> {
    return this.http.post<BecomeSellerResponse>(`${this.apiUrl}/auth/become-seller`, data).pipe(
      tap(response => {
        // ⚠️ QUAN TRỌNG: Lưu token mới ngay lập tức nếu có
        // Token mới có role = "seller" để tránh lỗi 403 khi tạo sản phẩm
        if (response.token && response.refreshToken && response.expiresAt) {
          const rememberMe = this.isBrowser && localStorage.getItem('rememberMe') === 'true';
          
          if (rememberMe) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('expiresAt', response.expiresAt);
            localStorage.setItem('user', JSON.stringify(response.user));
          } else {
            sessionStorage.setItem('token', response.token);
            sessionStorage.setItem('refreshToken', response.refreshToken);
            sessionStorage.setItem('expiresAt', response.expiresAt);
            sessionStorage.setItem('user', JSON.stringify(response.user));
          }
          
          console.log('Token mới đã được lưu với role = "seller"');
        }
      })
    );
  }

  // Shop Management
  getSellerProducts(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
  }): Observable<SellerProductsResponse> {
    let httpParams = new HttpParams();
    
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    
    return this.http.get<SellerProductsResponse>(`${this.apiUrl}/seller/products`, { params: httpParams });
  }

  getShopStats(): Observable<ShopStats> {
    return this.http.get<ShopStats>(`${this.apiUrl}/seller/stats`);
  }

  isSeller(): boolean {
    const user = this.getUser();
    return user?.role === 'seller';
  }

  // User Profile
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/auth/profile`);
  }

  updateUserProfile(data: UpdateUserProfileDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/auth/profile`, data);
  }

  // Google Client ID
  getGoogleClientId(): Observable<{ clientId: string }> {
    return this.http.get<{ clientId: string }>(`${this.apiUrl}/auth/google-client-id`);
  }

  // 2FA
  toggle2FA(data: Toggle2FADto): Observable<Toggle2FAResponse> {
    return this.http.post<Toggle2FAResponse>(`${this.apiUrl}/auth/toggle-2fa`, data);
  }

  // Change Password
  changePassword(data: ChangePasswordDto): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.apiUrl}/auth/change-password`, data);
  }

  // Bank Info
  getBankInfo(): Observable<BankInfo> {
    return this.http.get<BankInfo>(`${this.apiUrl}/auth/bank-info`);
  }

  updateBankInfo(data: UpdateBankInfoDto): Observable<UpdateBankInfoResponse> {
    return this.http.put<UpdateBankInfoResponse>(`${this.apiUrl}/auth/bank-info`, data);
  }
}
