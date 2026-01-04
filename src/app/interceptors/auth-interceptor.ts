import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  // Lấy token từ storage (chỉ khi ở browser)
  let token: string | null = null;
  if (isPlatformBrowser(platformId)) {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    token = rememberMe 
      ? localStorage.getItem('token') 
      : sessionStorage.getItem('token');
  }

  // Thêm token vào header nếu có
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Xử lý response và error
  return next(req).pipe(
    catchError((error) => {
      // Nếu lỗi 401 (Unauthorized), redirect về login
      if (error.status === 401) {
        // Clear storage (chỉ khi ở browser)
        if (isPlatformBrowser(platformId)) {
          localStorage.clear();
          sessionStorage.clear();
        }
        router.navigate(['/login']);
      }
      
      // Nếu lỗi 403 (Forbidden), có thể hiển thị thông báo
      if (error.status === 403) {
        console.error('Bạn không có quyền thực hiện hành động này');
      }

      return throwError(() => error);
    })
  );
};
