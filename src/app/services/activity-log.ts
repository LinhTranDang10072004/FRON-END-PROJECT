import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ActivityLogListResponse, 
  ActivityStatsResponse 
} from '../models/activity-log.interfaces';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root',
})
export class ActivityLogService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Lấy nhật ký hoạt động của user hiện tại
   */
  getMyActivities(params?: {
    operation?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Observable<ActivityLogListResponse> {
    let httpParams = new HttpParams();
    
    if (params?.operation) {
      httpParams = httpParams.set('operation', params.operation);
    }
    if (params?.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params?.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    return this.http.get<ActivityLogListResponse>(`${this.apiUrl}/ActivityLog/my-activities`, { params: httpParams });
  }

  /**
   * Admin: Lấy nhật ký hoạt động của tất cả users
   */
  getAllActivities(params?: {
    userId?: number;
    operation?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Observable<ActivityLogListResponse> {
    let httpParams = new HttpParams();
    
    if (params?.userId) {
      httpParams = httpParams.set('userId', params.userId.toString());
    }
    if (params?.operation) {
      httpParams = httpParams.set('operation', params.operation);
    }
    if (params?.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params?.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    
    return this.http.get<ActivityLogListResponse>(`${this.apiUrl}/ActivityLog/all`, { params: httpParams });
  }

  /**
   * Lấy thống kê hoạt động của user hiện tại
   */
  getMyStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Observable<ActivityStatsResponse> {
    let httpParams = new HttpParams();
    
    if (params?.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params?.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }
    
    return this.http.get<ActivityStatsResponse>(`${this.apiUrl}/ActivityLog/my-stats`, { params: httpParams });
  }
}

