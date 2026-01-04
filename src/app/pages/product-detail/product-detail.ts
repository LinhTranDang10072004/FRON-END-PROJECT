import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { CartStateService } from '../../services/cart-state';
import { Product, ProductOption } from '../../models/product.interfaces';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router); // Public để dùng trong template
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private cartStateService = inject(CartStateService);
  private authService = inject(AuthService);

  product = signal<Product | null>(null);
  similarProducts = signal<Product[]>([]);
  isLoading = signal(true);
  isLoadingSimilar = signal(false);
  errorMessage = signal<string | null>(null);
  
  // UI State
  selectedImageIndex = signal(0);
  activeTab = signal<'description' | 'reviews' | 'api'>('description');
  quantity = signal(1);
  selectedOptionId = signal<number | null>(null);

  // Product images
  productImages = signal<string[]>([]);

  // Computed: Selected option
  selectedOption = computed(() => {
    const product = this.product();
    const optionId = this.selectedOptionId();
    if (!product || !product.options || !optionId) return null;
    return product.options.find(o => o.id === optionId) || null;
  });

  // Computed: Available options (sorted by sortOrder, then price)
  availableOptions = computed(() => {
    const product = this.product();
    if (!product || !product.options) return [];
    
    return [...product.options]
      .filter(opt => opt.isActive !== false) // Only show active options
      .sort((a, b) => {
        // Sort by sortOrder first, then by price
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.price - b.price;
      });
  });

  // Computed: Current price (from selected option or product)
  currentPrice = computed(() => {
    const option = this.selectedOption();
    if (option) {
      return option.discountPrice ?? option.price;
    }
    const product = this.product();
    if (product) {
      return product.discountPrice ?? product.price;
    }
    return 0;
  });

  // Computed: Original price (before discount)
  originalPrice = computed(() => {
    const option = this.selectedOption();
    if (option) {
      return option.price;
    }
    const product = this.product();
    return product?.price ?? 0;
  });

  // Computed: Current stock (from selected option or product)
  currentStock = computed(() => {
    const option = this.selectedOption();
    if (option) {
      return option.stock;
    }
    const product = this.product();
    return product?.stock ?? 0;
  });

  // Computed: Check if product has options and requires selection
  requiresOptionSelection = computed(() => {
    const product = this.product();
    return product?.options && product.options.length > 0;
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const productCode = params['productCode'];
      if (productCode) {
        this.loadProduct(productCode);
      } else {
        this.errorMessage.set('Không tìm thấy mã sản phẩm');
        this.isLoading.set(false);
      }
    });
  }

  loadProduct(productCode: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.selectedOptionId.set(null); // Reset selected option

    this.productService.getProductByCode(productCode).subscribe({
      next: (product) => {
        this.product.set(product);
        this.parseProductImages(product);
        
        // Auto-select first available option if exists
        if (product.options && product.options.length > 0) {
          const firstActiveOption = product.options
            .filter(opt => opt.isActive !== false)
            .sort((a, b) => {
              if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
              return a.price - b.price;
            })[0];
          
          if (firstActiveOption && firstActiveOption.stock > 0) {
            this.selectedOptionId.set(firstActiveOption.id);
          }
        }
        
        // Load similar products using product id
        if (product.id) {
          this.loadSimilarProducts(product.id);
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.isLoading.set(false);
        this.errorMessage.set(
          error.status === 404 
            ? 'Sản phẩm không tồn tại'
            : 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.'
        );
      }
    });
  }

  loadSimilarProducts(id: number) {
    this.isLoadingSimilar.set(true);
    
    this.productService.getSimilarProducts(id, 8).subscribe({
      next: (response) => {
        this.similarProducts.set(response.similarProducts || []);
        this.isLoadingSimilar.set(false);
      },
      error: (error) => {
        console.error('Error loading similar products:', error);
        this.isLoadingSimilar.set(false);
        // Không hiển thị lỗi nếu không load được sản phẩm tương tự
      }
    });
  }

  parseProductImages(product: Product) {
    const images: string[] = [];
    
    if (product.imageUrl) {
      images.push(product.imageUrl);
    }
    
    if (product.imageUrls) {
      try {
        const trimmed = product.imageUrls.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          const parsed = JSON.parse(product.imageUrls);
          if (Array.isArray(parsed)) {
            images.push(...parsed);
          }
        } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          const parsed = JSON.parse(product.imageUrls);
          images.push(parsed);
        } else {
          images.push(product.imageUrls);
        }
      } catch (e) {
        images.push(product.imageUrls);
      }
    }
    
    this.productImages.set(images);
    if (images.length > 0) {
      this.selectedImageIndex.set(0);
    }
  }

  selectImage(index: number) {
    this.selectedImageIndex.set(index);
  }

  setActiveTab(tab: 'description' | 'reviews' | 'api') {
    this.activeTab.set(tab);
  }

  increaseQuantity() {
    const maxStock = this.currentStock();
    if (this.quantity() < maxStock) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  selectOption(option: ProductOption) {
    if (option.stock > 0 && option.isActive !== false) {
      this.selectedOptionId.set(option.id);
      // Reset quantity to 1 when changing option
      this.quantity.set(1);
    }
  }

  addToCart() {
    if (!this.authService.isAuthenticated()) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      this.router.navigate(['/login']);
      return;
    }

    const product = this.product();
    const option = this.selectedOption();
    
    if (!product) return;
    
    // If product has options, require option selection
    if (product.options && product.options.length > 0 && !option) {
      alert('Vui lòng chọn gói sản phẩm!');
      return;
    }
    
    // Check stock
    const stock = this.currentStock();
    if (stock === 0) {
      alert('Sản phẩm đã hết hàng!');
      return;
    }
    
    // Check quantity doesn't exceed stock
    if (this.quantity() > stock) {
      alert(`Số lượng vượt quá tồn kho. Hiện tại còn ${stock} sản phẩm.`);
      return;
    }
    
    // Add to cart via API
    const addToCartData = {
      productId: product.id,
      productOptionId: option?.id,
      quantity: this.quantity()
    };
    
    this.cartService.addToCart(addToCartData).subscribe({
      next: () => {
        // Update cart count
        this.cartStateService.incrementCartCount(this.quantity());
        alert('Đã thêm vào giỏ hàng!');
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        alert(error.error?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
      }
    });
  }

  buyNow() {
    const product = this.product();
    const option = this.selectedOption();
    
    if (!product) return;
    
    // If product has options, require option selection
    if (product.options && product.options.length > 0 && !option) {
      alert('Vui lòng chọn gói sản phẩm!');
      return;
    }
    
    // Check stock
    const stock = this.currentStock();
    if (stock === 0) {
      alert('Sản phẩm đã hết hàng!');
      return;
    }
    
    // TODO: Implement buy now - navigate to checkout
    console.log('Buy now:', {
      productId: product.id,
      optionId: option?.id || null,
      quantity: this.quantity(),
      price: this.currentPrice()
    });
    
    // Navigate to checkout with query params
    this.router.navigate(['/checkout'], {
      queryParams: {
        productId: product.id,
        optionId: option?.id || null,
        quantity: this.quantity()
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  formatSales(sales: number): string {
    return new Intl.NumberFormat('vi-VN').format(sales);
  }

  getComplaintPercentage(product: Product): number {
    if (!product.totalSales || product.totalSales === 0) return 0;
    return (product.totalComplaints || 0) / product.totalSales * 100;
  }

  getBreadcrumbs() {
    const product = this.product();
    if (!product) return [];
    
    // Convert category to lowercase for URL (Email -> email)
    const categoryRoute = product.category ? product.category.toLowerCase() : '';
    
    return [
      { label: 'Trang chủ', route: '/' },
      { label: 'Danh mục', route: null },
      { label: product.category || 'Sản phẩm', route: categoryRoute ? `/danh-muc/${categoryRoute}` : null },
      { label: product.name }
    ];
  }


  formatDescription(description: string | undefined): string {
    if (!description) return '';
    return description.replace(/\n/g, '<br>');
  }

  getDiscountPrice(): number | null {
    const option = this.selectedOption();
    if (option && option.discountPrice) {
      return option.discountPrice;
    }
    const product = this.product();
    return product?.discountPrice ?? null;
  }
}

