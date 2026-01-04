import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product.interfaces';

type SortBy = 'newest' | 'popular' | 'bestseller' | 'price_asc' | 'price_desc' | 'rating';

@Component({
  selector: 'app-category',
  imports: [CommonModule, RouterModule],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  categoryName = signal<string>('');
  allCategories = signal<string[]>([]);
  serviceTypes = signal<string[]>([]);
  productTypes = signal<string[]>([]);
  emailTypes = signal<string[]>([]);
  products = signal<Product[]>([]);
  selectedCategories = signal<string[]>([]);
  selectedServiceTypes = signal<string[]>([]);
  selectedEmailTypes = signal<string[]>([]);
  selectedServiceType = signal<string | null>(null);
  selectedProductType = signal<string | null>(null);
  sortBy = signal<SortBy>('popular');
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  isLoading = signal(false);
  isLoadingServiceTypes = signal(false);

  sortOptions: { value: SortBy; label: string }[] = [
    { value: 'popular', label: 'Phổ Biến' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'bestseller', label: 'Bán chạy' },
    { value: 'price_asc', label: 'Giá' }
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const category = params['categoryName'];
      console.log('Route params changed:', params, 'Category:', category);
      
      // Reset state when route changes
      this.currentPage.set(1);
      this.selectedServiceTypes.set([]);
      this.selectedEmailTypes.set([]);
      this.selectedServiceType.set(null);
      this.selectedProductType.set(null);
      this.products.set([]);
      
      if (category) {
        // Map route name to productType (not category)
        // Route names: TaiKhoan, PhanMem, Khac map to productTypes
        const productTypeMap: { [key: string]: string } = {
          'TaiKhoan': 'Tài khoản',
          'PhanMem': 'Phần mềm',
          'Khac': 'Cái khác'
        };
        
        // Check if it's a productType route or actual category route
        if (productTypeMap[category]) {
          // This is a productType route (TaiKhoan, PhanMem, Khac)
          const productType = productTypeMap[category];
          this.categoryName.set(productType); // Display name
          this.selectedProductType.set(productType); // Set filter
          this.loadFilters();
          // Don't load serviceTypes for productType routes
          this.loadProducts(); // Use getProducts with productType filter
        } else {
          // This is an actual category route (Email, Telegram, TikTok, Facebook)
          // Set categoryName for display, but don't auto-select checkbox
          // User must select checkbox to filter
          this.categoryName.set(category);
          this.loadFilters();
          this.loadServiceTypes();
          // Don't auto-select category checkbox - let user choose
          // This way, if no checkbox is selected, all products will show
          this.loadProducts();
        }
      } else {
        // No category in route - show all products
        this.categoryName.set('');
        this.loadFilters();
        this.loadProducts();
      }
    });
  }

  loadFilters() {
    this.productService.getFilters().subscribe({
      next: (response) => {
        this.productTypes.set(response.productTypes || []);
        this.allCategories.set(response.categories || []);
        this.emailTypes.set(response.emailTypes || []);
        // Don't auto-select category checkbox
        // User must manually select to filter
        // This ensures all products show when no checkbox is selected
      },
      error: (error) => {
        console.error('Error loading filters:', error);
        this.productTypes.set([]);
        this.allCategories.set([]);
        this.emailTypes.set([]);
      }
    });
  }

  loadServiceTypes() {
    const category = this.categoryName();
    if (!category) return;

    // Only load serviceTypes for actual API categories (Email, Telegram, TikTok, Facebook)
    // Not for productType routes (Tài khoản, Phần mềm, Cái khác)
    const apiCategories = ['Email', 'Telegram', 'TikTok', 'Facebook'];
    if (!apiCategories.includes(category)) {
      this.serviceTypes.set([]);
      return;
    }

    this.isLoadingServiceTypes.set(true);
    this.productService.getServiceTypesByCategory(category).subscribe({
      next: (response) => {
        this.serviceTypes.set(response.serviceTypes);
        this.isLoadingServiceTypes.set(false);
      },
      error: (error) => {
        console.error('Error loading service types:', error);
        this.serviceTypes.set([]);
        this.isLoadingServiceTypes.set(false);
      }
    });
  }

  loadProducts() {
    const category = this.categoryName();
    const productType = this.selectedProductType();
    
    console.log('Loading products - category:', category, 'productType:', productType);
    console.log('Selected filters:', {
      emailTypes: this.selectedEmailTypes(),
      serviceTypes: this.selectedServiceTypes(),
      categories: this.selectedCategories()
    });
    
    this.isLoading.set(true);
    
    // Get filters
    const selectedEmailTypes = this.selectedEmailTypes();
    const selectedServiceTypes = this.selectedServiceTypes();
    const selectedCategories = this.selectedCategories();
    
    // Determine serviceType (use first selected if multiple, or single selection)
    const serviceType = selectedServiceTypes.length > 0 
      ? selectedServiceTypes[0] 
      : (this.selectedServiceType() || undefined);

    // Determine emailTypes (for Email category)
    const emailTypes = selectedEmailTypes.length > 0 ? selectedEmailTypes : undefined;

    // Determine category filter
    // ONLY use category if checkbox is selected
    // If no checkbox is selected, don't filter by category (show all)
    let categoryFilter: string | undefined = undefined;
    if (selectedCategories.length > 0) {
      categoryFilter = selectedCategories[0];
    }
    // Don't use route category if no checkbox is selected - show all products

    // If we have a productType filter set (from route like TaiKhoan, PhanMem, Khac)
    // use getProducts with productType filter
    if (productType && ['Tài khoản', 'Phần mềm', 'Cái khác'].includes(productType)) {
      console.log('Calling getProducts with productType filter:', {
        page: this.currentPage(),
        productType,
        category: categoryFilter,
        serviceType,
        emailTypes,
        sortBy: this.sortBy()
      });

      this.productService.getProducts(
        this.currentPage(),
        12,
        undefined, // search
        categoryFilter, // category (can be undefined to show all)
        serviceType, // serviceType (can be undefined)
        productType, // productType filter
        emailTypes, // emailTypes (can be undefined)
        this.sortBy()
      ).subscribe({
        next: (response) => {
          console.log('Products loaded (productType filter):', response);
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
      return;
    }

    // If we have a category filter, use it
    // Otherwise, load all products (no category filter)
    if (categoryFilter) {
      // Check if category exists in API categories (Email, Telegram, TikTok, Facebook, etc.)
      const apiCategories = ['Email', 'Telegram', 'TikTok', 'Facebook', 'Shopee', 'Youtube'];
      
      if (apiCategories.includes(categoryFilter)) {
        // Use getProducts with category filter for known API categories
        console.log('Calling getProducts with category filter:', {
          category: categoryFilter,
          page: this.currentPage(),
          serviceType,
          productType: this.selectedProductType() || undefined,
          emailTypes,
          sortBy: this.sortBy()
        });

        this.productService.getProducts(
          this.currentPage(),
          12,
          undefined, // search
          categoryFilter, // category
          serviceType, // serviceType (can be undefined)
          this.selectedProductType() || undefined, // productType (can be undefined)
          emailTypes, // emailTypes (can be undefined)
          this.sortBy()
        ).subscribe({
          next: (response) => {
            console.log('Products loaded (category filter):', response);
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
      } else {
        // Try getProductsByCategory for other category names
        console.log('Calling getProductsByCategory:', {
          category: categoryFilter,
          page: this.currentPage(),
          serviceType,
          productType: this.selectedProductType() || undefined,
          sortBy: this.sortBy()
        });
        
        this.productService.getProductsByCategory(
          categoryFilter,
          this.currentPage(),
          12,
          serviceType,
          this.selectedProductType() || undefined,
          this.sortBy()
        ).subscribe({
          next: (response) => {
            console.log('Products loaded (getProductsByCategory):', response);
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
    } else {
      // No category filter - load all products
      console.log('Calling getProducts without category (all products):', {
        page: this.currentPage(),
        serviceType,
        productType: this.selectedProductType() || undefined,
        emailTypes,
        sortBy: this.sortBy()
      });

      this.productService.getProducts(
        this.currentPage(),
        12,
        undefined, // search
        undefined, // category - no filter, show all
        serviceType, // serviceType (can be undefined)
        this.selectedProductType() || undefined, // productType (can be undefined)
        emailTypes, // emailTypes (can be undefined)
        this.sortBy()
      ).subscribe({
        next: (response) => {
          console.log('Products loaded (all products):', response);
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
  }

  onCategoryToggle(category: string, event: Event) {
    event.stopPropagation();
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedCategories();
    if (checked) {
      this.selectedCategories.set([...current, category]);
    } else {
      this.selectedCategories.set(current.filter(c => c !== category));
    }
    this.currentPage.set(1);
    // Update categoryName if selecting a category
    if (checked) {
      this.categoryName.set(category);
    }
    this.loadProducts();
  }

  onServiceTypeToggle(serviceType: string, event: Event) {
    event.stopPropagation();
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedServiceTypes();
    if (checked) {
      this.selectedServiceTypes.set([...current, serviceType]);
    } else {
      this.selectedServiceTypes.set(current.filter(s => s !== serviceType));
    }
    this.currentPage.set(1);
    this.loadProducts();
  }

  onEmailTypeToggle(emailType: string, event: Event) {
    event.stopPropagation();
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedEmailTypes();
    if (checked) {
      this.selectedEmailTypes.set([...current, emailType]);
    } else {
      this.selectedEmailTypes.set(current.filter(e => e !== emailType));
    }
    this.currentPage.set(1);
    this.loadProducts();
  }

  onServiceTypeClick(serviceType: string | null) {
    this.selectedServiceType.set(serviceType);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onProductTypeClick(productType: string | null) {
    this.selectedProductType.set(productType);
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
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatPriceRange(product: Product): string {
    const minPrice = product.discountPrice || product.price;
    const maxPrice = product.price;
    if (minPrice === maxPrice) {
      return this.formatPrice(minPrice);
    }
    return `${this.formatPrice(minPrice)} - ${this.formatPrice(maxPrice)}`;
  }

  formatRating(rating: number): string {
    return rating > 0 ? rating.toFixed(1) : '0.0';
  }

  formatSales(sales: number): string {
    if (sales === 0) return '0';
    if (sales < 1000) return sales.toString();
    if (sales < 1000000) {
      return (sales / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return (sales / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }

  getComplaintPercentage(product: Product): string {
    if (product.totalSales === 0) return '0.0';
    const percentage = (product.totalComplaints / product.totalSales) * 100;
    return percentage.toFixed(1);
  }

  getProductImage(product: Product): string {
    const images = this.productService.parseImageUrls(product);
    if (images.length > 0) {
      return images[0];
    }
    if (product.imageUrl) {
      return product.imageUrl;
    }
    return 'https://via.placeholder.com/300x200?text=No+Image';
  }

  getImageUrls(product: Product): string[] {
    return this.productService.parseImageUrls(product);
  }

  getProductRating(product: Product): number {
    return product.rating > 0 ? product.rating : 0;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    
    if (total <= 7) {
      // Hiển thị tất cả nếu <= 7 trang
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiển thị trang đầu
      pages.push(1);
      
      if (current > 3) {
        pages.push(-1); // Ellipsis
      }
      
      // Hiển thị các trang xung quanh trang hiện tại
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== total) {
          pages.push(i);
        }
      }
      
      if (current < total - 2) {
        pages.push(-1); // Ellipsis
      }
      
      // Luôn hiển thị trang cuối
      pages.push(total);
    }
    
    return pages;
  }

  isEllipsis(pageNum: number): boolean {
    return pageNum === -1;
  }
}
