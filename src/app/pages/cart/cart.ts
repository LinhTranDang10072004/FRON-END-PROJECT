import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart';
import { CartStateService } from '../../services/cart-state';
import { CartItem, CartResponse } from '../../models/cart.interfaces';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product.interfaces';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  private cartService = inject(CartService);
  private cartStateService = inject(CartStateService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);

  cart = signal<CartResponse | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  selectedItems = signal<Set<number>>(new Set());
  similarProducts = signal<Product[]>([]);

  // Computed values
  selectedItemsCount = computed(() => this.selectedItems().size);
  totalSelectedAmount = computed(() => {
    const cartData = this.cart();
    if (!cartData) return 0;
    
    return cartData.items
      .filter(item => this.selectedItems().has(item.id))
      .reduce((sum, item) => sum + item.totalPrice, 0);
  });

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCart();
    this.loadSimilarProducts();
  }

  loadCart() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cart.set(response);
        // Auto-select all items
        const allItemIds = new Set(response.items.map(item => item.id));
        this.selectedItems.set(allItemIds);
        // Update cart count in state service
        this.cartStateService.setCartCount(response.totalItems);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.errorMessage.set('Không thể tải giỏ hàng. Vui lòng thử lại.');
        this.isLoading.set(false);
      }
    });
  }

  loadSimilarProducts() {
    this.productService.getProducts(1, 4, undefined, undefined, undefined, undefined, undefined, 'newest').subscribe({
      next: (response) => {
        this.similarProducts.set(response.products.slice(0, 4));
      },
      error: (error) => {
        console.error('Error loading similar products:', error);
      }
    });
  }

  toggleSelectItem(itemId: number) {
    const selected = new Set(this.selectedItems());
    if (selected.has(itemId)) {
      selected.delete(itemId);
    } else {
      selected.add(itemId);
    }
    this.selectedItems.set(selected);
  }

  toggleSelectAll() {
    const cartData = this.cart();
    if (!cartData) return;
    
    const allSelected = cartData.items.length > 0 && 
                       cartData.items.every(item => this.selectedItems().has(item.id));
    
    if (allSelected) {
      this.selectedItems.set(new Set());
    } else {
      const allItemIds = new Set(cartData.items.map(item => item.id));
      this.selectedItems.set(allItemIds);
    }
  }

  isAllSelected(): boolean {
    const cartData = this.cart();
    if (!cartData || cartData.items.length === 0) return false;
    return cartData.items.every(item => this.selectedItems().has(item.id));
  }

  updateQuantity(itemId: number, newQuantity: number) {
    if (newQuantity < 1) return;
    
    this.cartService.updateCartItem(itemId, { quantity: newQuantity }).subscribe({
      next: () => {
        this.loadCart();
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        alert(error.error?.message || 'Không thể cập nhật số lượng. Vui lòng thử lại.');
      }
    });
  }

  increaseQuantity(item: CartItem) {
    this.updateQuantity(item.id, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity > 1) {
      this.updateQuantity(item.id, item.quantity - 1);
    }
  }

  removeItem(itemId: number) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      return;
    }
    
    this.cartService.removeCartItem(itemId).subscribe({
      next: () => {
        this.loadCart();
      },
      error: (error) => {
        console.error('Error removing item:', error);
        alert(error.error?.message || 'Không thể xóa sản phẩm. Vui lòng thử lại.');
      }
    });
  }

  removeSelectedItems() {
    const selected = Array.from(this.selectedItems());
    if (selected.length === 0) {
      alert('Vui lòng chọn sản phẩm cần xóa!');
      return;
    }
    
    if (!confirm(`Bạn có chắc muốn xóa ${selected.length} sản phẩm đã chọn?`)) {
      return;
    }
    
    // Remove items one by one
    let completed = 0;
    selected.forEach(itemId => {
      this.cartService.removeCartItem(itemId).subscribe({
        next: () => {
          completed++;
          if (completed === selected.length) {
            this.loadCart();
          }
        },
        error: (error) => {
          console.error('Error removing item:', error);
          completed++;
          if (completed === selected.length) {
            this.loadCart();
          }
        }
      });
    });
  }

  clearCart() {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      return;
    }
    
    this.cartService.clearCart().subscribe({
      next: () => {
        this.loadCart();
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
        alert(error.error?.message || 'Không thể xóa giỏ hàng. Vui lòng thử lại.');
      }
    });
  }

  checkout() {
    const selected = Array.from(this.selectedItems());
    if (selected.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
      return;
    }
    
    // Navigate to checkout with selected items
    this.router.navigate(['/checkout'], {
      queryParams: {
        items: selected.join(',')
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

  goBack() {
    this.router.navigate(['/']);
  }
}

