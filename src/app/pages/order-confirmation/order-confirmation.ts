import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart';
import { CartItem, CartResponse } from '../../models/cart.interfaces';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-order-confirmation',
  imports: [CommonModule, RouterModule],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.css',
})
export class OrderConfirmation implements OnInit {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  orderId = signal<string>('');
  orderDate = signal<string>('');
  totalAmount = signal<number>(0);
  discount = signal<number>(0);
  paymentAmount = signal<number>(0);
  orderItems = signal<CartItem[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get order info from query params
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      const total = params['total'];
      
      if (orderId && total) {
        this.orderId.set(orderId);
        this.totalAmount.set(parseFloat(total));
        this.paymentAmount.set(parseFloat(total));
        this.discount.set(0);
        this.orderDate.set(new Date().toLocaleDateString('vi-VN'));
        
        // Load cart items (in real app, this would come from order API)
        this.loadOrderItems();
      } else {
        // If no order info, redirect to home
        this.router.navigate(['/']);
      }
    });
  }

  loadOrderItems() {
    // In real app, this would fetch order details from API
    // For now, we'll load from cart (items that were just ordered)
    this.cartService.getCart().subscribe({
      next: (response) => {
        // In real app, order items would come from order API
        // For demo, we'll use cart items
        this.orderItems.set(response.items);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading order items:', error);
        this.isLoading.set(false);
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

  goToHome() {
    this.router.navigate(['/']);
  }

  goToOrders() {
    // TODO: Navigate to orders page when implemented
    this.router.navigate(['/']);
  }
}

