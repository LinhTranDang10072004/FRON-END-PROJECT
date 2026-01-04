// Activity Log Interfaces

export interface ActivityLogDto {
  id: number;
  userId?: number;
  username?: string;
  fullName?: string;
  action: string;           // Tiếng Việt: "Nạp tiền", "Đăng nhập", etc.
  operation: string;        // Tiếng Anh: "deposit", "login", etc.
  ipAddress?: string;
  timestamp: string;         // ISO 8601 format
  description?: string;
  metadata?: string;         // JSON string
  userAgent?: string;
}

export interface ActivityLogListResponse {
  activityLogs: ActivityLogDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OperationStats {
  operation: string;
  count: number;
  lastActivity: string;    // ISO 8601 format
}

export interface ActivityStatsResponse {
  totalActivities: number;
  operations: OperationStats[];
}

