import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CartResponse, AddToCartDto, UpdateCartItemDto, CartMessageResponse } from '../models/cart.interfaces';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Lấy giỏ hàng của user hiện tại
   */
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.apiUrl}/Cart`);
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  addToCart(data: AddToCartDto): Observable<CartMessageResponse> {
    return this.http.post<CartMessageResponse>(`${this.apiUrl}/Cart`, data);
  }

  /**
   * Cập nhật số lượng item trong giỏ hàng
   */
  updateCartItem(itemId: number, data: UpdateCartItemDto): Observable<CartMessageResponse> {
    return this.http.put<CartMessageResponse>(`${this.apiUrl}/Cart/${itemId}`, data);
  }

  /**
   * Xóa một item khỏi giỏ hàng
   */
  removeCartItem(itemId: number): Observable<CartMessageResponse> {
    return this.http.delete<CartMessageResponse>(`${this.apiUrl}/Cart/${itemId}`);
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  clearCart(): Observable<CartMessageResponse> {
    return this.http.delete<CartMessageResponse>(`${this.apiUrl}/Cart`);
  }
}

