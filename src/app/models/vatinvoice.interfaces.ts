// VAT Invoice Interfaces

export interface VatInvoiceDto {
  customerType: 1 | 2; // 1 = Cá nhân, 2 = Công ty
  fullName: string; // Bắt buộc, tối đa 200 ký tự
  taxCode?: string | null; // Tùy chọn, tối đa 50 ký tự
  cccd?: string | null; // Tùy chọn, tối đa 20 ký tự (chỉ cho cá nhân)
  address?: string | null; // Tùy chọn, tối đa 500 ký tự
  email?: string | null; // Tùy chọn (chỉ cho công ty)
  companyName?: string | null; // Tùy chọn (chỉ cho công ty)
  isDefault?: boolean; // Mặc định false
}

export interface VatInvoice {
  id: number;
  userId: number;
  customerType: 1 | 2;
  customerTypeName: string; // "Cá nhân" hoặc "Công ty"
  fullName: string;
  taxCode?: string | null;
  cccd?: string | null;
  address?: string | null;
  email?: string | null;
  companyName?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VatInvoiceListResponse {
  success: boolean;
  message: string;
  data: VatInvoice[];
}

export interface VatInvoiceResponse {
  success: boolean;
  message: string;
  data: VatInvoice;
}

export interface VatInvoiceDeleteResponse {
  success: boolean;
  message: string;
}

