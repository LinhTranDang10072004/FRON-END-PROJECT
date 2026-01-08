import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root',
})
export class SeedService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  seedData(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/Seed`, {});
  }
}




