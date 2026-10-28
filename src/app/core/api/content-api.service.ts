import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { api } from '../http/api-url';
import { Contest, CourseDetail, Direction, FaqItem, NewsItem, NewsPage, SiteSettings } from './models';

/** Публичный контент: каталог, страница курса, новости, FAQ, настройки сайта. */
@Injectable({ providedIn: 'root' })
export class ContentApiService {
  private readonly http = inject(HttpClient);

  directions(): Observable<Direction[]> {
    return this.http.get<Direction[]>(api('/api/public/directions'));
  }

  course(id: number): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(api(`/api/public/courses/${id}`));
  }

  coursePlan(id: number): Observable<Blob> {
    return this.http.get(api(`/api/public/courses/${id}/plan`), { responseType: 'blob' });
  }

  contests(): Observable<Contest[]> {
    return this.http.get<Contest[]>(api('/api/public/contests'));
  }

  contest(id: number): Observable<Contest> {
    return this.http.get<Contest>(api(`/api/public/contests/${id}`));
  }

  news(page = 0, size = 9): Observable<NewsPage> {
    return this.http.get<NewsPage>(api('/api/public/news'), { params: { page, size } });
  }

  newsItem(id: number): Observable<NewsItem> {
    return this.http.get<NewsItem>(api(`/api/public/news/${id}`));
  }

  faq(): Observable<FaqItem[]> {
    return this.http.get<FaqItem[]>(api('/api/public/faq'));
  }

  settings(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(api('/api/public/settings'));
  }
}
