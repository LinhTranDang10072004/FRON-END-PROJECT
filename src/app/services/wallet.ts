import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  WalletBalance, 
  DepositDto, 
  WithdrawDto, 
  PurchaseDto, 
  WalletTransaction, 
  TransactionHistoryResponse,
  ApproveTransactionDto,
  DepositQrResponse
} from '../models/wallet.interfaces';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Lấy QR code để nạp tiền
   * @param format - Format QR code (1-5, mặc định là 2)
   * @param useCache - Có dùng cache không (thêm timestamp để bypass cache)
   */
  getDepositQr(format?: number, useCache: boolean = false): Observable<DepositQrResponse> {
    let httpParams = new HttpParams();
    
    if (format) {
      httpParams = httpParams.set('format', format.toString());
    }
    
    // Thêm timestamp để bypass cache nếu cần
    if (!useCache) {
      httpParams = httpParams.set('_t', Date.now().toString());
    }
    
    return this.http.get<DepositQrResponse>(`${this.apiUrl}/Wallet/deposit-qr`, { params: httpParams });
  }

  /**
   * Lấy số dư ví
   */
  getBalance(): Observable<WalletBalance> {
    return this.http.get<WalletBalance>(`${this.apiUrl}/Wallet/balance`);
  }

  /**
   * Nạp tiền vào ví
   */
  deposit(data: DepositDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/Wallet/deposit`, data);
  }

  /**
   * Rút tiền từ ví (chỉ Seller)
   */
  withdraw(data: WithdrawDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/Wallet/withdraw`, data);
  }

  /**
   * Lấy lịch sử giao dịch
   */
  getTransactions(params?: {
    type?: 'deposit' | 'withdrawal' | 'purchase' | 'transferToSeller';
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    page?: number;
    pageSize?: number;
  }): Observable<TransactionHistoryResponse> {
    let httpParams = new HttpParams();
    
    if (params?.type) {
      httpParams = httpParams.set('type', params.type);
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    return this.http.get<TransactionHistoryResponse>(`${this.apiUrl}/Wallet/transactions`, { params: httpParams });
  }

  /**
   * Lấy lịch sử nạp tiền
   */
  getDeposits(params?: {
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    page?: number;
    pageSize?: number;
  }): Observable<TransactionHistoryResponse> {
    let httpParams = new HttpParams();
    
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    return this.http.get<TransactionHistoryResponse>(`${this.apiUrl}/Wallet/deposits`, { params: httpParams });
  }

  /**
   * Lấy lịch sử rút tiền (chỉ Seller)
   */
  getWithdrawals(params?: {
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    page?: number;
    pageSize?: number;
  }): Observable<TransactionHistoryResponse> {
    let httpParams = new HttpParams();
    
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    return this.http.get<TransactionHistoryResponse>(`${this.apiUrl}/Wallet/withdrawals`, { params: httpParams });
  }

  /**
   * Lấy lịch sử mua hàng
   */
  getPurchases(params?: {
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    page?: number;
    pageSize?: number;
  }): Observable<TransactionHistoryResponse> {
    let httpParams = new HttpParams();
    
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    return this.http.get<TransactionHistoryResponse>(`${this.apiUrl}/Wallet/purchases`, { params: httpParams });
  }

  /**
   * Tạo giao dịch mua hàng
   */
  purchase(data: PurchaseDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/Wallet/purchase`, data);
  }

  // ========== ADMIN APIs ==========

  /**
   * Admin: Xác nhận nạp tiền
   */
  approveDeposit(transactionId: number, data: ApproveTransactionDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/Wallet/transactions/${transactionId}/approve`, data);
  }

  /**
   * Admin: Từ chối nạp tiền
   */
  rejectDeposit(transactionId: number, data: ApproveTransactionDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/Wallet/transactions/${transactionId}/reject`, data);
  }

  /**
   * Admin: Xác nhận rút tiền
   */
  approveWithdrawal(transactionId: number, data: ApproveTransactionDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/Wallet/transactions/${transactionId}/approve-withdrawal`, data);
  }

  /**
   * Admin: Từ chối rút tiền
   */
  rejectWithdrawal(transactionId: number, data: ApproveTransactionDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/Wallet/transactions/${transactionId}/reject-withdrawal`, data);
  }

  /**
   * Admin: Chuyển tiền cho seller (sau 3 ngày)
   */
  transferToSeller(transactionId: number): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/Wallet/transactions/${transactionId}/transfer-to-seller`, {});
  }

  /**
   * Admin: Lấy danh sách giao dịch chờ xử lý
   */
  getPendingTransactions(params?: {
    type?: 'deposit' | 'withdrawal' | 'purchase' | 'transferToSeller';
    page?: number;
    pageSize?: number;
  }): Observable<TransactionHistoryResponse> {
    let httpParams = new HttpParams();
    
    if (params?.type) {
      httpParams = httpParams.set('type', params.type);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    return this.http.get<TransactionHistoryResponse>(`${this.apiUrl}/Wallet/admin/pending-transactions`, { params: httpParams });
  }

  /**
   * Admin: Lấy danh sách giao dịch cần chuyển tiền cho seller
   */
  getPendingTransfers(params?: {
    page?: number;
    pageSize?: number;
  }): Observable<TransactionHistoryResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    return this.http.get<TransactionHistoryResponse>(`${this.apiUrl}/Wallet/admin/pending-transfers`, { params: httpParams });
  }
}

