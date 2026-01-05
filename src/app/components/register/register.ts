import { Component, signal, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
  isAuthenticated = signal(false);
  showRegisterForm = signal(true);
  
  // OTP states
  showOtpSection = signal(false);
  showOtpScreen = signal(false); // Màn hình OTP riêng biệt
  isRequestingOtp = signal(false);
  isVerifyingOtp = signal(false);
  otpVerified = signal(false);
  otpTimer = signal(300); // 5 minutes in seconds
  otpTimerInterval: any;
  otpInputs = signal<string[]>(['', '', '', '', '', '']); // 6 ô input OTP
  userEmail = signal<string>(''); // Lưu email để hiển thị

  private platformId = inject(PLATFORM_ID);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
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
    
    // Tạo form controls cho 6 ô OTP riêng biệt
    for (let i = 0; i < 6; i++) {
      this.otpForm.addControl(`otp${i}`, this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)]));
    }
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

    // Kiểm tra form đăng ký có hợp lệ không (trừ OTP)
    if (!this.registerForm.get('username')?.valid || 
        !this.registerForm.get('password')?.valid || 
        !this.registerForm.get('confirmPassword')?.valid) {
      this.errorMessage.set('Vui lòng điền đầy đủ thông tin đăng ký trước khi xác thực email');
      this.registerForm.markAllAsTouched();
      return;
    }

    // Kiểm tra checkbox đồng ý
    if (!this.agreeTerms() || !this.agreePolicy()) {
      this.errorMessage.set('Vui lòng đồng ý với điều khoản và chính sách sử dụng');
      return;
    }

    this.isRequestingOtp.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.requestOtp(email, 'register').subscribe({
      next: (response) => {
        console.log('OTP sent:', response);
        this.isRequestingOtp.set(false);
        this.userEmail.set(email);
        
        // Lưu dữ liệu đăng ký vào sessionStorage
        const registerData: RegisterDto = {
          username: this.registerForm.value.username,
          email: this.registerForm.value.email,
          password: this.registerForm.value.password,
          confirmPassword: this.registerForm.value.confirmPassword,
          otpCode: '', // Sẽ được điền sau khi verify
          agreeToTerms: this.agreeTerms(),
          agreeToPolicy: this.agreePolicy(),
          role: 'user'
        };
        
        sessionStorage.setItem('registration_data', JSON.stringify(registerData));
        sessionStorage.setItem('verification_email', email);
        
        // Chuyển đến trang xác thực email
        this.router.navigate(['/verify-email'], { 
          queryParams: { email: email } 
        });
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
    // Lấy OTP từ 6 ô input riêng biệt
    const otpValues = this.otpInputs();
    const otpCode = otpValues.join('');
    
    if (otpCode.length !== 6) {
      this.errorMessage.set('Vui lòng nhập đầy đủ 6 chữ số');
      return;
    }

    const email = this.userEmail() || this.registerForm.get('email')?.value;

    this.isVerifyingOtp.set(true);
    this.errorMessage.set(null);

    this.authService.verifyOtp(email, otpCode, 'register').subscribe({
      next: (response) => {
        console.log('OTP verified:', response);
        this.isVerifyingOtp.set(false);
        this.otpVerified.set(true);
        // Cập nhật otpForm với mã OTP đã verify
        this.otpForm.patchValue({ otpCode: otpCode });
        // Quay lại màn hình đăng ký
        this.showOtpScreen.set(false);
        this.successMessage.set('Mã OTP đã được xác thực thành công!');
        this.stopOtpTimer();
      },
      error: (error) => {
        console.error('Verify OTP error:', error);
        this.isVerifyingOtp.set(false);
        this.errorMessage.set(
          error.error?.message || 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.'
        );
        // Reset OTP inputs khi sai
        this.otpInputs.set(['', '', '', '', '', '']);
        for (let i = 0; i < 6; i++) {
          this.otpForm.get(`otp${i}`)?.setValue('');
        }
        // Focus lại ô đầu tiên
        setTimeout(() => {
          const firstInput = document.getElementById('otp-input-0');
          if (firstInput) {
            (firstInput as HTMLInputElement).focus();
          }
        }, 100);
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

    // Với đăng ký bằng email, chuyển đến trang xác thực
    // onSubmit chỉ được gọi khi user click "Đăng ký" sau khi đã verify email
    // Nhưng thực tế, việc đăng ký sẽ được xử lý ở trang verification
    // Nên ở đây chỉ cần request OTP và chuyển đến trang verification
    this.requestOtp();
  }

  onOtpInput(event: any, index: number) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Only numbers
    
    // Chỉ cho phép 1 chữ số
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    // Cập nhật giá trị
    const currentInputs = [...this.otpInputs()];
    currentInputs[index] = value;
    this.otpInputs.set(currentInputs);
    
    // Cập nhật form control
    this.otpForm.get(`otp${index}`)?.setValue(value, { emitEvent: false });
    
    // Tự động chuyển sang ô tiếp theo nếu có giá trị
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
    
    // Tự động verify nếu đã nhập đủ 6 số
    if (currentInputs.every(v => v !== '') && currentInputs.join('').length === 6) {
      setTimeout(() => {
        this.verifyOtp();
      }, 300);
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    // Xử lý phím Backspace
    if (event.key === 'Backspace' && !this.otpInputs()[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
    
    // Xử lý phím Paste
    if (event.ctrlKey && event.key === 'v') {
      event.preventDefault();
      navigator.clipboard.readText().then(text => {
        const otpCode = text.replace(/\D/g, '').slice(0, 6);
        if (otpCode.length === 6) {
          const newInputs = otpCode.split('');
          this.otpInputs.set(newInputs);
          for (let i = 0; i < 6; i++) {
            this.otpForm.get(`otp${i}`)?.setValue(newInputs[i] || '', { emitEvent: false });
          }
          // Focus vào ô cuối cùng
          const lastInput = document.getElementById('otp-input-5');
          if (lastInput) {
            (lastInput as HTMLInputElement).focus();
          }
        }
      });
    }
  }

  goBackToRegister() {
    this.showOtpScreen.set(false);
    this.stopOtpTimer();
    this.otpInputs.set(['', '', '', '', '', '']);
    for (let i = 0; i < 6; i++) {
      this.otpForm.get(`otp${i}`)?.setValue('');
    }
    this.errorMessage.set(null);
  }

  isOtpIncomplete(): boolean {
    const inputs = this.otpInputs();
    return inputs.some(v => !v) || this.isVerifyingOtp();
  }

  ngOnInit() {
    // Kiểm tra nếu user đã đăng nhập thì ẩn form đăng ký
    if (isPlatformBrowser(this.platformId)) {
      const authenticated = this.authService.isAuthenticated();
      this.isAuthenticated.set(authenticated);
      
      if (authenticated) {
        this.showRegisterForm.set(false);
        // Redirect về trang chủ sau 2 giây
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
        return;
      }

      // Kiểm tra nếu email đã được verify (khi quay lại từ trang verification)
      this.route.queryParams.subscribe(params => {
        if (params['email_verified'] === 'true') {
          const verifiedOtp = sessionStorage.getItem('verified_otp');
          if (verifiedOtp) {
            // Email đã được verify, nhưng registration đã được xử lý ở trang verification
            // Chỉ cần clear sessionStorage và hiển thị thông báo
            sessionStorage.removeItem('email_verified');
            sessionStorage.removeItem('verified_otp');
            this.successMessage.set('Email đã được xác thực thành công!');
          }
        }
      });
    }

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

          // Render Google button với config responsive cho mobile và desktop
          setTimeout(() => {
            const buttonElement = document.getElementById('google-signin-button-register');
            if (buttonElement) {
              // Detect mobile device
              const isMobile = window.innerWidth <= 768;
              
              this.googleAuthService.renderButton(
                'google-signin-button-register',
                (response) => this.handleGoogleSignIn(response),
                (error) => {
                  console.error('Google button render error:', error);
                },
                isMobile // Pass mobile flag
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
