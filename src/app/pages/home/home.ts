import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product.interfaces';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  searchQuery = signal('');
  isSearching = signal(false);
  private productService = inject(ProductService);
  
  // Products from API
  products = signal<Product[]>([]);
  isLoadingProducts = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  searchResults = signal<Product[]>([]);
  searchTotalPages = signal(1);
  
  // Carousel
  carouselStartIndex = signal(0);
  itemsPerView = signal(4);

  // Product Categories
  productCategories = [
    {
      icon: 'email',
      title: 'Email',
      description: 'Gmail, yahoo mail, hot mail... và nhiều hơn thế nữa',
      color: '#7c3aed',
      route: 'Email',
      priceRange: '1.000 ₫ - 15.000 ₫',
      rating: 4.5,
      sales: 136276,
      complaints: 0.0
    },
    {
      icon: 'software',
      title: 'Phần mềm',
      description: 'Các phần mềm chuyên dụng cho kiếm tiền online từ những coder uy tín',
      color: '#7c3aed',
      route: 'PhanMem',
      priceRange: '1.000 ₫ - 15.000 ₫',
      rating: 4.5,
      sales: 136276,
      complaints: 0.0
    },
    {
      icon: 'account',
      title: 'Tài khoản',
      description: 'Fb, BM, key window, kaspersky....',
      color: '#7c3aed',
      route: 'TaiKhoan',
      priceRange: '1.000 ₫ - 15.000 ₫',
      rating: 4.5,
      sales: 138276,
      complaints: 0.0
    },
    {
      icon: 'other',
      title: 'Khác',
      description: 'Các sản phẩm số khác',
      color: '#7c3aed',
      route: 'Khac',
      priceRange: '1.000 ₫ - 15.000 ₫',
      rating: 4.5,
      sales: 136276,
      complaints: 0.0
    }
  ];

  // Services
  services = [
    {
      image: 'https://www.shutterstock.com/shutterstock/photos/2590473653/display_1500/stock-photo-a-businesswoman-holding-a-mobile-phone-with-an-excited-expression-and-a-dollar-sign-with-a-modern-2590473653.jpg',
      title: 'Tăng tương tác',
      description: 'Tăng like, view.share, comment... cho sản phẩm của bạn',
      color: '#3b82f6'
    },
    {
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcrmTUtQHo3YNf8wL4YQ3joeF8_ZdjYX_dUuROSwnGaQxBZWm8',
      title: 'Dịch vụ phần mềm',
      description: 'Dịch vụ code tool MMO, đồ họa, video... và các dịch vụ liên quan',
      color: '#3b82f6'
    },
    {
      image: 'https://www.thetrademarkhelpline.com/wp-content/uploads/2024/12/NFTs-scaled.jpg',
      title: 'Blockchain',
      description: 'Dịch vụ tiền ảo, NFT, coinlist... và các dịch vụ blockchain khác',
      color: '#3b82f6'
    },
    {
      image: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRkOYcO7gR1Yr_J8zLC4tQ9mnkI_psoQfIFg76GFxpNcb5tIkY_',
      title: 'Dịch vụ khác',
      description: 'Các dịch vụ MMO phổ biến khác hiện nay',
      color: '#3b82f6'
    }
  ];

  // FAQ
  activeTab = signal<'buyer' | 'seller' | 'collaborator'>('buyer');
  expandedQuestion = signal<number | null>(null);

  buyerQuestions = [
    {
      id: 1,
      question: 'Làm sao để mua sản phẩm?',
      answer: 'Bạn có thể tìm kiếm sản phẩm trên trang chủ, chọn sản phẩm phù hợp và thực hiện thanh toán.'
    },
    {
      id: 2,
      question: 'Email không trùng lặp là gì?',
      answer: 'Email không trùng lặp là email chưa từng được bán trên nền tảng này. Chúng tôi có cơ chế kiểm tra để đảm bảo tài khoản bạn mua chưa từng được bán trước đó.'
    },
    {
      id: 3,
      question: 'Làm sao để nạp tiền?',
      answer: 'Bạn có thể nạp tiền qua các phương thức thanh toán được hỗ trợ trên nền tảng.'
    },
    {
      id: 4,
      question: 'Tôi có thể trả hàng hay không?',
      answer: 'Có, bạn có thể khiếu nại trong vòng 3 ngày sau khi mua hàng nếu sản phẩm không đúng như mô tả.'
    },
    {
      id: 5,
      question: 'Tôi nạp tiền bị lỗi?',
      answer: 'Vui lòng liên hệ với bộ phận hỗ trợ để được giải quyết.'
    },
    {
      id: 6,
      question: 'Tôi chuyển nhầm tiền?',
      answer: 'Vui lòng liên hệ ngay với bộ phận hỗ trợ để được hỗ trợ.'
    },
    {
      id: 7,
      question: 'Tôi có cần thuê trung gian không?',
      answer: 'Không, nền tảng của chúng tôi đảm bảo giao dịch an toàn mà không cần trung gian.'
    }
  ];

  sellerQuestions = [
    {
      id: 1,
      question: 'Làm sao để bán sản phẩm?',
      answer: 'Bạn cần đăng ký tài khoản seller và tạo sản phẩm trên nền tảng.'
    }
  ];

  collaboratorQuestions = [
    {
      id: 1,
      question: 'Làm sao để trở thành cộng tác viên?',
      answer: 'Thông tin về chương trình cộng tác viên có trong phần FAQ.'
    }
  ];

  onSearch(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const query = this.searchQuery().trim();
    if (query) {
      this.isSearching.set(true);
      this.currentPage.set(1);
      this.searchProducts(query);
    } else {
      this.isSearching.set(false);
      this.loadProducts();
    }
  }

  searchProducts(query: string) {
    this.isLoadingProducts.set(true);
    this.productService.searchProductsByName(
      query,
      this.currentPage(),
      12,
      'newest'
    ).subscribe({
      next: (response) => {
        this.searchResults.set(response.products);
        this.searchTotalPages.set(response.totalPages);
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        console.error('Error searching products:', error);
        this.isLoadingProducts.set(false);
        this.searchResults.set([]);
      }
    });
  }

  onSearchPageChange(page: number) {
    if (page >= 1 && page <= this.searchTotalPages()) {
      this.currentPage.set(page);
      const query = this.searchQuery().trim();
      if (query) {
        this.searchProducts(query);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  clearSearch() {
    this.searchQuery.set('');
    this.isSearching.set(false);
    this.currentPage.set(1);
    this.loadProducts();
  }

  setActiveTab(tab: 'buyer' | 'seller' | 'collaborator') {
    this.activeTab.set(tab);
    this.expandedQuestion.set(null);
  }

  toggleQuestion(id: number) {
    if (this.expandedQuestion() === id) {
      this.expandedQuestion.set(null);
    } else {
      this.expandedQuestion.set(id);
    }
  }

  getCurrentQuestions() {
    switch (this.activeTab()) {
      case 'buyer':
        return this.buyerQuestions;
      case 'seller':
        return this.sellerQuestions;
      case 'collaborator':
        return this.collaboratorQuestions;
    }
  }

  getServiceGradient(title: string): string {
    const gradients: { [key: string]: string } = {
      'Tăng tương tác': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      'Dịch vụ phần mềm': 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
      'Blockchain': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      'Dịch vụ khác': 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)'
    };
    return gradients[title] || 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)';
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoadingProducts.set(true);
    this.productService.getProducts(
      this.currentPage(), 
      10, 
      undefined, // search
      undefined, // category
      undefined, // serviceType
      undefined, // productType
      undefined, // emailTypes
      'popular'  // sortBy
    ).subscribe({
      next: (response) => {
        this.products.set(response.products);
        this.totalPages.set(response.totalPages);
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        // Chỉ log lỗi nếu không phải lỗi do backend chưa chạy
        if (error.status !== 0 && error.status !== 404) {
          console.error('Error loading products:', error);
        } else {
          // Backend chưa chạy hoặc không tìm thấy - không log để tránh spam console
          console.log('Backend chưa sẵn sàng, sử dụng dữ liệu mặc định');
        }
        this.isLoadingProducts.set(false);
        this.products.set([]);
      }
    });
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

  getProductImages(product: Product): string[] {
    const images = this.productService.parseImageUrls(product);
    if (images.length > 0) {
      return images;
    }
    return product.imageUrl ? [product.imageUrl] : [];
  }

  scrollCarousel(direction: 'left' | 'right') {
    const currentIndex = this.carouselStartIndex();
    const itemsPerView = this.itemsPerView();
    const maxIndex = Math.max(0, this.products().length - itemsPerView);
    
    if (direction === 'left') {
      this.carouselStartIndex.set(Math.max(0, currentIndex - itemsPerView));
    } else {
      this.carouselStartIndex.set(Math.min(maxIndex, currentIndex + itemsPerView));
    }
  }

  canScrollLeft(): boolean {
    return this.carouselStartIndex() > 0;
  }

  canScrollRight(): boolean {
    const itemsPerView = this.itemsPerView();
    const maxIndex = Math.max(0, this.products().length - itemsPerView);
    return this.carouselStartIndex() < maxIndex;
  }

  getProductRating(product: Product): number {
    return product.rating > 0 ? product.rating : 0;
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
}
