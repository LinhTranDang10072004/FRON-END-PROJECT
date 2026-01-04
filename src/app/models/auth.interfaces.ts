// Auth Interfaces
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  otpCode: string; // Bắt buộc cho đăng ký thủ công
  agreeToTerms: boolean;
  agreeToPolicy: boolean;
  role?: 'user' | 'seller';
}

export interface LoginDto {
  email: string;
  password: string;
  otpCode: string; // Bắt buộc cho đăng nhập thủ công
  rememberMe?: boolean;
}

export interface GoogleLoginDto {
  googleId: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  cccd?: string;
  phone?: string;
  facebookLink?: string;
  shopName?: string | null;
  isVerified?: boolean;
}

export interface RefreshTokenDto {
  token: string;
  refreshToken: string;
}

// Seller Registration
export interface BecomeSellerDto {
  email: string;
  cccd: string;
  phone: string;
  facebookLink: string;
}

export interface BecomeSellerResponse {
  message: string;
  token?: string; // Token mới với role = "seller"
  refreshToken?: string; // Refresh token mới
  expiresAt?: string; // Expiration time
  user: UserInfo;
}

// Shop Management
export interface SellerProductsResponse {
  products: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string | null;
  sortBy: string;
}

export interface ShopStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalSales: number;
  totalViews: number;
  totalFavorites: number;
  shopRating: number;
  totalRatings: number;
}

// User Profile
export interface UserProfile {
  id: number;
  username: string;
  shopName?: string | null;
  email: string;
  role: string;
  createdAt: string;
  level: number;
  totalPurchaseAmount: number;
  totalPurchases: number;
  totalShops?: number | null;
  totalSales?: number | null;
  totalSaleAmount?: number | null;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  ekycFrontImage: string | null;
  ekycBackImage: string | null;
  ekycPortraitImage: string | null;
  phone: string | null;
  facebookLink?: string | null;
  googleId?: string | null;
  passwordHash?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  bankBranch?: string | null;
}

export interface UpdateUserProfileDto {
  shopName?: string;
  phone?: string;
  ekycFrontImage?: string;
  ekycBackImage?: string;
  ekycPortraitImage?: string;
  facebookLink?: string;
}

// 2FA
export interface Toggle2FADto {
  enable: boolean;
}

export interface Toggle2FAResponse {
  message: string;
  twoFactorEnabled: boolean;
}

// Change Password
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// Bank Info
export interface BankInfo {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  bankBranch: string | null;
}

export interface UpdateBankInfoDto {
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
}

export interface UpdateBankInfoResponse {
  message: string;
  bankInfo: BankInfo;
}

