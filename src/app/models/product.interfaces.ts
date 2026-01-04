// Product Interfaces
export interface SellerInfo {
  id: number;
  username: string;
  email: string;
  shopName?: string | null;
  shopDescription?: string | null;
  shopAvatar?: string | null;
  telegram?: string | null;
  rating: number;
  totalRatings: number;
  totalSales: number;
  totalComplaints: number;
  isVerified: boolean;
}

export interface ProductOption {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  stock: number;
  sortOrder: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  productCode: string; // Mã sản phẩm unique (ví dụ: "PRD-ABC123")
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  imageUrl?: string;
  imageUrls?: string; // JSON string, cần parse
  category?: string | null;
  serviceType?: string | null;
  productType?: string | null; // "Tài khoản", "Phần mềm", "Cái khác"
  emailType?: string | null; // "Gmail", "Hotmail", "Outlookmail", "Rumail", "Yahoomail", "Other"
  rating: number;
  totalRatings: number;
  totalSales: number;
  totalComplaints: number;
  totalViews: number;
  totalFavorites: number;
  isFeatured: boolean;
  seller: SellerInfo;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  options?: ProductOption[]; // Options (variants) của sản phẩm
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  imageUrl?: string;
  imageUrls?: string; // JSON string
  category?: string;
  serviceType?: string;
  isFeatured?: boolean;
}

export interface UpdateProductDto extends CreateProductDto {}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search?: string | null;
  category?: string | null;
  serviceType?: string | null;
  productType?: string | null; // "Tài khoản", "Phần mềm", "Cái khác"
  emailTypes?: string | null; // "Gmail,Hotmail" (comma-separated)
  sortBy: string;
}

export interface FiltersResponse {
  categories: string[];
  serviceTypes: string[];
  productTypes: string[]; // ["Tài khoản", "Phần mềm", "Cái khác"]
  emailTypes: string[]; // ["Gmail", "Hotmail", "Outlookmail", "Rumail", "Yahoomail", "Other"]
}

export interface ServiceTypesResponse {
  category: string;
  serviceTypes: string[];
}

export interface CategoryProductsResponse {
  category: string;
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  serviceType: string | null;
  productType: string | null; // "Tài khoản", "Phần mềm", "Cái khác"
  sortBy: string;
}

// Product Options DTOs
export interface CreateProductOptionDto {
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  stock: number;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateProductOptionDto extends CreateProductOptionDto {}

export interface ProductOptionsResponse {
  productId: number;
  options: ProductOption[];
}

