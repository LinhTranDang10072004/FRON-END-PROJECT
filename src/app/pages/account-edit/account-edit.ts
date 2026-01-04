import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { UserProfile, UpdateUserProfileDto } from '../../models/auth.interfaces';

@Component({
  selector: 'app-account-edit',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './account-edit.html',
  styleUrl: './account-edit.css',
})
export class AccountEdit implements OnInit {
  authService = inject(AuthService); // Public để dùng trong template
  router = inject(Router); // Public để dùng trong template

  profile = signal<UserProfile | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form data
  shopName = signal('');
  phone = signal('');
  email = signal('');
  facebookLink = signal('');

  // eKYC images
  ekycFrontImage = signal<string | null>(null);
  ekycBackImage = signal<string | null>(null);
  ekycPortraitImage = signal<string | null>(null);

  // File input refs
  frontImageInput?: HTMLInputElement;
  backImageInput?: HTMLInputElement;
  portraitImageInput?: HTMLInputElement;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.getUserProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.shopName.set(profile.shopName || '');
        this.phone.set(profile.phone || '');
        this.email.set(profile.email);
        this.facebookLink.set(profile.facebookLink || '');
        this.ekycFrontImage.set(profile.ekycFrontImage);
        this.ekycBackImage.set(profile.ekycBackImage);
        this.ekycPortraitImage.set(profile.ekycPortraitImage);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.errorMessage.set('Không thể tải thông tin tài khoản');
        this.isLoading.set(false);
      }
    });
  }

  onImageSelect(event: Event, type: 'front' | 'back' | 'portrait') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'front') {
          this.ekycFrontImage.set(result);
        } else if (type === 'back') {
          this.ekycBackImage.set(result);
        } else {
          this.ekycPortraitImage.set(result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(type: 'front' | 'back' | 'portrait') {
    if (type === 'front' && this.frontImageInput) {
      this.frontImageInput.click();
    } else if (type === 'back' && this.backImageInput) {
      this.backImageInput.click();
    } else if (type === 'portrait' && this.portraitImageInput) {
      this.portraitImageInput.click();
    }
  }

  updateProfile() {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const updateData: UpdateUserProfileDto = {
      shopName: this.shopName(),
      phone: this.phone(),
      facebookLink: this.facebookLink(),
    };

    // Only include image URLs if they've been updated
    if (this.ekycFrontImage()) {
      updateData.ekycFrontImage = this.ekycFrontImage()!;
    }
    if (this.ekycBackImage()) {
      updateData.ekycBackImage = this.ekycBackImage()!;
    }
    if (this.ekycPortraitImage()) {
      updateData.ekycPortraitImage = this.ekycPortraitImage()!;
    }

    this.authService.updateUserProfile(updateData).subscribe({
      next: () => {
        this.successMessage.set('Cập nhật thông tin thành công!');
        this.isSaving.set(false);
        setTimeout(() => {
          this.router.navigate(['/account']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.errorMessage.set(error.error?.message || 'Không thể cập nhật thông tin');
        this.isSaving.set(false);
      }
    });
  }

  navigateToAccount() {
    this.router.navigate(['/account']);
  }
}

