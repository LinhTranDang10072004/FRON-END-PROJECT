import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-seller-success',
  imports: [CommonModule],
  templateUrl: './seller-success.html',
  styleUrl: './seller-success.css',
})
export class SellerSuccess {
  private router = inject(Router);

  goToShopManagement() {
    this.router.navigate(['/shop-management']);
  }
}

