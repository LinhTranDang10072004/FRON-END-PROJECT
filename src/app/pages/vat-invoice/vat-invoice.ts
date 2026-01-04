import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { VatInvoiceService } from '../../services/vatinvoice';
import { VatInvoice as VatInvoiceModel, VatInvoiceDto } from '../../models/vatinvoice.interfaces';

@Component({
  selector: 'app-vat-invoice',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './vat-invoice.html',
  styleUrl: './vat-invoice.css',
})
export class VatInvoiceComponent implements OnInit {
  authService = inject(AuthService); // Public for template
  private vatInvoiceService = inject(VatInvoiceService);
  private router = inject(Router);

  // Data
  vatInvoices = signal<VatInvoiceModel[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Form state
  showForm = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  isSaving = signal(false);

  // Form data
  formData = signal<VatInvoiceDto>({
    customerType: 1, // Mặc định: Cá nhân
    fullName: '',
    taxCode: null,
    cccd: null,
    address: null,
    email: null,
    companyName: null,
    isDefault: false
  });

  // Form errors
  formErrors = signal<{ [key: string]: string }>({});

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadVatInvoices();
  }

  loadVatInvoices() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.vatInvoiceService.getVatInvoices().subscribe({
      next: (response) => {
        if (response.success) {
          this.vatInvoices.set(response.data);
        } else {
          this.errorMessage.set(response.message || 'Không thể tải danh sách hóa đơn VAT');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading VAT invoices:', error);
        this.errorMessage.set('Không thể tải danh sách hóa đơn VAT. Vui lòng thử lại.');
        this.isLoading.set(false);
      }
    });
  }

  openCreateForm() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.formData.set({
      customerType: 1,
      fullName: '',
      taxCode: null,
      cccd: null,
      address: null,
      email: null,
      companyName: null,
      isDefault: false
    });
    this.formErrors.set({});
    this.showForm.set(true);
  }

  openEditForm(vatInvoice: VatInvoiceModel) {
    this.isEditing.set(true);
    this.editingId.set(vatInvoice.id);
    
    // Nếu là công ty và có companyName, dùng companyName, nếu không dùng fullName
    const companyName = vatInvoice.customerType === 2 
      ? (vatInvoice.companyName || vatInvoice.fullName)
      : null;
    
    this.formData.set({
      customerType: vatInvoice.customerType,
      fullName: vatInvoice.customerType === 1 ? vatInvoice.fullName : '',
      taxCode: vatInvoice.taxCode || null,
      cccd: vatInvoice.cccd || null,
      address: vatInvoice.address || null,
      email: vatInvoice.email || null,
      companyName: companyName,
      isDefault: vatInvoice.isDefault
    });
    this.formErrors.set({});
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.formErrors.set({});
  }

  validateForm(): boolean {
    const errors: { [key: string]: string } = {};
    const data = this.formData();

    if (data.customerType === 1) {
      // Validation cho Cá nhân
      if (!data.fullName || data.fullName.trim().length === 0) {
        errors['fullName'] = 'Họ và tên là bắt buộc';
      } else if (data.fullName.length > 200) {
        errors['fullName'] = 'Họ và tên không được vượt quá 200 ký tự';
      }
    } else {
      // Validation cho Công ty
      if (!data.companyName || data.companyName.trim().length === 0) {
        errors['companyName'] = 'Tên công ty là bắt buộc';
      } else if (data.companyName.length > 200) {
        errors['companyName'] = 'Tên công ty không được vượt quá 200 ký tự';
      }
    }

    if (data.taxCode && data.taxCode.length > 50) {
      errors['taxCode'] = 'Mã số thuế không được vượt quá 50 ký tự';
    }

    if (data.cccd && data.cccd.length > 20) {
      errors['cccd'] = 'Số CCCD không được vượt quá 20 ký tự';
    }

    if (data.address && data.address.length > 500) {
      errors['address'] = 'Địa chỉ không được vượt quá 500 ký tự';
    }

    if (data.customerType === 2) {
      if (data.email && !this.isValidEmail(data.email)) {
        errors['email'] = 'Email không hợp lệ';
      }
    }

    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  saveVatInvoice() {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving.set(true);
    const data = { ...this.formData() };

    // Trim các trường string
    if (data.fullName) data.fullName = data.fullName.trim();
    if (data.taxCode) data.taxCode = data.taxCode.trim();
    if (data.cccd) data.cccd = data.cccd.trim();
    if (data.address) data.address = data.address.trim();
    if (data.email) data.email = data.email.trim();
    if (data.companyName) data.companyName = data.companyName.trim();

    // Nếu là công ty, fullName = companyName
    if (data.customerType === 2 && data.companyName) {
      data.fullName = data.companyName;
    }

    // Xóa các trường null hoặc rỗng
    if (!data.taxCode || data.taxCode.length === 0) data.taxCode = null;
    if (!data.cccd || data.cccd.length === 0) data.cccd = null;
    if (!data.address || data.address.length === 0) data.address = null;
    if (!data.email || data.email.length === 0) data.email = null;
    if (!data.companyName || data.companyName.length === 0) data.companyName = null;

    const request = this.isEditing() && this.editingId()
      ? this.vatInvoiceService.updateVatInvoice(this.editingId()!, data)
      : this.vatInvoiceService.createVatInvoice(data);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.closeForm();
          this.loadVatInvoices();
          alert(this.isEditing() ? 'Cập nhật thông tin hóa đơn VAT thành công!' : 'Tạo thông tin hóa đơn VAT thành công!');
        } else {
          this.errorMessage.set(response.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Error saving VAT invoice:', error);
        this.errorMessage.set(error.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        this.isSaving.set(false);
      }
    });
  }

  deleteVatInvoice(id: number) {
    if (!confirm('Bạn có chắc chắn muốn xóa thông tin hóa đơn VAT này?')) {
      return;
    }

    this.vatInvoiceService.deleteVatInvoice(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadVatInvoices();
          alert('Xóa thông tin hóa đơn VAT thành công!');
        } else {
          this.errorMessage.set(response.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      },
      error: (error) => {
        console.error('Error deleting VAT invoice:', error);
        this.errorMessage.set(error.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    });
  }

  setDefaultVatInvoice(id: number) {
    this.vatInvoiceService.setDefaultVatInvoice(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadVatInvoices();
          alert('Đặt thông tin hóa đơn VAT làm mặc định thành công!');
        } else {
          this.errorMessage.set(response.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      },
      error: (error) => {
        console.error('Error setting default VAT invoice:', error);
        this.errorMessage.set(error.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    });
  }

  // Form helpers
  updateCustomerType(type: 1 | 2) {
    this.formData.update(f => ({ ...f, customerType: type }));
    // Clear company-specific fields when switching to individual
    if (type === 1) {
      this.formData.update(f => ({ ...f, companyName: null, email: null }));
    }
    // Clear individual-specific fields when switching to company
    if (type === 2) {
      this.formData.update(f => ({ ...f, cccd: null }));
    }
  }

  updateField(field: keyof VatInvoiceDto, value: any) {
    this.formData.update(f => ({ ...f, [field]: value }));
    // Clear error when user starts typing
    if (this.formErrors()[field]) {
      this.formErrors.update(errors => {
        const newErrors = { ...errors };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  toggleIsDefault() {
    this.formData.update(f => ({ ...f, isDefault: !f.isDefault }));
  }

  // Display helpers
  getCustomerTypeName(type: 1 | 2): string {
    return type === 1 ? 'Cá nhân' : 'Công ty';
  }
}

