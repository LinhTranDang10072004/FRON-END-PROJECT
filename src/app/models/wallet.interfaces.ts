// Wallet Interfaces
export interface WalletBalance {
  balance: number;
  pendingBalance: number;
  availableBalance: number;
}

export interface DepositDto {
  amount: number;
  description?: string;
  proofImageUrl?: string;
}

export interface WithdrawDto {
  amount: number;
  accountNumber: string;
  accountName: string;
  bankName: string;
  description?: string;
}

export interface PurchaseDto {
  productId: number;
  amount: number;
  description?: string;
}

export interface WalletTransaction {
  id: number;
  userId: number;
  type: 'Deposit' | 'Withdrawal' | 'Purchase' | 'TransferToSeller' | 'Refund';
  status: 'Pending' | 'Completed' | 'Failed' | 'Cancelled' | 'Processing';
  amount: number;
  description: string;
  adminAccountNumber?: string;
  adminAccountName?: string;
  adminBankName?: string;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  proofImageUrl?: string;
  referenceCode?: string;
  fee?: number;
  reportDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionHistoryResponse {
  transactions: WalletTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApproveTransactionDto {
  status: 'Completed' | 'Failed';
  note?: string;
}

// Admin account info for deposit
export interface AdminAccountInfo {
  accountNumber: string;
  accountName: string;
  bankName: string;
  transferContent: string; // MMO2023 or similar
}

// Deposit QR Code Response
export interface DepositQrResponse {
  qrCodeBase64: string; // data:image/png;base64,...
  qrCodeUrl?: string; // https://vietqr.io/...
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  amount: number | null; // Luôn null - user tự nhập số tiền
  transferContent: string; // Mã cố định của user (format: NAP{userId})
  transactionId: string; // Giống transferContent
}

