import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { WalletService } from '../../services/wallet';
import { AuthService } from '../../services/auth';
import { WalletTransaction, TransactionHistoryResponse, DepositQrResponse } from '../../models/wallet.interfaces';

@Component({
  selector: 'app-wallet-deposit',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './wallet-deposit.html',
  styleUrl: './wallet-deposit.css',
})
export class WalletDeposit implements OnInit {
  private walletService = inject(WalletService);
  authService = inject(AuthService);
  private router = inject(Router);

  // QR Code and Admin account info from API
  qrData = signal<DepositQrResponse | null>(null);
  qrCodeBase64 = signal<string | null>(null); // Generated QR code from frontend
  isLoadingQr = signal(true);
  qrError = signal<string | null>(null);
  selectedFormat = signal<number>(7); // Format từ backend (1-7, mặc định 7 - VietQR.io API - Khuyến nghị)

  deposits = signal<WalletTransaction[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  timeFilter = signal('');
  
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
    this.loadDepositQr();
    this.loadDeposits();
  }

  loadDepositQr() {
    this.isLoadingQr.set(true);
    this.qrError.set(null);
    
    // Luôn dùng Format 7 (VietQR.io API)
    const format = 7;
    
    this.walletService.getDepositQr(format, false).subscribe({
      next: (response) => {
        this.qrData.set(response);
        this.selectedFormat.set(format);
        
        // Nếu backend đã trả về QR code base64, dùng luôn
        if (response.qrCodeBase64) {
          this.qrCodeBase64.set(response.qrCodeBase64);
          this.isLoadingQr.set(false);
        } else {
          // Nếu không, generate từ frontend (fallback)
          this.generateQrCode(response);
        }
      },
      error: (error) => {
        console.error('Error loading deposit QR:', error);
        this.qrError.set('Không thể tải QR code. Vui lòng thử lại.');
        this.isLoadingQr.set(false);
      }
    });
  }

  /**
   * Generate QR code from frontend (fallback nếu backend không trả về)
   * Format 4: VietQR URL
   */
  async generateQrCode(qrData: DepositQrResponse) {
    try {
      const bankCode = qrData.bankCode || '970436'; // VCB BIN code
      const accountNumber = qrData.accountNumber;
      const transferContent = qrData.transferContent;
      const accountName = qrData.accountName;
      
      // Format 4: VietQR URL
      const qrContent = `https://vietqr.io/${bankCode}/${accountNumber}?addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;
      
      // Generate QR code as base64
      const qrCodeDataUrl: string = await QRCode.toDataURL(qrContent, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      this.qrCodeBase64.set(qrCodeDataUrl);
      this.isLoadingQr.set(false);
      
      console.log('QR Code generated (Format 4 - VietQR URL):', qrContent);
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.isLoadingQr.set(false);
    }
  }


  loadDeposits() {
    this.isLoading.set(true);
    
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    if (this.timeFilter()) {
      // TODO: Add time filter if API supports it
    }

    this.walletService.getDeposits(params).subscribe({
      next: (response) => {
        this.deposits.set(response.transactions);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading deposits:', error);
        this.isLoading.set(false);
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Đã sao chép!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  onSearch() {
    // TODO: Implement search if API supports it
    this.currentPage.set(1);
    this.loadDeposits();
  }

  onTimeFilterChange() {
    this.currentPage.set(1);
    this.loadDeposits();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'Pending': 'Chờ xử lý',
      'Completed': 'Đã thanh toán',
      'Failed': 'Thất bại',
      'Cancelled': 'Đã hủy',
      'Processing': 'Đang xử lý'
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
    // Reuse bank logo function from account-info
    const bankLogos: { [key: string]: string } = {
      'VCB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_Vietcombank.svg/200px-Logo_Vietcombank.svg.png',
      'Vietcombank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_Vietcombank.svg/200px-Logo_Vietcombank.svg.png',
      'MB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/MBBank_logo.svg/200px-MBBank_logo.svg.png',
      'MBBank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/MBBank_logo.svg/200px-MBBank_logo.svg.png',
    };
    return bankLogos[bankName] || '';
  }

  // Get admin account info from QR data
  getAdminAccount() {
    const qr = this.qrData();
    if (!qr) return null;
    return {
      accountNumber: qr.accountNumber,
      accountName: qr.accountName,
      bankName: qr.bankName,
      transferContent: qr.transferContent
    };
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadDeposits();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadDeposits();
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
}

