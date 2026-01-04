import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ActivityLogService } from '../../services/activity-log';
import { ActivityLogDto, ActivityStatsResponse } from '../../models/activity-log.interfaces';

@Component({
  selector: 'app-activity-log',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './activity-log.html',
  styleUrl: './activity-log.css',
})
export class ActivityLogComponent implements OnInit {
  authService = inject(AuthService);
  private activityLogService = inject(ActivityLogService);
  private router = inject(Router);

  // Data
  activityLogs = signal<ActivityLogDto[]>([]);
  stats = signal<ActivityStatsResponse | null>(null);
  isLoading = signal(true);
  isLoadingStats = signal(true);
  errorMessage = signal<string | null>(null);

  // Filters
  selectedOperation = signal<string>('all');
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = signal(0);

  // Operation options
  operationOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'register', label: 'Tạo tài khoản' },
    { value: 'login', label: 'Đăng nhập' },
    { value: 'login_google', label: 'Đăng nhập với Google' },
    { value: 'deposit', label: 'Nạp tiền' },
    { value: 'withdraw', label: 'Rút tiền' },
    { value: 'purchase', label: 'Mua hàng' },
    { value: 'approve_deposit', label: 'Xác nhận nạp tiền' },
    { value: 'approve_withdrawal', label: 'Xác nhận rút tiền' }
  ];

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadStats();
    this.loadActivities();
  }

  loadStats() {
    this.isLoadingStats.set(true);
    
    const params: any = {};
    if (this.startDate()) {
      params.startDate = this.startDate();
    }
    if (this.endDate()) {
      params.endDate = this.endDate();
    }

    this.activityLogService.getMyStats(params).subscribe({
      next: (response) => {
        this.stats.set(response);
        this.isLoadingStats.set(false);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.isLoadingStats.set(false);
      }
    });
  }

  loadActivities() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };

    if (this.selectedOperation() !== 'all') {
      params.operation = this.selectedOperation();
    }
    if (this.startDate()) {
      params.startDate = this.startDate();
    }
    if (this.endDate()) {
      params.endDate = this.endDate();
    }

    this.activityLogService.getMyActivities(params).subscribe({
      next: (response) => {
        this.activityLogs.set(response.activityLogs);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.errorMessage.set('Không thể tải nhật ký hoạt động. Vui lòng thử lại.');
        this.isLoading.set(false);
      }
    });
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadStats();
    this.loadActivities();
  }

  clearFilters() {
    this.selectedOperation.set('all');
    this.startDate.set('');
    this.endDate.set('');
    this.currentPage.set(1);
    this.loadStats();
    this.loadActivities();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadActivities();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadActivities();
  }

  // Display helpers
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

  getOperationColor(operation: string): string {
    const colors: { [key: string]: string } = {
      'login': '#4CAF50',
      'register': '#2196F3',
      'login_google': '#4285F4',
      'deposit': '#FFC107',
      'withdraw': '#FF9800',
      'purchase': '#9C27B0',
      'approve_deposit': '#388E3C',
      'approve_withdrawal': '#388E3C'
    };
    return colors[operation] || '#6b7280';
  }

  parseMetadata(metadata?: string): any {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
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

  getOperationCount(operation: string): number {
    const stats = this.stats();
    if (!stats) return 0;
    const op = stats.operations.find(o => o.operation === operation);
    return op?.count || 0;
  }
}

