import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CartStateService {
  private cartCount = signal(0);

  getCartCount() {
    return this.cartCount.asReadonly();
  }

  setCartCount(count: number) {
    this.cartCount.set(count);
  }

  incrementCartCount(amount: number = 1) {
    this.cartCount.update(count => count + amount);
  }

  decrementCartCount(amount: number = 1) {
    this.cartCount.update(count => Math.max(0, count - amount));
  }
}

