import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../services/wallet';
import { AuthService } from '../../services/auth';
import { WalletTransaction, TransactionHistoryResponse, ApproveTransactionDto } from '../../models/wallet.interfaces';

@Component({
  selector: 'app-admin-wallet',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-wallet.html',
  styleUrl: './admin-wallet.css',
})
export class AdminWallet implements OnInit {
  private walletService = inject(WalletService);
  authService = inject(AuthService);
  private router = inject(Router);

  // Tabs
  activeTab = signal<'pending' | 'transfers'>('pending');

  // Pending Transactions
  pendingTransactions = signal<WalletTransaction[]>([]);
  isLoadingPending = signal(true);
  pendingTypeFilter = signal<'all' | 'deposit' | 'withdrawal'>('all');

  // Pending Transfers
  pendingTransfers = signal<WalletTransaction[]>([]);
  isLoadingTransfers = signal(true);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = signal(0);

  // Modal
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  showTransferModal = signal(false);
  selectedTransaction = signal<WalletTransaction | null>(null);
  approveNote = signal('');
  rejectNote = signal('');
  isProcessing = signal(false);

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if user is admin
    const user = this.authService.getUser();
    if (user?.role !== 'admin') {
      alert('Bạn không có quyền truy cập trang này!');
      this.router.navigate(['/account/wallet']);
      return;
    }

    this.loadPendingTransactions();
  }

  switchTab(tab: 'pending' | 'transfers') {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    
    if (tab === 'pending') {
      this.loadPendingTransactions();
    } else {
      this.loadPendingTransfers();
    }
  }

  loadPendingTransactions() {
    this.isLoadingPending.set(true);
    
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    if (this.pendingTypeFilter() !== 'all') {
      params.type = this.pendingTypeFilter();
    }

    this.walletService.getPendingTransactions(params).subscribe({
      next: (response) => {
        this.pendingTransactions.set(response.transactions);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.isLoadingPending.set(false);
      },
      error: (error) => {
        console.error('Error loading pending transactions:', error);
        this.isLoadingPending.set(false);
      }
    });
  }

  loadPendingTransfers() {
    this.isLoadingTransfers.set(true);
    
    const params = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    this.walletService.getPendingTransfers(params).subscribe({
      next: (response) => {
        this.pendingTransfers.set(response.transactions);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.isLoadingTransfers.set(false);
      },
      error: (error) => {
        console.error('Error loading pending transfers:', error);
        this.isLoadingTransfers.set(false);
      }
    });
  }

  openApproveModal(transaction: WalletTransaction) {
    this.selectedTransaction.set(transaction);
    this.approveNote.set('');
    this.showApproveModal.set(true);
  }

  openRejectModal(transaction: WalletTransaction) {
    this.selectedTransaction.set(transaction);
    this.rejectNote.set('');
    this.showRejectModal.set(true);
  }

  openTransferModal(transaction: WalletTransaction) {
    this.selectedTransaction.set(transaction);
    this.showTransferModal.set(true);
  }

  closeModals() {
    this.showApproveModal.set(false);
    this.showRejectModal.set(false);
    this.showTransferModal.set(false);
    this.selectedTransaction.set(null);
    this.approveNote.set('');
    this.rejectNote.set('');
  }

  approveDeposit() {
    const transaction = this.selectedTransaction();
    if (!transaction) return;

    this.isProcessing.set(true);
    const data: ApproveTransactionDto = {
      status: 'Completed',
      note: this.approveNote() || undefined
    };

    this.walletService.approveDeposit(transaction.id, data).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeModals();
        this.loadPendingTransactions();
        alert('Đã xác nhận nạp tiền thành công!');
      },
      error: (error) => {
        console.error('Error approving deposit:', error);
        this.isProcessing.set(false);
        alert('Xác nhận thất bại: ' + (error.error?.message || 'Vui lòng thử lại'));
      }
    });
  }

  rejectDeposit() {
    const transaction = this.selectedTransaction();
    if (!transaction) return;

    if (!this.rejectNote().trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    this.isProcessing.set(true);
    const data: ApproveTransactionDto = {
      status: 'Failed',
      note: this.rejectNote()
    };

    this.walletService.rejectDeposit(transaction.id, data).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeModals();
        this.loadPendingTransactions();
        alert('Đã từ chối nạp tiền');
      },
      error: (error) => {
        console.error('Error rejecting deposit:', error);
        this.isProcessing.set(false);
        alert('Từ chối thất bại: ' + (error.error?.message || 'Vui lòng thử lại'));
      }
    });
  }

  approveWithdrawal() {
    const transaction = this.selectedTransaction();
    if (!transaction) return;

    this.isProcessing.set(true);
    const data: ApproveTransactionDto = {
      status: 'Completed',
      note: this.approveNote() || undefined
    };

    this.walletService.approveWithdrawal(transaction.id, data).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeModals();
        this.loadPendingTransactions();
        alert('Đã xác nhận rút tiền thành công!');
      },
      error: (error) => {
        console.error('Error approving withdrawal:', error);
        this.isProcessing.set(false);
        alert('Xác nhận thất bại: ' + (error.error?.message || 'Vui lòng thử lại'));
      }
    });
  }

  rejectWithdrawal() {
    const transaction = this.selectedTransaction();
    if (!transaction) return;

    if (!this.rejectNote().trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    this.isProcessing.set(true);
    const data: ApproveTransactionDto = {
      status: 'Failed',
      note: this.rejectNote()
    };

    this.walletService.rejectWithdrawal(transaction.id, data).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeModals();
        this.loadPendingTransactions();
        alert('Đã từ chối rút tiền');
      },
      error: (error) => {
        console.error('Error rejecting withdrawal:', error);
        this.isProcessing.set(false);
        alert('Từ chối thất bại: ' + (error.error?.message || 'Vui lòng thử lại'));
      }
    });
  }

  transferToSeller() {
    const transaction = this.selectedTransaction();
    if (!transaction) return;

    this.isProcessing.set(true);

    this.walletService.transferToSeller(transaction.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeModals();
        this.loadPendingTransfers();
        alert('Đã chuyển tiền cho seller thành công!');
      },
      error: (error) => {
        console.error('Error transferring to seller:', error);
        this.isProcessing.set(false);
        alert('Chuyển tiền thất bại: ' + (error.error?.message || 'Vui lòng thử lại'));
      }
    });
  }

  onPendingTypeFilterChange(type: 'all' | 'deposit' | 'withdrawal') {
    this.pendingTypeFilter.set(type);
    this.currentPage.set(1);
    this.loadPendingTransactions();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    if (this.activeTab() === 'pending') {
      this.loadPendingTransactions();
    } else {
      this.loadPendingTransfers();
    }
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    if (this.activeTab() === 'pending') {
      this.loadPendingTransactions();
    } else {
      this.loadPendingTransfers();
    }
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

  parsePageSize(value: string): number {
    return parseInt(value, 10);
  }

  isOverDeadline(transaction: WalletTransaction): boolean {
    if (!transaction.reportDeadline) return false;
    return new Date(transaction.reportDeadline) < new Date();
  }
}

