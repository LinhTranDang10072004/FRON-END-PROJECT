// Cart Interfaces
export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    imageUrl: string;
    seller: {
      id: number;
      username: string;
      shopName: string;
    };
  };
  productOption: {
    id: number;
    name: string;
    description: string;
  } | null;
  quantity: number;
  unitPrice: number;
  discountPrice: number | null;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  itemCount: number;
}

export interface AddToCartDto {
  productId: number;
  productOptionId?: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CartMessageResponse {
  message: string;
}

