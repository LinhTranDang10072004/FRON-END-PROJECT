import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../config/environment';

declare global {
  interface Window {
    google?: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7088/api';
  private googleClientId: string | null = null;
  private isInitialized = false;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Lấy Google Client ID từ backend hoặc environment
   * Backend có thể cung cấp endpoint: GET /api/auth/google-client-id
   */
  getGoogleClientId(): Observable<string> {
    if (this.googleClientId) {
      return of(this.googleClientId);
    }

    // Thử lấy từ backend trước
    return this.http.get<{ clientId: string }>(`${this.apiUrl}/auth/google-client-id`).pipe(
      map(response => {
        if (response && response.clientId) {
          this.googleClientId = response.clientId;
          console.log('Google Client ID loaded from backend:', this.googleClientId);
          return response.clientId;
        }
        throw new Error('Invalid response from backend');
      }),
      catchError((error) => {
        // Nếu backend không có endpoint hoặc lỗi, lấy từ environment
        console.warn('Không thể lấy Google Client ID từ backend. Sử dụng giá trị từ environment.', error);
        
        // Lấy từ environment (đã import ở đầu file)
        if (environment.googleClientId) {
          this.googleClientId = environment.googleClientId;
          console.log('Google Client ID loaded from environment:', this.googleClientId);
          return of(environment.googleClientId);
        }
        
        // Nếu chưa có trong environment, trả về empty
        console.error('Google Client ID chưa được cấu hình. Vui lòng kiểm tra backend endpoint hoặc thêm vào environment.ts');
        return of('');
      })
    );
  }

  /**
   * Initialize Google Sign-In với Client ID từ backend
   */
  initializeGoogleSignIn(callback: (response: any) => void, onError?: (error: any) => void): void {
    if (!this.isBrowser) {
      console.warn('Google Sign-In chỉ hoạt động trong browser');
      return;
    }

    if (!window.google) {
      console.error('Google Identity Services chưa được load. Vui lòng kiểm tra script tag.');
      if (onError) {
        onError(new Error('Google Identity Services chưa được load'));
      }
      return;
    }

    // Lấy Client ID từ backend
    this.getGoogleClientId().subscribe({
      next: (clientId) => {
        if (!clientId) {
          const error = new Error('Google Client ID chưa được cấu hình');
          console.error(error);
          if (onError) {
            onError(error);
          }
          return;
        }

        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: callback,
          });
          this.isInitialized = true;
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
          if (onError) {
            onError(error);
          }
        }
      },
      error: (error) => {
        console.error('Error getting Google Client ID:', error);
        if (onError) {
          onError(error);
        }
      }
    });
  }

  /**
   * Trigger Google Sign-In bằng button click
   * Sử dụng Google Identity Services One Tap hoặc popup
   */
  signIn(callback: (response: any) => void, onError?: (error: any) => void): void {
    if (!this.isBrowser) {
      return;
    }

    if (!window.google) {
      console.error('Google Identity Services chưa được load');
      if (onError) {
        onError(new Error('Google Identity Services chưa được load'));
      }
      return;
    }

    if (!this.isInitialized) {
      // Initialize trước nếu chưa
      this.initializeGoogleSignIn(callback, onError);
      // Đợi một chút để initialize hoàn tất
      setTimeout(() => this.triggerSignIn(callback, onError), 500);
    } else {
      this.triggerSignIn(callback, onError);
    }
  }

  /**
   * Trigger Google Sign-In popup
   */
  private triggerSignIn(callback: (response: any) => void, onError?: (error: any) => void): void {
    if (!this.googleClientId) {
      this.getGoogleClientId().subscribe({
        next: (clientId) => {
          if (clientId) {
            this.doSignIn(clientId, callback, onError);
          } else {
            if (onError) {
              onError(new Error('Google Client ID chưa được cấu hình'));
            }
          }
        }
      });
    } else {
      this.doSignIn(this.googleClientId, callback, onError);
    }
  }

  private doSignIn(clientId: string, callback: (response: any) => void, onError?: (error: any) => void): void {
    try {
      // Sử dụng Google Identity Services để trigger sign-in
      // Option 1: Sử dụng One Tap (nếu user chưa đăng nhập)
      window.google.accounts.id.prompt((notification: any) => {
        // One Tap đã hiển thị hoặc bị skip
      });

      // Option 2: Sử dụng popup button (fallback)
      // Tạo button programmatically hoặc sử dụng button có sẵn trong HTML
      // Button sẽ được render trong HTML template
    } catch (error) {
      console.error('Error triggering Google Sign-In:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Render Google Sign-In button vào element
   */
  renderButton(elementId: string, callback: (response: any) => void, onError?: (error: any) => void): void {
    if (!this.isBrowser) {
      return;
    }

    if (!window.google) {
      console.error('Google Identity Services chưa được load');
      if (onError) {
        onError(new Error('Google Identity Services chưa được load'));
      }
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element với id "${elementId}" không tồn tại`);
      if (onError) {
        onError(new Error(`Element với id "${elementId}" không tồn tại`));
      }
      return;
    }

    this.getGoogleClientId().subscribe({
      next: (clientId) => {
        if (!clientId) {
          console.error('Google Client ID chưa được cấu hình');
          if (onError) {
            onError(new Error('Google Client ID chưa được cấu hình'));
          }
          return;
        }

        try {
          // Initialize với clientId
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: callback,
          });

          // Render button
          window.google.accounts.id.renderButton(
            element,
            {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              width: 300,
            }
          );
          
          console.log('Google Sign-In button rendered successfully with clientId:', clientId);
        } catch (error) {
          console.error('Error rendering Google button:', error);
          if (onError) {
            onError(error);
          }
        }
      },
      error: (error) => {
        console.error('Error getting Google Client ID for button render:', error);
        if (onError) {
          onError(error);
        }
      }
    });
  }

  /**
   * Decode JWT credential từ Google response.credential
   * Đây là cách đúng để lấy thông tin từ Google Identity Services
   */
  decodeJwtCredential(credential: string): any {
    try {
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      
      // Trả về đúng format theo API backend
      return {
        googleId: payload.sub,  // Google User ID từ payload.sub
        email: payload.email,
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
      };
    } catch (error) {
      console.error('Error decoding JWT credential:', error);
      return null;
    }
  }

  /**
   * Check if Google Identity Services is loaded
   */
  isGoogleLoaded(): boolean {
    return this.isBrowser && !!window.google;
  }

  /**
   * Check if Google Sign-In is initialized
   */
  isInitializedCheck(): boolean {
    return this.isInitialized && !!this.googleClientId;
  }
}
