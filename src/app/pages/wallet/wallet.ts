import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../services/wallet';
import { AuthService } from '../../services/auth';
import { WalletBalance, WalletTransaction, TransactionHistoryResponse } from '../../models/wallet.interfaces';

@Component({
  selector: 'app-wallet',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './wallet.html',
  styleUrl: './wallet.css',
})
export class Wallet implements OnInit {
  private walletService = inject(WalletService);
  authService = inject(AuthService); // Public for template
  private router = inject(Router);

  balance = signal<WalletBalance | null>(null);
  transactions = signal<WalletTransaction[]>([]);
  isLoading = signal(true);
  isLoadingTransactions = signal(false);
  errorMessage = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  transactionType = signal<'all' | 'deposit' | 'withdrawal' | 'purchase'>('all');
  timeFilter = signal('');
  showTypeDropdown = signal(false);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = signal(0);

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadBalance();
    this.loadTransactions();
  }

  loadBalance() {
    this.walletService.getBalance().subscribe({
      next: (balance) => {
        this.balance.set(balance);
      },
      error: (error) => {
        console.error('Error loading balance:', error);
        this.errorMessage.set('Không thể tải số dư. Vui lòng thử lại.');
      }
    });
  }

  loadTransactions() {
    this.isLoadingTransactions.set(true);
    
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    if (this.transactionType() !== 'all') {
      params.type = this.transactionType();
    }

    this.walletService.getTransactions(params).subscribe({
      next: (response) => {
        this.transactions.set(response.transactions);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.isLoadingTransactions.set(false);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.errorMessage.set('Không thể tải lịch sử giao dịch. Vui lòng thử lại.');
        this.isLoadingTransactions.set(false);
        this.isLoading.set(false);
      }
    });
  }

  onSearch() {
    // TODO: Implement search if API supports it
    this.loadTransactions();
  }

  onTypeFilterChange(type: 'all' | 'deposit' | 'withdrawal' | 'purchase') {
    this.transactionType.set(type);
    this.showTypeDropdown.set(false);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  onTimeFilterChange() {
    // TODO: Implement time filter if API supports it
    this.currentPage.set(1);
    this.loadTransactions();
  }

  clearFilters() {
    this.searchQuery.set('');
    this.transactionType.set('all');
    this.timeFilter.set('');
    this.currentPage.set(1);
    this.loadTransactions();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadTransactions();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  getTransactionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'Deposit': 'Nạp tiền',
      'Withdrawal': 'Rút tiền',
      'Purchase': 'Mua hàng',
      'TransferToSeller': 'Chuyển cho seller',
      'Refund': 'Hoàn tiền'
    };
    return labels[type] || type;
  }

  getTransactionTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'Deposit': 'type-deposit',
      'Withdrawal': 'type-withdrawal',
      'Purchase': 'type-purchase',
      'TransferToSeller': 'type-transfer',
      'Refund': 'type-refund'
    };
    return classes[type] || '';
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

  navigateToDeposit() {
    this.router.navigate(['/account/wallet/deposit']);
  }

  navigateToWithdraw() {
    this.router.navigate(['/account/wallet/withdraw']);
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
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }
    
    return pages;
  }

  toggleTypeDropdown() {
    this.showTypeDropdown.update(v => !v);
  }

  parsePageSize(value: string): number {
    return parseInt(value, 10);
  }
}

