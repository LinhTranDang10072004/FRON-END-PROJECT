import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  VatInvoiceDto, 
  VatInvoice, 
  VatInvoiceListResponse, 
  VatInvoiceResponse,
  VatInvoiceDeleteResponse
} from '../models/vatinvoice.interfaces';

@Injectable({
  providedIn: 'root',
})
export class VatInvoiceService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7088/api';

  /**
   * Lấy danh sách thông tin hóa đơn VAT
   */
  getVatInvoices(): Observable<VatInvoiceListResponse> {
    return this.http.get<VatInvoiceListResponse>(`${this.apiUrl}/vatinvoice`);
  }

  /**
   * Lấy thông tin hóa đơn VAT mặc định
   */
  getDefaultVatInvoice(): Observable<VatInvoiceResponse> {
    return this.http.get<VatInvoiceResponse>(`${this.apiUrl}/vatinvoice/default`);
  }

  /**
   * Lấy thông tin hóa đơn VAT theo ID
   */
  getVatInvoiceById(id: number): Observable<VatInvoiceResponse> {
    return this.http.get<VatInvoiceResponse>(`${this.apiUrl}/vatinvoice/${id}`);
  }

  /**
   * Tạo thông tin hóa đơn VAT mới
   */
  createVatInvoice(data: VatInvoiceDto): Observable<VatInvoiceResponse> {
    return this.http.post<VatInvoiceResponse>(`${this.apiUrl}/vatinvoice`, data);
  }

  /**
   * Cập nhật thông tin hóa đơn VAT
   */
  updateVatInvoice(id: number, data: VatInvoiceDto): Observable<VatInvoiceResponse> {
    return this.http.put<VatInvoiceResponse>(`${this.apiUrl}/vatinvoice/${id}`, data);
  }

  /**
   * Xóa thông tin hóa đơn VAT
   */
  deleteVatInvoice(id: number): Observable<VatInvoiceDeleteResponse> {
    return this.http.delete<VatInvoiceDeleteResponse>(`${this.apiUrl}/vatinvoice/${id}`);
  }

  /**
   * Đặt thông tin hóa đơn VAT làm mặc định
   */
  setDefaultVatInvoice(id: number): Observable<VatInvoiceResponse> {
    return this.http.post<VatInvoiceResponse>(`${this.apiUrl}/vatinvoice/${id}/set-default`, {});
  }
}

