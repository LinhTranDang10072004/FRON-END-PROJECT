import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product.interfaces';
import { ShopStats } from '../../models/auth.interfaces';

@Component({
  selector: 'app-shop-management',
  imports: [CommonModule],
  templateUrl: './shop-management.html',
  styleUrl: './shop-management.css',
})
export class ShopManagement implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private router = inject(Router);

  // Stats
  shopStats = signal<ShopStats | null>(null);
  isLoadingStats = signal(false);

  // Products
  products = signal<Product[]>([]);
  isLoadingProducts = signal(false);
  errorMessage = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalProducts = signal(0);
  pageSize = 20;

  // Search & Sort
  searchQuery = signal('');
  sortBy = signal<string>('newest');

  ngOnInit() {
    // Kiểm tra authentication và role
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isSeller()) {
      this.router.navigate(['/become-seller']);
      return;
    }

    this.loadShopStats();
    this.loadProducts();
  }

  loadShopStats() {
    this.isLoadingStats.set(true);
    this.authService.getShopStats().subscribe({
      next: (stats) => {
        this.shopStats.set(stats);
        this.isLoadingStats.set(false);
      },
      error: (error) => {
        console.error('Error loading shop stats:', error);
        this.isLoadingStats.set(false);
      }
    });
  }

  loadProducts() {
    this.isLoadingProducts.set(true);
    this.errorMessage.set(null);

    this.authService.getSellerProducts({
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.searchQuery() || undefined,
      sortBy: this.sortBy()
    }).subscribe({
      next: (response) => {
        // Chỉ hiển thị sản phẩm đang active (isActive === true hoặc undefined)
        const activeProducts = response.products.filter(p => p.isActive !== false);
        this.products.set(activeProducts);
        // Cập nhật total dựa trên số sản phẩm active
        this.totalPages.set(Math.ceil(activeProducts.length / this.pageSize));
        this.totalProducts.set(activeProducts.length);
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoadingProducts.set(false);
        this.errorMessage.set('Không thể tải sản phẩm. Vui lòng thử lại.');
      }
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSortChange(sortBy: string) {
    this.sortBy.set(sortBy);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  formatPriceRange(product: Product): string {
    if (product.discountPrice && product.discountPrice < product.price) {
      return `${this.formatPrice(product.discountPrice)} - ${this.formatPrice(product.price)}`;
    }
    return this.formatPrice(product.price);
  }

  formatRating(rating: number): string {
    if (rating === 0) return 'Chưa có đánh giá';
    return rating.toFixed(1);
  }

  formatSales(sales: number): string {
    if (sales >= 1000) {
      return `${(sales / 1000).toFixed(1)}k`;
    }
    return sales.toString();
  }

  getProductImages(product: Product): string[] {
    const images: string[] = [];
    if (product.imageUrl) {
      images.push(product.imageUrl);
    }
    if (product.imageUrls) {
      try {
        // Kiểm tra xem imageUrls có phải là JSON string không
        const trimmed = product.imageUrls.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          // Là JSON array string
          const parsed = JSON.parse(product.imageUrls);
          if (Array.isArray(parsed)) {
            images.push(...parsed);
          }
        } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          // Là JSON string chứa một URL
          const parsed = JSON.parse(product.imageUrls);
          images.push(parsed);
        } else {
          // Là URL đơn giản (không phải JSON)
          images.push(product.imageUrls);
        }
      } catch (e) {
        // Nếu parse thất bại, coi như là URL đơn giản
        images.push(product.imageUrls);
      }
    }
    return images;
  }

  onEditProduct(productId: number) {
    this.router.navigate(['/edit-product', productId]);
  }

  onDeleteProduct(productId: number) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: (response) => {
          console.log('Product deleted:', response);
          // Refresh danh sách sản phẩm và thống kê
          this.loadProducts();
          this.loadShopStats();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          let errorMessage = 'Không thể xóa sản phẩm. Vui lòng thử lại.';
          
          if (error.status === 401) {
            errorMessage = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';
          } else if (error.status === 403) {
            errorMessage = 'Bạn không có quyền xóa sản phẩm này.';
          } else if (error.status === 404) {
            errorMessage = error.error?.message || 'Sản phẩm không tồn tại hoặc bạn không có quyền xóa.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  onCreateProduct() {
    this.router.navigate(['/create-product']);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    
    // Show max 5 pages around current page
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    // Adjust if near start or end
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}

