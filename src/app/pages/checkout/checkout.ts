import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart';
import { CartItem, CartResponse } from '../../models/cart.interfaces';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  cart = signal<CartResponse | null>(null);
  selectedItems = signal<CartItem[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  messageToSeller = signal('');
  showConfirmModal = signal(false);
  agreeToTerms = signal(false);
  detailedRequest = signal('');

  // Computed values
  totalAmount = computed(() => {
    return this.selectedItems().reduce((sum, item) => sum + item.totalPrice, 0);
  });

  totalQuantity = computed(() => {
    return this.selectedItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if coming from cart with selected items
    this.route.queryParams.subscribe(params => {
      const itemIds = params['items'];
      if (itemIds) {
        this.loadCartAndFilterItems(itemIds.split(',').map((id: string) => parseInt(id)));
      } else {
        // If no items specified, load all cart items
        this.loadCart();
      }
    });
  }

  loadCart() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cart.set(response);
        this.selectedItems.set(response.items);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.errorMessage.set('Không thể tải giỏ hàng. Vui lòng thử lại.');
        this.isLoading.set(false);
      }
    });
  }

  loadCartAndFilterItems(itemIds: number[]) {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cart.set(response);
        const filtered = response.items.filter(item => itemIds.includes(item.id));
        if (filtered.length === 0) {
          this.errorMessage.set('Không tìm thấy sản phẩm đã chọn.');
          this.router.navigate(['/cart']);
        } else {
          this.selectedItems.set(filtered);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.errorMessage.set('Không thể tải giỏ hàng. Vui lòng thử lại.');
        this.isLoading.set(false);
      }
    });
  }

  openConfirmModal() {
    if (!this.agreeToTerms()) {
      alert('Vui lòng đồng ý với Điều khoản hoạt động!');
      return;
    }
    
    if (this.selectedItems().length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm!');
      return;
    }
    
    this.showConfirmModal.set(true);
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
  }

  placeOrder() {
    // TODO: Implement order creation API call
    // For now, simulate order creation
    console.log('Placing order:', {
      items: this.selectedItems(),
      message: this.messageToSeller(),
      detailedRequest: this.detailedRequest(),
      totalAmount: this.totalAmount()
    });

    // Simulate API call
    setTimeout(() => {
      // Generate mock order ID
      const orderId = 'JHBKJK' + Math.random().toString(36).substr(2, 5).toUpperCase();
      this.router.navigate(['/order-confirmation'], {
        queryParams: {
          orderId: orderId,
          total: this.totalAmount()
        }
      });
    }, 500);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  goBack() {
    this.router.navigate(['/cart']);
  }
}

