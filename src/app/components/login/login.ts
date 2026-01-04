import { Component, signal, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { GoogleAuthService } from '../../services/google-auth';
import { LoginDto } from '../../models/auth.interfaces';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, OnDestroy {
  loginForm: FormGroup;
  otpForm: FormGroup;
  showPassword = signal(false);
  rememberMe = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  // OTP states
  showOtpSection = signal(false);
  isRequestingOtp = signal(false);
  isVerifyingOtp = signal(false);
  otpVerified = signal(false);
  otpTimer = signal(300); // 5 minutes in seconds
  otpTimerInterval: any;

  private platformId = inject(PLATFORM_ID);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private googleAuthService: GoogleAuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  toggleRememberMe() {
    this.rememberMe.update(value => !value);
  }

  requestOtp() {
    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;
    
    if (!email || this.loginForm.get('email')?.invalid) {
      this.errorMessage.set('Vui lòng nhập email hợp lệ trước');
      return;
    }

    if (!password || this.loginForm.get('password')?.invalid) {
      this.errorMessage.set('Vui lòng nhập mật khẩu trước');
      return;
    }

    this.isRequestingOtp.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.requestOtp(email, 'login').subscribe({
      next: (response) => {
        console.log('OTP sent:', response);
        this.isRequestingOtp.set(false);
        this.showOtpSection.set(true);
        this.successMessage.set('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email.');
        this.startOtpTimer();
      },
      error: (error) => {
        console.error('Request OTP error:', error);
        this.isRequestingOtp.set(false);
        this.errorMessage.set(
          error.error?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.'
        );
      }
    });
  }

  verifyOtp() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const otpCode = this.otpForm.get('otpCode')?.value;

    this.isVerifyingOtp.set(true);
    this.errorMessage.set(null);

    this.authService.verifyOtp(email, otpCode, 'login').subscribe({
      next: (response) => {
        console.log('OTP verified:', response);
        this.isVerifyingOtp.set(false);
        this.otpVerified.set(true);
        this.successMessage.set('Mã OTP đã được xác thực thành công!');
        this.stopOtpTimer();
        // Tự động đăng nhập sau khi verify OTP
        this.onSubmit();
      },
      error: (error) => {
        console.error('Verify OTP error:', error);
        this.isVerifyingOtp.set(false);
        this.errorMessage.set(
          error.error?.message || 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.'
        );
      }
    });
  }

  startOtpTimer() {
    this.otpTimer.set(300); // 5 minutes
    this.otpTimerInterval = setInterval(() => {
      const current = this.otpTimer();
      if (current > 0) {
        this.otpTimer.set(current - 1);
      } else {
        this.stopOtpTimer();
        this.errorMessage.set('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
        this.showOtpSection.set(false);
        this.otpVerified.set(false);
      }
    }, 1000);
  }

  stopOtpTimer() {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
  }

  formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onOtpInput(event: any) {
    const value = event.target.value.replace(/\D/g, ''); // Only numbers
    this.otpForm.patchValue({ otpCode: value }, { emitEvent: false });
  }

  onSubmit() {
    // Kiểm tra form hợp lệ
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // BẮT BUỘC phải verify OTP trước khi đăng nhập
    if (!this.otpVerified()) {
      this.errorMessage.set('Vui lòng xác thực email bằng mã OTP trước khi đăng nhập');
      if (!this.showOtpSection()) {
        // Tự động request OTP nếu chưa request
        this.requestOtp();
      }
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const otpCode = this.otpForm.get('otpCode')?.value;

    const loginData: LoginDto = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      otpCode: otpCode, // Bắt buộc gửi OTP code
      rememberMe: this.rememberMe()
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.isLoading.set(false);
        this.stopOtpTimer();
        // Redirect to home or dashboard
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email, mật khẩu và mã OTP.'
        );
      }
    });
  }

  ngOnInit() {
    // Initialize Google Sign-In when component loads
    if (isPlatformBrowser(this.platformId)) {
      // Wait for Google script to load
      const checkGoogle = setInterval(() => {
        if (this.googleAuthService.isGoogleLoaded()) {
          clearInterval(checkGoogle);
          
          // Lấy Client ID từ API trước khi initialize
          this.googleAuthService.getGoogleClientId().subscribe({
            next: (clientId) => {
              if (!clientId) {
                console.error('Google Client ID chưa được cấu hình');
                this.errorMessage.set('Google Client ID chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
                return;
              }

              // Initialize Google Sign-In với callback
              this.googleAuthService.initializeGoogleSignIn(
                (response) => this.handleGoogleSignIn(response),
                (error) => {
                  console.error('Google Sign-In initialization error:', error);
                  this.errorMessage.set('Không thể khởi tạo Google Sign-In. Vui lòng thử lại.');
                }
              );

              // Render Google button vào div có id="google-signin-button" (nếu có)
              setTimeout(() => {
                const buttonElement = document.getElementById('google-signin-button');
                if (buttonElement) {
                  this.googleAuthService.renderButton(
                    'google-signin-button',
                    (response) => this.handleGoogleSignIn(response),
                    (error) => {
                      console.error('Google button render error:', error);
                      // Hiển thị fallback button nếu Google button không render được
                      const fallbackButton = document.getElementById('google-signin-fallback');
                      if (fallbackButton) {
                        (fallbackButton as HTMLElement).style.display = 'block';
                      }
                    }
                  );
                } else {
                  // Nếu không tìm thấy element, hiển thị fallback button
                  const fallbackButton = document.getElementById('google-signin-fallback');
                  if (fallbackButton) {
                    (fallbackButton as HTMLElement).style.display = 'block';
                  }
                }
              }, 500);
            },
            error: (error) => {
              console.error('Error getting Google Client ID:', error);
              this.errorMessage.set('Không thể lấy Google Client ID từ server. Vui lòng thử lại sau.');
            }
          });
        }
      }, 100);

      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
    }
  }

  loginWithGoogle() {
    // Đăng nhập Google KHÔNG CẦN OTP
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.googleAuthService.isGoogleLoaded()) {
      this.errorMessage.set('Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau.');
      this.isLoading.set(false);
      return;
    }

    // Lấy Client ID và trigger Google Sign-In
    this.googleAuthService.getGoogleClientId().subscribe({
      next: (clientId) => {
        if (!clientId) {
          this.errorMessage.set('Google Client ID chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
          this.isLoading.set(false);
          return;
        }

        try {
          // Sử dụng Google Identity Services để trigger sign-in
          // Khởi tạo lại với clientId đúng
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => this.handleGoogleSignIn(response),
          });

          // Trigger One Tap hoặc popup
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // One Tap không hiển thị, trigger popup bằng cách render button programmatically
              // Hoặc sử dụng method khác để trigger sign-in
              console.log('One Tap not displayed, using button instead');
            }
          });
        } catch (error) {
          console.error('Error triggering Google Sign-In:', error);
          this.isLoading.set(false);
          this.errorMessage.set('Không thể đăng nhập với Google. Vui lòng thử lại.');
        }
      },
      error: (error) => {
        console.error('Error getting Google Client ID:', error);
        this.errorMessage.set('Không thể lấy Google Client ID. Vui lòng thử lại sau.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Handle Google Sign-In response
   * Google Identity Services trả về response.credential (JWT token)
   * LƯU Ý: Đăng nhập Google KHÔNG CẦN OTP - Google đã xác thực user
   */
  private handleGoogleSignIn(response: any) {
    console.log('Google Sign-In response:', response);

    // Reset OTP states vì Google login không cần OTP
    this.showOtpSection.set(false);
    this.otpVerified.set(false);
    this.stopOtpTimer();

    // Google Identity Services trả về response.credential (JWT token)
    let credential: string;
    
    if (typeof response === 'string') {
      // Direct credential string
      credential = response;
    } else if (response.credential) {
      // Response object with credential property
      credential = response.credential;
    } else {
      this.isLoading.set(false);
      this.errorMessage.set('Không thể lấy thông tin từ Google. Vui lòng thử lại.');
      return;
    }

    // Decode JWT credential để lấy googleId, email, name
    const googleData = this.googleAuthService.decodeJwtCredential(credential);

    if (!googleData || !googleData.googleId) {
      this.isLoading.set(false);
      this.errorMessage.set('Không thể decode thông tin từ Google. Vui lòng thử lại.');
      return;
    }

    console.log('Decoded Google data:', googleData);

    // Set loading state
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Gọi backend API với thông tin từ Google
    // API này KHÔNG YÊU CẦU OTP - Google đã xác thực user
    this.authService.loginWithGoogle({
      googleId: googleData.googleId,  // Từ payload.sub
      email: googleData.email,
      name: googleData.name
    }).subscribe({
      next: (authResponse) => {
        console.log('Login with Google successful:', authResponse);
        this.isLoading.set(false);
        this.successMessage.set('Đăng nhập với Google thành công!');
        // Redirect to home after short delay
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 500);
      },
      error: (error) => {
        console.error('Login with Google error:', error);
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Đăng nhập với Google thất bại. Vui lòng thử lại.'
        );
      }
    });
  }

  ngOnDestroy() {
    this.stopOtpTimer();
  }
}
