import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../services/wallet';
import { AuthService } from '../../services/auth';
import { WalletBalance, WalletTransaction, TransactionHistoryResponse, WithdrawDto } from '../../models/wallet.interfaces';

@Component({
  selector: 'app-wallet-withdraw',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './wallet-withdraw.html',
  styleUrl: './wallet-withdraw.css',
})
export class WalletWithdraw implements OnInit {
  private walletService = inject(WalletService);
  authService = inject(AuthService);
  private router = inject(Router);

  balance = signal<WalletBalance | null>(null);
  withdrawals = signal<WalletTransaction[]>([]);
  isLoading = signal(true);
  isLoadingWithdrawals = signal(false);
  isSubmitting = signal(false);
  showConfirmModal = signal(false);
  searchQuery = signal('');
  timeFilter = signal('');

  // Form data
  withdrawForm = signal({
    amount: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    saveInfo: false
  });

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = signal(0);

  // Error messages
  formError = signal<string | null>(null);

  // Computed
  canWithdraw = computed(() => {
    const bal = this.balance();
    if (!bal) return false;
    return bal.availableBalance >= 500000;
  });

  freeWithdrawalsRemaining = signal(2); // TODO: Get from API

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.authService.isSeller()) {
      alert('Chỉ seller mới có quyền rút tiền!');
      this.router.navigate(['/account/wallet']);
      return;
    }

    this.loadBalance();
    this.loadWithdrawals();
    this.loadBankInfo();
  }

  loadBalance() {
    this.walletService.getBalance().subscribe({
      next: (balance) => {
        this.balance.set(balance);
      },
      error: (error) => {
        console.error('Error loading balance:', error);
      }
    });
  }

  loadBankInfo() {
    // Load saved bank info from user profile
    this.authService.getBankInfo().subscribe({
      next: (bankInfo) => {
        if (bankInfo.bankName && bankInfo.bankAccountHolder && bankInfo.bankAccountNumber) {
          this.withdrawForm.update(f => ({
            ...f,
            bankName: bankInfo.bankName || '',
            accountName: bankInfo.bankAccountHolder || '',
            accountNumber: bankInfo.bankAccountNumber || ''
          }));
        }
      },
      error: (error) => {
        console.error('Error loading bank info:', error);
      }
    });
  }

  loadWithdrawals() {
    this.isLoadingWithdrawals.set(true);
    
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.walletService.getWithdrawals(params).subscribe({
      next: (response) => {
        this.withdrawals.set(response.transactions);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.isLoadingWithdrawals.set(false);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading withdrawals:', error);
        this.isLoadingWithdrawals.set(false);
        this.isLoading.set(false);
      }
    });
  }

  validateForm(): boolean {
    const form = this.withdrawForm();
    const amount = parseFloat(form.amount.replace(/[^\d]/g, ''));

    if (!form.amount || amount < 500000) {
      this.formError.set('Số tiền tối thiểu là 500.000₫');
      return false;
    }

    if (amount % 100000 !== 0) {
      this.formError.set('Số tiền phải là bội số của 100.000₫');
      return false;
    }

    const balance = this.balance();
    if (balance && amount > balance.availableBalance) {
      this.formError.set('Số dư không đủ');
      return false;
    }

    if (!form.bankName) {
      this.formError.set('Vui lòng chọn ngân hàng');
      return false;
    }

    if (!form.accountName || form.accountName.trim().length === 0) {
      this.formError.set('Vui lòng nhập tên người thụ hưởng');
      return false;
    }

    if (!form.accountNumber || form.accountNumber.trim().length === 0) {
      this.formError.set('Vui lòng nhập số tài khoản');
      return false;
    }

    this.formError.set(null);
    return true;
  }

  openConfirmModal() {
    if (!this.validateForm()) {
      return;
    }
    this.showConfirmModal.set(true);
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
  }

  submitWithdraw() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting.set(true);
    const form = this.withdrawForm();
    const amount = parseFloat(form.amount.replace(/[^\d]/g, ''));

    const withdrawData: WithdrawDto = {
      amount: amount,
      bankName: form.bankName,
      accountName: form.accountName,
      accountNumber: form.accountNumber,
      description: `Rút tiền về ${form.bankName} - ${form.accountNumber}`
    };

    this.walletService.withdraw(withdrawData).subscribe({
      next: (transaction) => {
        this.isSubmitting.set(false);
        this.closeConfirmModal();
        
        // Save bank info if checkbox is checked
        if (form.saveInfo) {
          this.authService.updateBankInfo({
            bankName: form.bankName,
            bankAccountHolder: form.accountName,
            bankAccountNumber: form.accountNumber
          }).subscribe({
            next: () => {
              console.log('Bank info saved');
            },
            error: (error) => {
              console.error('Error saving bank info:', error);
            }
          });
        }

        // Reset form
        this.withdrawForm.set({
          amount: '',
          bankName: '',
          accountName: '',
          accountNumber: '',
          saveInfo: false
        });

        // Reload balance and withdrawals
        this.loadBalance();
        this.loadWithdrawals();
        
        alert('Yêu cầu rút tiền đã được gửi thành công!');
      },
      error: (error) => {
        console.error('Error withdrawing:', error);
        this.formError.set(error.error?.message || 'Rút tiền thất bại. Vui lòng thử lại.');
        this.isSubmitting.set(false);
      }
    });
  }

  updateAmount(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    // Remove non-numeric characters except for formatting
    const numericValue = value.replace(/[^\d]/g, '');
    this.withdrawForm.update(f => ({ ...f, amount: numericValue }));
  }

  updateBankName(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.withdrawForm.update(f => ({ ...f, bankName: value }));
  }

  updateAccountName(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.withdrawForm.update(f => ({ ...f, accountName: value }));
  }

  updateAccountNumber(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.withdrawForm.update(f => ({ ...f, accountNumber: value }));
  }

  toggleSaveInfo(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.withdrawForm.update(f => ({ ...f, saveInfo: checked }));
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadWithdrawals();
  }

  onTimeFilterChange() {
    this.currentPage.set(1);
    this.loadWithdrawals();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'Pending': 'Chờ xử lý',
      'Completed': 'Đã thanh toán',
      'Failed': 'Thất bại',
      'Cancelled': 'Đã hủy',
      'Processing': 'Đang thực hiện'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Pending': 'status-pending',
      'Completed': 'status-completed',
      'Failed': 'status-failed',
      'Cancelled': 'status-cancelled',
      'Processing': 'status-processing'
    };
    return classes[status] || '';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getBankLogo(bankName: string | undefined): string {
    if (!bankName) return '';
    const bankLogos: { [key: string]: string } = {
      'VCB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_Vietcombank.svg/200px-Logo_Vietcombank.svg.png',
      'Vietcombank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_Vietcombank.svg/200px-Logo_Vietcombank.svg.png',
      'MB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/MBBank_logo.svg/200px-MBBank_logo.svg.png',
      'MBBank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/MBBank_logo.svg/200px-MBBank_logo.svg.png',
    };
    return bankLogos[bankName] || '';
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadWithdrawals();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadWithdrawals();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(total);
      }
    }
    
    return pages;
  }

  getWithdrawAmount(): number {
    const form = this.withdrawForm();
    const numericValue = form.amount.replace(/[^\d]/g, '');
    return numericValue ? parseFloat(numericValue) : 0;
  }

  getFormattedAmount(): string {
    const amount = this.withdrawForm().amount;
    if (!amount) return '';
    const numericValue = amount.replace(/[^\d]/g, '');
    return numericValue ? this.formatPrice(parseFloat(numericValue)) : '';
  }

  parsePageSize(value: string): number {
    return parseInt(value, 10);
  }
}

