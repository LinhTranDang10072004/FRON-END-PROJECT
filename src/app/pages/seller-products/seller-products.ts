import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product';
import { Product, SellerInfo } from '../../models/product.interfaces';

@Component({
  selector: 'app-seller-products',
  imports: [CommonModule, RouterModule],
  templateUrl: './seller-products.html',
  styleUrl: './seller-products.css',
})
export class SellerProducts implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  
  // Seller info
  sellerId = signal<number | null>(null);
  sellerInfo = signal<SellerInfo | null>(null);
  
  // Products
  products = signal<Product[]>([]);
  isLoadingProducts = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = 12;
  
  // Sort
  sortBy = signal<string>('newest');

  ngOnInit() {
    // Lấy sellerId từ route params
    this.route.params.subscribe(params => {
      const id = params['id'] ? parseInt(params['id']) : null;
      if (id) {
        this.sellerId.set(id);
        this.loadSellerProducts(id);
      } else {
        this.errorMessage.set('Không tìm thấy thông tin người bán');
      }
    });
  }

  loadSellerProducts(sellerId: number) {
    this.isLoadingProducts.set(true);
    this.errorMessage.set(null);

    this.productService.getProductsBySeller(
      sellerId,
      this.currentPage(),
      this.pageSize,
      this.sortBy()
    ).subscribe({
      next: (response) => {
        this.products.set(response.products);
        this.totalPages.set(response.totalPages);
        
        // Lấy thông tin seller từ sản phẩm đầu tiên (nếu có)
        if (response.products.length > 0 && response.products[0].seller) {
          this.sellerInfo.set(response.products[0].seller);
        }
        
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        console.error('Error loading seller products:', error);
        this.isLoadingProducts.set(false);
        this.errorMessage.set('Không thể tải sản phẩm. Vui lòng thử lại.');
      }
    });
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      const sellerId = this.sellerId();
      if (sellerId) {
        this.loadSellerProducts(sellerId);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  onSortChange(sortBy: string) {
    this.sortBy.set(sortBy);
    this.currentPage.set(1);
    const sellerId = this.sellerId();
    if (sellerId) {
      this.loadSellerProducts(sellerId);
    }
  }

  getProductImages(product: Product): string[] {
    const images: string[] = [];
    if (product.imageUrl) {
      images.push(product.imageUrl);
    }
    if (product.imageUrls) {
      try {
        const parsed = JSON.parse(product.imageUrls);
        if (Array.isArray(parsed)) {
          images.push(...parsed);
        }
      } catch (e) {
        console.error('Error parsing imageUrls:', e);
      }
    }
    return images;
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

  getComplaintPercentage(product: Product): number {
    if (product.totalSales === 0) return 0;
    return Math.round((product.totalComplaints / product.totalSales) * 100);
  }

  getProductRating(product: Product): number {
    return product.rating || 0;
  }
}
