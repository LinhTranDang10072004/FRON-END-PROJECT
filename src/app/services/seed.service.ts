import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SeedService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7088/api';

  seedData(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/seed`, {});
  }
}




