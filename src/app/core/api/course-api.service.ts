import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { api } from '../http/api-url';
import {
  Advertisement,
  CertificateVerification,
  CourseCard,
  CourseGroup,
  CourseLessons,
  CourseProgress,
  ContactRequest,
  MessageResponse,
  PublicCourse,
  PublicStats,
  QuizAttempt,
  QuizResult,
} from './models';

/**
 * Студенческая часть API. Язык контента уходит заголовком Accept-Language (apiInterceptor),
 * поэтому передавать его в каждый метод не нужно.
 */
@Injectable({ providedIn: 'root' })
export class CourseApiService {
  private readonly http = inject(HttpClient);

  // ---- каталог
  getDashboardGroups(purchasedOnly: boolean): Observable<CourseGroup[]> {
    return this.http.get<CourseGroup[]>(api('/api/student/courses/dashboard-groups'), {
      params: { purchasedOnly },
    });
  }

  getMyCourses(): Observable<CourseCard[]> {
    return this.http.get<CourseCard[]>(api('/api/student/courses/subjects'), {
      params: { purchasedOnly: true },
    });
  }

  getPublicCatalog(): Observable<PublicCourse[]> {
    return this.http.get<PublicCourse[]>(api('/api/public/courses'));
  }

  getPublicStats(): Observable<PublicStats> {
    return this.http.get<PublicStats>(api('/api/public/stats'));
  }

  sendContactRequest(request: ContactRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api('/api/public/contact'), request);
  }

  getActiveAds(): Observable<Advertisement[]> {
    return this.http.get<Advertisement[]>(api('/api/public/advertisements/active'));
  }

  // ---- уроки и прогресс
  getLessons(courseId: number): Observable<CourseLessons> {
    return this.http.get<CourseLessons>(api(`/api/student/courses/subjects/${courseId}/lessons`));
  }

  getProgress(courseId: number): Observable<CourseProgress> {
    return this.http.get<CourseProgress>(api(`/api/student/progress/${courseId}`));
  }

  advanceToStep(courseId: number, step: number): Observable<CourseProgress> {
    return this.http.post<CourseProgress>(api(`/api/student/progress/${courseId}/step/${step}`), null);
  }

  // ---- тест
  startQuiz(courseId: number): Observable<QuizAttempt> {
    return this.http.post<QuizAttempt>(api(`/api/student/quiz/${courseId}/start`), null);
  }

  submitQuiz(courseId: number, attemptId: number, answers: Record<number, number>): Observable<QuizResult> {
    return this.http.post<QuizResult>(api(`/api/student/quiz/${courseId}/submit`), { attemptId, answers });
  }

  // ---- сертификаты
  downloadCertificate(courseId: number): Observable<Blob> {
    return this.http.get(api(`/api/student/certificates/download/${courseId}`), { responseType: 'blob' });
  }

  verifyCertificate(uuid: string): Observable<CertificateVerification> {
    return this.http.get<CertificateVerification>(api(`/api/public/verify/certificate/${encodeURIComponent(uuid)}`));
  }
}
