import { Component, signal, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { RegisterDto } from '../../models/auth.interfaces';

@Component({
  selector: 'app-email-verification',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './email-verification.html',
  styleUrl: './email-verification.css',
})
export class EmailVerification implements OnInit, OnDestroy {
  otpForm: FormGroup;
  isVerifyingOtp = signal(false);
  errorMessage = signal<string | null>(null);
  otpInputs = signal<string[]>(['', '', '', '', '']); // 5 ô input OTP như trong hình
  userEmail = signal<string>('');
  registrationData = signal<RegisterDto | null>(null);
  
  private platformId = inject(PLATFORM_ID);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.otpForm = this.fb.group({});
    
    // Tạo form controls cho 5 ô OTP riêng biệt
    for (let i = 0; i < 5; i++) {
      this.otpForm.addControl(`otp${i}`, this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)]));
    }
  }

  ngOnInit() {
    // Lấy email và registration data từ query params hoặc state
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      if (email) {
        this.userEmail.set(email);
      } else {
        // Nếu không có email trong query params, lấy từ sessionStorage
        const storedEmail = sessionStorage.getItem('verification_email');
        const storedData = sessionStorage.getItem('registration_data');
        
        if (storedEmail) {
          this.userEmail.set(storedEmail);
        }
        
        if (storedData) {
          try {
            this.registrationData.set(JSON.parse(storedData));
          } catch (e) {
            console.error('Error parsing registration data:', e);
          }
        }
      }
    });

    // Focus vào ô đầu tiên sau khi render
    setTimeout(() => {
      const firstInput = document.getElementById('otp-input-0');
      if (firstInput) {
        (firstInput as HTMLInputElement).focus();
      }
    }, 100);
  }

  verifyOtp() {
    // Lấy OTP từ 5 ô input riêng biệt
    const otpValues = this.otpInputs();
    const otpCode = otpValues.join('');
    
    if (otpCode.length !== 5) {
      this.errorMessage.set('Vui lòng nhập đầy đủ 5 chữ số');
      return;
    }

    const email = this.userEmail();

    if (!email) {
      this.errorMessage.set('Không tìm thấy thông tin email. Vui lòng quay lại trang đăng ký.');
      return;
    }

    this.isVerifyingOtp.set(true);
    this.errorMessage.set(null);

    this.authService.verifyOtp(email, otpCode, 'register').subscribe({
      next: (response) => {
        console.log('OTP verified:', response);
        this.isVerifyingOtp.set(false);
        
        // Nếu có registration data, hoàn tất đăng ký
        const regData = this.registrationData();
        if (regData) {
          this.completeRegistration(regData, otpCode);
        } else {
          // Nếu không có registration data, lấy từ sessionStorage
          const storedData = sessionStorage.getItem('registration_data');
          if (storedData) {
            try {
              const data = JSON.parse(storedData);
              data.otpCode = otpCode;
              this.completeRegistration(data, otpCode);
            } catch (e) {
              console.error('Error parsing registration data:', e);
              this.errorMessage.set('Lỗi khi xử lý dữ liệu đăng ký. Vui lòng thử lại.');
              this.isVerifyingOtp.set(false);
            }
          } else {
            // Chỉ verify OTP, không đăng ký ngay
            // Lưu trạng thái verified vào sessionStorage
            sessionStorage.setItem('email_verified', 'true');
            sessionStorage.setItem('verified_otp', otpCode);
            // Quay lại trang đăng ký để hoàn tất
            this.router.navigate(['/register'], { 
              queryParams: { email_verified: 'true' } 
            });
          }
        }
      },
      error: (error) => {
        console.error('Verify OTP error:', error);
        this.isVerifyingOtp.set(false);
        this.errorMessage.set(
          error.error?.message || 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.'
        );
        // Reset OTP inputs khi sai
        this.otpInputs.set(['', '', '', '', '']);
        for (let i = 0; i < 5; i++) {
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

  completeRegistration(registerData: RegisterDto, otpCode: string) {
    registerData.otpCode = otpCode;
    
    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Register successful:', response);
        // Xóa dữ liệu tạm
        sessionStorage.removeItem('registration_data');
        sessionStorage.removeItem('verification_email');
        sessionStorage.removeItem('email_verified');
        sessionStorage.removeItem('verified_otp');
        
        // Redirect to home page after successful registration
        alert('Đăng ký thành công! Bạn đã được đăng nhập tự động.');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Register error:', error);
        this.errorMessage.set(
          error.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
        );
        this.isVerifyingOtp.set(false);
      }
    });
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
    if (value && index < 4) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
    
    // Tự động verify nếu đã nhập đủ 5 số
    if (currentInputs.every(v => v !== '') && currentInputs.join('').length === 5) {
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
        const otpCode = text.replace(/\D/g, '').slice(0, 5);
        if (otpCode.length === 5) {
          const newInputs = otpCode.split('');
          this.otpInputs.set(newInputs);
          for (let i = 0; i < 5; i++) {
            this.otpForm.get(`otp${i}`)?.setValue(newInputs[i] || '', { emitEvent: false });
          }
          // Focus vào ô cuối cùng
          const lastInput = document.getElementById('otp-input-4');
          if (lastInput) {
            (lastInput as HTMLInputElement).focus();
          }
        }
      });
    }
  }

  goBackToRegister() {
    this.router.navigate(['/register']);
  }

  isOtpIncomplete(): boolean {
    const inputs = this.otpInputs();
    return inputs.some(v => !v) || this.isVerifyingOtp();
  }

  ngOnDestroy() {
    // Cleanup nếu cần
  }
}

