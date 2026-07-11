import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Course {
  id: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  lastScore: number | null;
  attemptsCount: number;
  hasAccess: boolean;
  createdBy?: string;
  languageId:number;
}

// ВОЗВРАЩАЕМ ИНТЕРФЕЙС, КОТОРЫЙ ТРЕБУЕТ КОМПОНЕНТ COURSE-VIEW
// Обновленный интерфейс контента курса/урока
export interface CourseContent {
  id: number;
  title: string;
  description: string;
  lessons?: any[];
  videoUrl?: string;
  textMaterial?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'https://c49w5cwg79ul.share.zrok.io/api';

  // ИСПРАВЛЕНО: Убрано дублирование private
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Получить курсы (Все / Только мои)
  getCourses(
    purchasedOnly: boolean = false,
    lang: string = 'ru'
  ): Observable<Course[]> {

    const options = {
      headers: this.authService.getAuthHeaders()
    };

    return this.http.get<Course[]>(
      `${this.apiUrl}/student/courses/subjects?purchasedOnly=${purchasedOnly}&lang=${lang}`,
      options
    );
  }

  // ВОЗВРАЩАЕМ МЕТОД ДЛЯ ПРОСМОТРА КУРСА ПО ID
  getCourseContent(
    courseId: number | string,
    lang: string = 'ru'
  ): Observable<CourseContent> {

    const options = {
      headers: this.authService.getAuthHeaders()
    };

    return this.http.get<CourseContent>(
      `${this.apiUrl}/student/courses/subjects/${courseId}/lessons?lang=${lang}`,
      options
    );
  }

  // Получить активные баннеры
  getActiveAds(): Observable<any[]> {
    const options = {
      headers: this.authService.getAuthHeaders()
    };
    return this.http.get<any[]>(`${this.apiUrl}/public/advertisements/active`, options);
  }
}
