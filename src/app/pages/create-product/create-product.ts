import { Component, signal, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product';
import { AuthService } from '../../services/auth';
import { CreateProductDto } from '../../models/product.interfaces';

@Component({
  selector: 'app-create-product',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-product.html',
  styleUrl: './create-product.css',
})
export class CreateProduct implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  productForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

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
      isFeatured: [false]
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

  onSubmit() {
    if (!this.productForm.valid) {
      this.productForm.markAllAsTouched();
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
    const productData: CreateProductDto = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
      stock: parseInt(formData.stock),
      imageUrl: formData.imageUrl || undefined,
      imageUrls: formData.imageUrls || undefined,
      category: formData.category || undefined,
      serviceType: formData.serviceType || undefined,
      isFeatured: formData.isFeatured || false
    };

    this.productService.createProduct(productData).subscribe({
      next: (product) => {
        console.log('Product created successfully:', product);
        this.isLoading.set(false);
        this.successMessage.set('Tạo sản phẩm thành công!');
        
        // Redirect to shop management after 1 second
        setTimeout(() => {
          this.router.navigate(['/shop-management']);
        }, 1000);
      },
      error: (error) => {
        console.error('Create product error:', error);
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Tạo sản phẩm thất bại. Vui lòng thử lại.'
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

