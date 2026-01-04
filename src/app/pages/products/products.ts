import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product.interfaces';

type SortBy = 'newest' | 'popular' | 'bestseller' | 'price_asc' | 'price_desc' | 'rating';

@Component({
  selector: 'app-products',
  imports: [CommonModule, RouterModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  productType = signal<string>('');
  products = signal<Product[]>([]);
  selectedCategory = signal<string | null>(null);
  selectedServiceType = signal<string | null>(null);
  sortBy = signal<SortBy>('newest');
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  isLoading = signal(false);
  
  categories = signal<string[]>([]);
  serviceTypes = signal<string[]>([]);

  sortOptions: { value: SortBy; label: string }[] = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'popular', label: 'Phổ biến' },
    { value: 'bestseller', label: 'Bán chạy nhất' },
    { value: 'price_asc', label: 'Giá: Thấp → Cao' },
    { value: 'price_desc', label: 'Giá: Cao → Thấp' },
    { value: 'rating', label: 'Đánh giá cao nhất' }
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const type = params['productType'];
      if (type) {
        // Map route to API productType
        const productTypeMap: { [key: string]: string } = {
          'TaiKhoan': 'Tài khoản',
          'PhanMem': 'Phần mềm',
          'Khac': 'Dịch vụ khác'
        };
        this.productType.set(productTypeMap[type] || type);
        this.loadFilters();
        this.loadProducts();
      }
    });
  }

  loadFilters() {
    this.productService.getFilters().subscribe({
      next: (response) => {
        this.categories.set(response.categories || []);
        this.serviceTypes.set(response.serviceTypes || []);
      },
      error: (error) => {
        console.error('Error loading filters:', error);
        this.categories.set([]);
        this.serviceTypes.set([]);
      }
    });
  }

  loadProducts() {
    const productType = this.productType();
    if (!productType) return;

    this.isLoading.set(true);
    this.productService.getProducts(
      this.currentPage(),
      12,
      undefined, // search
      this.selectedCategory() || undefined, // category
      this.selectedServiceType() || undefined, // serviceType
      productType, // productType
      undefined, // emailTypes
      this.sortBy()
    ).subscribe({
      next: (response) => {
        this.products.set(response.products);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.currentPage.set(response.page);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.products.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onCategoryClick(category: string | null) {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onServiceTypeClick(serviceType: string | null) {
    this.selectedServiceType.set(serviceType);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSortChange(sortBy: SortBy) {
    this.sortBy.set(sortBy);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getProductImage(product: Product): string {
    if (product.imageUrl) {
      return product.imageUrl;
    }
    if (product.imageUrls) {
      try {
        const urls = JSON.parse(product.imageUrls);
        if (urls && urls.length > 0) {
          return urls[0];
        }
      } catch (e) {
        console.error('Error parsing imageUrls:', e);
      }
    }
    return 'https://via.placeholder.com/300x200?text=No+Image';
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
      pages.push(1);
      
      if (current > 3) {
        pages.push(-1);
      }
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== total) {
          pages.push(i);
        }
      }
      
      if (current < total - 2) {
        pages.push(-1);
      }
      
      pages.push(total);
    }
    
    return pages;
  }

  isEllipsis(pageNum: number): boolean {
    return pageNum === -1;
  }
}
