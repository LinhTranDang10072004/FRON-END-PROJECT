import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { UserProfile, BankInfo } from '../../models/auth.interfaces';

@Component({
  selector: 'app-account-info',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './account-info.html',
  styleUrl: './account-info.css',
})
export class AccountInfo implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);

  profile = signal<UserProfile | null>(null);
  bankInfo = signal<BankInfo | null>(null);
  isLoading = signal(true);
  isLoadingBank = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Modal states
  showChangePasswordModal = signal(false);
  showBankInfoModal = signal(false);
  isToggling2FA = signal(false);
  isChangingPassword = signal(false);
  isSavingBankInfo = signal(false);
  
  // Form data
  passwordForm = signal({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  bankForm = signal({
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    bankBranch: ''
  });
  
  // Password visibility
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  
  // Error/Success messages
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  bankError = signal<string | null>(null);
  bankSuccess = signal<string | null>(null);

  ngOnInit() {
    this.loadProfile();
    this.loadBankInfo();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.getUserProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage.set('Không thể tải thông tin tài khoản');
        this.isLoading.set(false);
      }
    });
  }

  loadBankInfo() {
    this.isLoadingBank.set(true);
    this.authService.getBankInfo().subscribe({
      next: (info) => {
        this.bankInfo.set(info);
        // Populate form if bank info exists
        if (info.bankName || info.bankAccountNumber || info.bankAccountHolder || info.bankBranch) {
          this.bankForm.set({
            bankName: info.bankName || '',
            bankAccountNumber: info.bankAccountNumber || '',
            bankAccountHolder: info.bankAccountHolder || '',
            bankBranch: info.bankBranch || ''
          });
        }
        this.isLoadingBank.set(false);
      },
      error: (error) => {
        console.error('Error loading bank info:', error);
        this.isLoadingBank.set(false);
      }
    });
  }

  toggle2FA() {
    const profile = this.profile();
    if (!profile) return;
    
    this.isToggling2FA.set(true);
    const newValue = !profile.twoFactorEnabled;
    
    this.authService.toggle2FA({ enable: newValue }).subscribe({
      next: (response) => {
        this.profile.update(p => p ? { ...p, twoFactorEnabled: response.twoFactorEnabled } : null);
        this.isToggling2FA.set(false);
      },
      error: (error) => {
        console.error('Error toggling 2FA:', error);
        alert(error.error?.message || 'Không thể thay đổi trạng thái 2FA');
        this.isToggling2FA.set(false);
      }
    });
  }

  openChangePasswordModal() {
    // Check if user logged in with Google
    const profile = this.profile();
    if (profile?.googleId && !profile?.passwordHash) {
      alert('Tài khoản đăng nhập bằng Google không thể đổi mật khẩu.');
      return;
    }
    
    this.passwordForm.set({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.showChangePasswordModal.set(true);
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal.set(false);
    this.passwordForm.set({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
  }

  changePassword() {
    const form = this.passwordForm();
    
    // Validation
    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
      this.passwordError.set('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (form.newPassword.length < 6) {
      this.passwordError.set('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    
    if (form.newPassword !== form.confirmNewPassword) {
      this.passwordError.set('Mật khẩu nhập lại không khớp');
      return;
    }
    
    this.isChangingPassword.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    
    this.authService.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
      confirmNewPassword: form.confirmNewPassword
    }).subscribe({
      next: (response) => {
        this.passwordSuccess.set(response.message);
        this.isChangingPassword.set(false);
        
        // Clear form after 2 seconds
        setTimeout(() => {
          this.closeChangePasswordModal();
        }, 2000);
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.passwordError.set(error.error?.message || 'Đổi mật khẩu thất bại');
        this.isChangingPassword.set(false);
      }
    });
  }

  openBankInfoModal() {
    const bank = this.bankInfo();
    this.bankForm.set({
      bankName: bank?.bankName || '',
      bankAccountNumber: bank?.bankAccountNumber || '',
      bankAccountHolder: bank?.bankAccountHolder || '',
      bankBranch: bank?.bankBranch || ''
    });
    this.bankError.set(null);
    this.bankSuccess.set(null);
    this.showBankInfoModal.set(true);
  }

  closeBankInfoModal() {
    this.showBankInfoModal.set(false);
    this.bankError.set(null);
    this.bankSuccess.set(null);
  }

  saveBankInfo() {
    const form = this.bankForm();
    
    // Validation
    if (!form.bankName || !form.bankAccountNumber || !form.bankAccountHolder) {
      this.bankError.set('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    if (form.bankName.length > 100) {
      this.bankError.set('Tên ngân hàng không được vượt quá 100 ký tự');
      return;
    }
    
    if (form.bankAccountNumber.length > 50) {
      this.bankError.set('Số tài khoản không được vượt quá 50 ký tự');
      return;
    }
    
    if (form.bankAccountHolder.length > 100) {
      this.bankError.set('Tên chủ tài khoản không được vượt quá 100 ký tự');
      return;
    }
    
    if (form.bankBranch && form.bankBranch.length > 200) {
      this.bankError.set('Chi nhánh không được vượt quá 200 ký tự');
      return;
    }
    
    this.isSavingBankInfo.set(true);
    this.bankError.set(null);
    this.bankSuccess.set(null);
    
    this.authService.updateBankInfo({
      bankName: form.bankName,
      bankAccountNumber: form.bankAccountNumber,
      bankAccountHolder: form.bankAccountHolder,
      bankBranch: form.bankBranch || undefined
    }).subscribe({
      next: (response) => {
        this.bankInfo.set(response.bankInfo);
        this.bankSuccess.set(response.message);
        this.isSavingBankInfo.set(false);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          this.closeBankInfoModal();
        }, 2000);
      },
      error: (error) => {
        console.error('Error saving bank info:', error);
        this.bankError.set(error.error?.message || 'Cập nhật thông tin ngân hàng thất bại');
        this.isSavingBankInfo.set(false);
      }
    });
  }

  togglePasswordVisibility(type: 'current' | 'new' | 'confirm') {
    if (type === 'current') {
      this.showCurrentPassword.update(v => !v);
    } else if (type === 'new') {
      this.showNewPassword.update(v => !v);
    } else if (type === 'confirm') {
      this.showConfirmPassword.update(v => !v);
    }
  }

  // Level calculation
  getLevelInfo() {
    const profile = this.profile();
    if (!profile) return { level: 1, currentAmount: 0, nextLevelAmount: 1000000, progress: 0 };

    const totalAmount = profile.totalPurchaseAmount + (profile.totalSaleAmount || 0);
    const level = profile.level;
    
    // Level thresholds
    const thresholds = [
      0,           // Level 1
      1000000,     // Level 2
      5000000,     // Level 3
      10000000,    // Level 4
      50000000     // Level 5
    ];

    const currentThreshold = thresholds[level - 1] || 0;
    const nextThreshold = thresholds[level] || 50000000;
    const progress = ((totalAmount - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

    return {
      level,
      currentAmount: totalAmount,
      nextLevelAmount: nextThreshold,
      progress: Math.min(Math.max(progress, 0), 100)
    };
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  navigateToEdit() {
    this.router.navigate(['/account/edit']);
  }

  navigateToShop() {
    if (this.profile()?.role === 'seller') {
      this.router.navigate(['/shop-management']);
    } else {
      this.router.navigate(['/become-seller']);
    }
  }

  canChangePassword(): boolean {
    const profile = this.profile();
    // Can change password if not logged in with Google (no googleId or has passwordHash)
    return !!(profile && (!profile.googleId || profile.passwordHash));
  }

  // Helper methods for form updates
  updateCurrentPassword(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.passwordForm.update(f => ({ ...f, currentPassword: value }));
  }

  updateNewPassword(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.passwordForm.update(f => ({ ...f, newPassword: value }));
  }

  updateConfirmPassword(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.passwordForm.update(f => ({ ...f, confirmNewPassword: value }));
  }

  updateBankName(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.bankForm.update(f => ({ ...f, bankName: value }));
  }

  updateBankAccountHolder(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.bankForm.update(f => ({ ...f, bankAccountHolder: value }));
  }

  updateBankAccountNumber(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.bankForm.update(f => ({ ...f, bankAccountNumber: value }));
  }

  updateBankBranch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.bankForm.update(f => ({ ...f, bankBranch: value }));
  }

  // Get bank logo URL
  getBankLogo(bankName: string | null | undefined): string {
    if (!bankName) return '';
    
    // Map bank names to logo URLs (using CDN or local assets)
    const bankLogos: { [key: string]: string } = {
      'Vietcombank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_Vietcombank.svg/200px-Logo_Vietcombank.svg.png',
      'BIDV': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/BIDV_logo.svg/200px-BIDV_logo.svg.png',
      'Vietinbank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Vietinbank_logo.svg/200px-Vietinbank_logo.svg.png',
      'Agribank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Agribank_logo.svg/200px-Agribank_logo.svg.png',
      'Techcombank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Techcombank_logo.svg/200px-Techcombank_logo.svg.png',
      'ACB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/ACB_logo.svg/200px-ACB_logo.svg.png',
      'TPBank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/TPBank_logo.svg/200px-TPBank_logo.svg.png',
      'VPBank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/VPBank_logo.svg/200px-VPBank_logo.svg.png',
      'MBBank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/MBBank_logo.svg/200px-MBBank_logo.svg.png',
      'Sacombank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Sacombank_logo.svg/200px-Sacombank_logo.svg.png',
      'SHB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/SHB_logo.svg/200px-SHB_logo.svg.png',
      'VIB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/VIB_logo.svg/200px-VIB_logo.svg.png',
      'HDBank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/HDBank_logo.svg/200px-HDBank_logo.svg.png',
      'MSB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/MSB_logo.svg/200px-MSB_logo.svg.png',
      'OCB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/OCB_logo.svg/200px-OCB_logo.svg.png',
      'Eximbank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Eximbank_logo.svg/200px-Eximbank_logo.svg.png',
      'SeABank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/SeABank_logo.svg/200px-SeABank_logo.svg.png',
      'PGBank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/PGBank_logo.svg/200px-PGBank_logo.svg.png',
      'VietABank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/VietABank_logo.svg/200px-VietABank_logo.svg.png',
      'BacABank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/BacABank_logo.svg/200px-BacABank_logo.svg.png',
      'SCB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/SCB_logo.svg/200px-SCB_logo.svg.png'
    };

    // Try to find exact match first
    if (bankLogos[bankName]) {
      return bankLogos[bankName];
    }

    // Try case-insensitive match
    const normalizedName = bankName.toLowerCase();
    for (const [key, value] of Object.entries(bankLogos)) {
      if (key.toLowerCase() === normalizedName) {
        return value;
      }
    }

    // Return empty string if not found (will show fallback icon)
    return '';
  }

  // Check if bank has logo
  hasBankLogo(bankName: string | null | undefined): boolean {
    return !!this.getBankLogo(bankName);
  }
}
