import { Component, signal, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-become-seller',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './become-seller.html',
  styleUrl: './become-seller.css',
})
export class BecomeSeller implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  sellerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentUser = signal<any>(null);

  constructor() {
    this.sellerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      cccd: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(20)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,20}$/)]],
      facebookLink: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    // Lấy thông tin user hiện tại
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        
        // Kiểm tra nếu đã là seller
        if (user.role === 'seller') {
          this.router.navigate(['/shop-management']);
          return;
        }

        // Điền email từ user hiện tại
        this.sellerForm.patchValue({
          email: user.email
        });
      },
      error: (error) => {
        console.error('Error getting current user:', error);
        // Nếu chưa đăng nhập, redirect về login
        this.router.navigate(['/login']);
      }
    });
  }

  onSubmit() {
    if (!this.sellerForm.valid) {
      this.sellerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = this.sellerForm.value;
    
    // Validate Facebook URL
    if (!this.isValidUrl(formData.facebookLink)) {
      this.errorMessage.set('Vui lòng nhập link Facebook hợp lệ (bắt đầu với http:// hoặc https://)');
      this.isLoading.set(false);
      return;
    }

    // Username sẽ được lấy từ thông tin user đã đăng nhập (không cần gửi lên)
    this.authService.becomeSeller(formData).subscribe({
      next: (response) => {
        console.log('Become seller successful:', response);
        this.isLoading.set(false);
        
        // Token mới đã được lưu tự động trong AuthService.becomeSeller()
        // Kiểm tra xem token mới đã được lưu chưa
        if (response.token) {
          console.log('✅ Token mới với role = "seller" đã được lưu');
          console.log('User role:', response.user.role);
        } else {
          console.warn('⚠️ Response không có token mới, có thể backend chưa trả về token');
          // Fallback: Cập nhật user info trong storage nếu không có token mới
          const user = this.authService.getUser();
          if (user) {
            user.role = 'seller';
            const rememberMe = localStorage.getItem('rememberMe') === 'true';
            if (rememberMe) {
              localStorage.setItem('user', JSON.stringify(user));
            } else {
              sessionStorage.setItem('user', JSON.stringify(user));
            }
          }
        }
        
        // Redirect to success page
        this.router.navigate(['/seller-success']);
      },
      error: (error) => {
        console.error('Become seller error:', error);
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Đăng ký seller thất bại. Vui lòng thử lại.'
        );
      }
    });
  }

  isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.sellerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) {
      return 'Trường này là bắt buộc';
    }
    if (field.errors['email']) {
      return 'Email không hợp lệ';
    }
    if (field.errors['minlength']) {
      return `Tối thiểu ${field.errors['minlength'].requiredLength} ký tự`;
    }
    if (field.errors['maxlength']) {
      return `Tối đa ${field.errors['maxlength'].requiredLength} ký tự`;
    }
    if (field.errors['pattern']) {
      if (fieldName === 'phone') {
        return 'Số điện thoại không hợp lệ (chỉ chứa số, 10-20 ký tự)';
      }
      return 'Định dạng không hợp lệ';
    }
    return '';
  }
}

