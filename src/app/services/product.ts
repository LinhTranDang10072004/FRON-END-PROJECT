import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, CreateProductDto, UpdateProductDto, ProductListResponse, FiltersResponse, ServiceTypesResponse, CategoryProductsResponse, ProductOption, CreateProductOptionDto, UpdateProductOptionDto, ProductOptionsResponse } from '../models/product.interfaces';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getProducts(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    category?: string,
    serviceType?: string,
    productType?: string,
    emailTypes?: string[], // Array of email types
    sortBy: string = 'newest',
    sellerId?: number
  ): Observable<ProductListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy);
    
    if (search) {
      params = params.set('search', search);
    }
    if (category) {
      params = params.set('category', category);
    }
    if (serviceType) {
      params = params.set('serviceType', serviceType);
    }
    if (productType) {
      params = params.set('productType', productType);
    }
    if (emailTypes && emailTypes.length > 0) {
      params = params.set('emailTypes', emailTypes.join(','));
    }
    if (sellerId) {
      params = params.set('sellerId', sellerId.toString());
    }
    
    return this.http.get<ProductListResponse>(`${this.apiUrl}/products`, { params });
  }

  /**
   * Tìm kiếm sản phẩm theo tên
   */
  searchProductsByName(
    name: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'newest'
  ): Observable<ProductListResponse> {
    const params = new HttpParams()
      .set('name', name)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy);
    
    return this.http.get<ProductListResponse>(`${this.apiUrl}/products/search-by-name`, { params });
  }

  /**
   * Lấy sản phẩm theo seller ID
   */
  getProductsBySeller(
    sellerId: number,
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'newest'
  ): Observable<ProductListResponse> {
    return this.getProducts(page, pageSize, undefined, undefined, undefined, undefined, undefined, sortBy, sellerId);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  /**
   * Lấy sản phẩm theo productCode
   */
  getProductByCode(productCode: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/code/${productCode}`);
  }

  getFilters(): Observable<FiltersResponse> {
    return this.http.get<FiltersResponse>(`${this.apiUrl}/products/filters`);
  }

  /**
   * Lấy danh sách serviceTypes trong một category
   */
  getServiceTypesByCategory(categoryName: string): Observable<ServiceTypesResponse> {
    return this.http.get<ServiceTypesResponse>(
      `${this.apiUrl}/products/category/${encodeURIComponent(categoryName)}/service-types`
    );
  }

  /**
   * Lấy danh sách sản phẩm theo category
   */
  getProductsByCategory(
    categoryName: string,
    page: number = 1,
    pageSize: number = 10,
    serviceType?: string,
    productType?: string,
    sortBy: string = 'newest'
  ): Observable<CategoryProductsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy);
    
    if (serviceType) {
      params = params.set('serviceType', serviceType);
    }
    if (productType) {
      params = params.set('productType', productType);
    }
    
    return this.http.get<CategoryProductsResponse>(
      `${this.apiUrl}/products/category/${encodeURIComponent(categoryName)}`,
      { params }
    );
  }

  createProduct(productData: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, productData);
  }

  updateProduct(id: number, productData: UpdateProductDto): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, productData);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  getSimilarProducts(id: number, pageSize: number = 8): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}/similar?pageSize=${pageSize}`);
  }

  // Helper method để parse imageUrls từ JSON string
  parseImageUrls(product: Product): string[] {
    if (!product.imageUrls) return [];
    try {
      return JSON.parse(product.imageUrls);
    } catch {
      return [];
    }
  }

  // ========== Product Options (Variants) Methods ==========

  /**
   * Lấy danh sách options của sản phẩm (Seller only)
   */
  getProductOptions(productId: number): Observable<ProductOptionsResponse> {
    return this.http.get<ProductOptionsResponse>(`${this.apiUrl}/products/${productId}/options`);
  }

  /**
   * Tạo option mới cho sản phẩm (Seller only)
   */
  createProductOption(productId: number, optionData: CreateProductOptionDto): Observable<ProductOption> {
    return this.http.post<ProductOption>(`${this.apiUrl}/products/${productId}/options`, optionData);
  }

  /**
   * Cập nhật option của sản phẩm (Seller only)
   */
  updateProductOption(productId: number, optionId: number, optionData: UpdateProductOptionDto): Observable<ProductOption> {
    return this.http.put<ProductOption>(`${this.apiUrl}/products/${productId}/options/${optionId}`, optionData);
  }

  /**
   * Xóa option của sản phẩm (Seller only)
   */
  deleteProductOption(productId: number, optionId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/products/${productId}/options/${optionId}`);
  }
}
