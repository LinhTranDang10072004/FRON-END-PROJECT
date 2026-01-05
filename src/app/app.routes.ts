import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.Register)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./components/email-verification/email-verification').then(m => m.EmailVerification)
  },
  {
    path: 'seller/:id',
    loadComponent: () => import('./pages/seller-products/seller-products').then(m => m.SellerProducts)
  },
  {
    path: 'danh-muc',
    loadComponent: () => import('./pages/category/category').then(m => m.Category)
  },
  {
    path: 'danh-muc/:categoryName',
    loadComponent: () => import('./pages/category/category').then(m => m.Category)
  },
  {
    path: 'products/:productType',
    loadComponent: () => import('./pages/products/products').then(m => m.Products)
  },
  {
    path: 'become-seller',
    loadComponent: () => import('./components/become-seller/become-seller').then(m => m.BecomeSeller)
  },
  {
    path: 'seller-success',
    loadComponent: () => import('./components/seller-success/seller-success').then(m => m.SellerSuccess)
  },
  {
    path: 'shop-management',
    loadComponent: () => import('./pages/shop-management/shop-management').then(m => m.ShopManagement)
  },
  {
    path: 'create-product',
    loadComponent: () => import('./pages/create-product/create-product').then(m => m.CreateProduct)
  },
  {
    path: 'edit-product/:id',
    loadComponent: () => import('./pages/edit-product/edit-product').then(m => m.EditProduct)
  },
  {
    path: 'san-pham/:productCode',
    loadComponent: () => import('./pages/product-detail/product-detail').then(m => m.ProductDetail)
  },
  {
    path: 'account',
    loadComponent: () => import('./pages/account-info/account-info').then(m => m.AccountInfo)
  },
  {
    path: 'account/edit',
    loadComponent: () => import('./pages/account-edit/account-edit').then(m => m.AccountEdit)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart').then(m => m.Cart)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout').then(m => m.Checkout)
  },
  {
    path: 'order-confirmation',
    loadComponent: () => import('./pages/order-confirmation/order-confirmation').then(m => m.OrderConfirmation)
  },
  {
    path: 'account/wallet',
    loadComponent: () => import('./pages/wallet/wallet').then(m => m.Wallet)
  },
  {
    path: 'account/wallet/deposit',
    loadComponent: () => import('./pages/wallet-deposit/wallet-deposit').then(m => m.WalletDeposit)
  },
  {
    path: 'account/wallet/withdraw',
    loadComponent: () => import('./pages/wallet-withdraw/wallet-withdraw').then(m => m.WalletWithdraw)
  },
  {
    path: 'admin/wallet',
    loadComponent: () => import('./pages/admin-wallet/admin-wallet').then(m => m.AdminWallet)
  },
  {
    path: 'account/vat',
    loadComponent: () => import('./pages/vat-invoice/vat-invoice').then(m => m.VatInvoiceComponent)
  },
  {
    path: 'account/activity',
    loadComponent: () => import('./pages/activity-log/activity-log').then(m => m.ActivityLogComponent)
  }
];
