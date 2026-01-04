import { Component, signal, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { GoogleAuthService } from '../../services/google-auth';
import { RegisterDto } from '../../models/auth.interfaces';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit, OnDestroy {
  registerForm: FormGroup;
  otpForm: FormGroup;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  agreeTerms = signal(false);
  agreePolicy = signal(false);
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
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update(value => !value);
  }

  toggleAgreeTerms() {
    this.agreeTerms.update(value => !value);
  }

  toggleAgreePolicy() {
    this.agreePolicy.update(value => !value);
  }

  requestOtp() {
    const email = this.registerForm.get('email')?.value;
    
    if (!email || this.registerForm.get('email')?.invalid) {
      this.errorMessage.set('Vui lòng nhập email hợp lệ trước');
      return;
    }

    this.isRequestingOtp.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.requestOtp(email, 'register').subscribe({
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

    const email = this.registerForm.get('email')?.value;
    const otpCode = this.otpForm.get('otpCode')?.value;

    this.isVerifyingOtp.set(true);
    this.errorMessage.set(null);

    this.authService.verifyOtp(email, otpCode, 'register').subscribe({
      next: (response) => {
        console.log('OTP verified:', response);
        this.isVerifyingOtp.set(false);
        this.otpVerified.set(true);
        this.successMessage.set('Mã OTP đã được xác thực thành công!');
        this.stopOtpTimer();
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

  onSubmit() {
    // Kiểm tra form hợp lệ
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Kiểm tra checkbox đồng ý
    if (!this.agreeTerms() || !this.agreePolicy()) {
      this.errorMessage.set('Vui lòng đồng ý với điều khoản và chính sách sử dụng');
      return;
    }

    // BẮT BUỘC phải verify OTP trước khi đăng ký (cho đăng ký thủ công)
    if (!this.otpVerified()) {
      this.errorMessage.set('Vui lòng xác thực email bằng mã OTP trước khi đăng ký');
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

    const registerData: RegisterDto = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      confirmPassword: this.registerForm.value.confirmPassword,
      otpCode: otpCode, // Bắt buộc gửi OTP code
      agreeToTerms: this.agreeTerms(),
      agreeToPolicy: this.agreePolicy(),
      role: 'user' // Default role
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Register successful:', response);
        this.isLoading.set(false);
        this.stopOtpTimer();
        // Redirect to home page after successful registration
        alert('Đăng ký thành công! Bạn đã được đăng nhập tự động.');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Register error:', error);
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
        );
      }
    });
  }

  onOtpInput(event: any) {
    const value = event.target.value.replace(/\D/g, ''); // Only numbers
    this.otpForm.patchValue({ otpCode: value }, { emitEvent: false });
  }

  ngOnInit() {
    // Initialize Google Sign-In when component loads
    if (isPlatformBrowser(this.platformId)) {
      // Wait for Google script to load
      const checkGoogle = setInterval(() => {
        if (this.googleAuthService.isGoogleLoaded()) {
          clearInterval(checkGoogle);
          
          // Initialize Google Sign-In với callback
          this.googleAuthService.initializeGoogleSignIn(
            (response) => this.handleGoogleSignIn(response),
            (error) => {
              console.error('Google Sign-In initialization error:', error);
              this.errorMessage.set('Không thể khởi tạo Google Sign-In. Vui lòng thử lại.');
            }
          );

          // Render Google button vào div có id="google-signin-button-register" (nếu có)
          setTimeout(() => {
            const buttonElement = document.getElementById('google-signin-button-register');
            if (buttonElement) {
              this.googleAuthService.renderButton(
                'google-signin-button-register',
                (response) => this.handleGoogleSignIn(response),
                (error) => {
                  console.error('Google button render error:', error);
                }
              );
            }
          }, 500);
        }
      }, 100);

      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
    }
  }

  registerWithGoogle() {
    // Đăng ký với Google KHÔNG CẦN OTP
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

    // Google button sẽ tự động trigger khi user click
    // Hoặc có thể trigger programmatically nếu cần
    // Button đã được render trong ngOnInit
  }

  /**
   * Handle Google Sign-In response
   * Google Identity Services trả về response.credential (JWT token)
   */
  private handleGoogleSignIn(response: any) {
    console.log('Google Sign-In response:', response);

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

    // Gọi backend API (backend tự động tạo tài khoản nếu chưa có)
    this.authService.loginWithGoogle({
      googleId: googleData.googleId,  // Từ payload.sub
      email: googleData.email,
      name: googleData.name
    }).subscribe({
      next: (authResponse) => {
        console.log('Register with Google successful:', authResponse);
        this.isLoading.set(false);
        // Backend tự động tạo tài khoản và trả về token
        alert('Đăng ký với Google thành công! Bạn đã được đăng nhập tự động.');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Register with Google error:', error);
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Đăng ký với Google thất bại. Vui lòng thử lại.'
        );
      }
    });
  }

  ngOnDestroy() {
    this.stopOtpTimer();
  }
}
