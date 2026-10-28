import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { api } from '../http/api-url';
import {
  AppNotification,
  Application,
  ApplicationType,
  DashboardSummary,
  EducationDocument,
  MessageResponse,
  MyContestEntry,
  Profile,
  Survey,
  UpdateProfileRequest,
} from './models';

/** Личный кабинет: главная, анкета, документы, уведомления, заявки. */
@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly http = inject(HttpClient);

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(api('/api/student/dashboard-summary'));
  }

  // ---- анкета
  profile(): Observable<Profile> {
    return this.http.get<Profile>(api('/api/student/profile'));
  }

  updateProfile(request: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<Profile>(api('/api/student/profile'), request);
  }

  uploadDocument(file: File): Observable<EducationDocument> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<EducationDocument>(api('/api/student/profile/documents'), form);
  }

  deleteDocument(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(api(`/api/student/profile/documents/${id}`));
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(api(`/api/student/profile/documents/${id}`), { responseType: 'blob' });
  }

  // ---- уведомления
  notifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(api('/api/student/notifications'));
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(api('/api/student/notifications/unread-count'));
  }

  markRead(id: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api(`/api/student/notifications/${id}/read`), null);
  }

  markAllRead(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api('/api/student/notifications/read-all'), null);
  }

  // ---- заявки
  myContests(): Observable<MyContestEntry[]> {
    return this.http.get<MyContestEntry[]>(api('/api/student/contests/mine'));
  }

  survey(): Observable<Survey> {
    return this.http.get<Survey>(api('/api/student/survey'));
  }

  submitSurvey(answers: Record<string, string>): Observable<Survey> {
    return this.http.put<Survey>(api('/api/student/survey'), { agreement: true, answers });
  }

  applications(): Observable<Application[]> {
    return this.http.get<Application[]>(api('/api/student/applications'));
  }

  submitApplication(type: ApplicationType, topic: string, message?: string): Observable<Application> {
    return this.http.post<Application>(api('/api/student/applications'), { type, topic, message });
  }
}
