import { Component, signal, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product';
import { AuthService } from '../../services/auth';
import { UpdateProductDto, Product } from '../../models/product.interfaces';

@Component({
  selector: 'app-edit-product',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.css',
})
export class EditProduct implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  productForm: FormGroup;
  productId = signal<number | null>(null);
  isLoading = signal(false);
  isLoadingProduct = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isProductDeleted = signal(false);

  // Filter options
  categories = signal<string[]>([]);
  serviceTypes = signal<string[]>([]);

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      price: ['', [Validators.required, Validators.min(0)]],
      discountPrice: ['', [Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      imageUrl: ['', [Validators.maxLength(500)]],
      imageUrls: ['', [Validators.maxLength(2000)]],
      category: [''],
      serviceType: [''],
      isFeatured: [false],
      isActive: [true]
    });
  }

  ngOnInit() {
    // Kiểm tra authentication và role
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isSeller()) {
      this.router.navigate(['/become-seller']);
      return;
    }

    // Lấy productId từ route
    this.route.params.subscribe(params => {
      const id = params['id'] ? parseInt(params['id']) : null;
      if (id) {
        this.productId.set(id);
        this.loadProduct(id);
      } else {
        this.errorMessage.set('Không tìm thấy ID sản phẩm');
      }
    });

    this.loadFilters();
  }

  loadFilters() {
    this.productService.getFilters().subscribe({
      next: (filters) => {
        this.categories.set(filters.categories);
        this.serviceTypes.set(filters.serviceTypes);
      },
      error: (error) => {
        console.error('Error loading filters:', error);
      }
    });
  }

  loadProduct(id: number) {
    this.isLoadingProduct.set(true);
    this.errorMessage.set(null);

    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.isLoadingProduct.set(false);
        
        // Kiểm tra sản phẩm có bị xóa không
        this.isProductDeleted.set(product.isActive === false);
        
        // Điền form với dữ liệu sản phẩm
        this.productForm.patchValue({
          name: product.name || '',
          description: product.description || '',
          price: product.price || 0,
          discountPrice: product.discountPrice || '',
          stock: product.stock || 0,
          imageUrl: product.imageUrl || '',
          imageUrls: product.imageUrls || '',
          category: product.category || '',
          serviceType: product.serviceType || '',
          isFeatured: product.isFeatured || false,
          isActive: product.isActive !== false // Mặc định true nếu undefined
        });
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.isLoadingProduct.set(false);
        this.errorMessage.set(
          error.error?.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.'
        );
      }
    });
  }

  onSubmit() {
    if (!this.productForm.valid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const productId = this.productId();
    if (!productId) {
      this.errorMessage.set('Không tìm thấy ID sản phẩm');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formData = this.productForm.value;
    
    // Validate discount price
    if (formData.discountPrice && formData.discountPrice >= formData.price) {
      this.errorMessage.set('Giá khuyến mãi phải nhỏ hơn giá gốc');
      this.isLoading.set(false);
      return;
    }

    // Prepare product data
    const productData: any = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
      stock: parseInt(formData.stock),
      imageUrl: formData.imageUrl || undefined,
      imageUrls: formData.imageUrls || undefined,
      category: formData.category || undefined,
      serviceType: formData.serviceType || undefined,
      isFeatured: formData.isFeatured || false,
      isActive: formData.isActive !== false // Khôi phục sản phẩm nếu isActive = true
    };

    this.productService.updateProduct(productId, productData).subscribe({
      next: (product) => {
        console.log('Product updated successfully:', product);
        this.isLoading.set(false);
        this.successMessage.set('Cập nhật sản phẩm thành công!');
        
        // Redirect to shop management after 1 second
        setTimeout(() => {
          this.router.navigate(['/shop-management']);
        }, 1000);
      },
      error: (error) => {
        console.error('Update product error:', error);
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Cập nhật sản phẩm thất bại. Vui lòng thử lại.'
        );
      }
    });
  }

  onCancel() {
    this.router.navigate(['/shop-management']);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) {
      return 'Trường này là bắt buộc';
    }
    if (field.errors['min']) {
      return `Giá trị tối thiểu là ${field.errors['min'].min}`;
    }
    if (field.errors['maxlength']) {
      return `Tối đa ${field.errors['maxlength'].requiredLength} ký tự`;
    }
    return '';
  }
}

