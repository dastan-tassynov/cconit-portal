import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { api } from '../http/api-url';
import {
  AdminContest,
  AdminDirection,
  AdminFaq,
  AdminLesson,
  AdminNews,
  Advertisement,
  Application,
  ApplicationStatus,
  ApplicationType,
  ConstructorSubject,
  ContactRequest,
  ContentLanguage,
  ContestEntryAdmin,
  ContestRequest,
  CreateSubjectRequest,
  EducationDocument,
  LessonTranslationRequest,
  MessageResponse,
  NameChange,
  OrleuCertificate,
  OrleuOverview,
  OrleuProgram,
  QuizLocked,
  PortalUser,
  QuizQuestionRequest,
  SiteSettings,
  StudentAdmin,
  SubjectDetails,
  TranslationRequest,
  UpdateStudentRequest,
  UserRole,
} from './models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  // ---- курсы
  getSubjects(): Observable<ConstructorSubject[]> {
    return this.http.get<ConstructorSubject[]>(api('/api/admin/courses/subjects'));
  }

  createSubject(request: CreateSubjectRequest): Observable<ConstructorSubject> {
    return this.http.post<ConstructorSubject>(api('/api/admin/courses/subjects'), request);
  }

  setHidden(subjectId: number, hidden: boolean): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(api(`/api/admin/courses/subjects/${subjectId}/hidden`), null, {
      params: { hidden },
    });
  }

  updatePrice(subjectId: number, price: number | null): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(api(`/api/admin/courses/subjects/${subjectId}/price`), { price });
  }

  saveSubjectTranslation(subjectId: number, request: TranslationRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api(`/api/admin/courses/subjects/${subjectId}/translation`), request);
  }

  // ---- детали курса для каталога
  getSubjectDetails(subjectId: number): Observable<SubjectDetails> {
    return this.http.get<SubjectDetails>(api(`/api/admin/courses/subjects/${subjectId}/details`));
  }

  saveSubjectDetails(subjectId: number, details: SubjectDetails): Observable<SubjectDetails> {
    return this.http.put<SubjectDetails>(api(`/api/admin/courses/subjects/${subjectId}/details`), details);
  }

  uploadPlan(subjectId: number, file: File): Observable<MessageResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<MessageResponse>(api(`/api/admin/courses/subjects/${subjectId}/plan`), form);
  }

  deletePlan(subjectId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(api(`/api/admin/courses/subjects/${subjectId}/plan`));
  }

  // ---- направления
  getDirections(): Observable<AdminDirection[]> {
    return this.http.get<AdminDirection[]>(api('/api/admin/directions'));
  }

  saveDirection(direction: AdminDirection): Observable<AdminDirection> {
    return direction.id
      ? this.http.put<AdminDirection>(api(`/api/admin/directions/${direction.id}`), direction)
      : this.http.post<AdminDirection>(api('/api/admin/directions'), direction);
  }

  deleteDirection(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(api(`/api/admin/directions/${id}`));
  }

  // ---- новости
  getNews(): Observable<AdminNews[]> {
    return this.http.get<AdminNews[]>(api('/api/admin/news'));
  }

  saveNews(news: AdminNews): Observable<AdminNews> {
    return news.id
      ? this.http.put<AdminNews>(api(`/api/admin/news/${news.id}`), news)
      : this.http.post<AdminNews>(api('/api/admin/news'), news);
  }

  uploadNewsImage(id: number, image: File): Observable<AdminNews> {
    const form = new FormData();
    form.append('image', image);
    return this.http.post<AdminNews>(api(`/api/admin/news/${id}/image`), form);
  }

  deleteNews(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(api(`/api/admin/news/${id}`));
  }

  // ---- FAQ
  getFaq(): Observable<AdminFaq[]> {
    return this.http.get<AdminFaq[]>(api('/api/admin/faq'));
  }

  saveFaq(item: AdminFaq): Observable<AdminFaq> {
    return item.id
      ? this.http.put<AdminFaq>(api(`/api/admin/faq/${item.id}`), item)
      : this.http.post<AdminFaq>(api('/api/admin/faq'), item);
  }

  deleteFaq(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(api(`/api/admin/faq/${id}`));
  }

  // ---- заявки и настройки
  getApplications(type: ApplicationType): Observable<Application[]> {
    return this.http.get<Application[]>(api('/api/admin/applications'), { params: { type } });
  }

  decideApplication(id: number, status: ApplicationStatus, comment?: string): Observable<Application> {
    return this.http.put<Application>(api(`/api/admin/applications/${id}/decision`), { status, comment });
  }

  updateSettings(settings: SiteSettings): Observable<SiteSettings> {
    return this.http.put<SiteSettings>(api('/api/admin/settings'), settings);
  }

  getUserDocuments(userId: number): Observable<EducationDocument[]> {
    return this.http.get<EducationDocument[]>(api(`/api/admin/users/${userId}/documents`));
  }

  downloadUserDocument(id: number): Observable<Blob> {
    return this.http.get(api(`/api/admin/documents/${id}`), { responseType: 'blob' });
  }

  // ---- уроки
  getLessons(subjectId: number): Observable<AdminLesson[]> {
    return this.http.get<AdminLesson[]>(api(`/api/admin/courses/subjects/${subjectId}/lessons`));
  }

  createLesson(subjectId: number, data: {
    language: ContentLanguage;
    title: string;
    textMaterial: string;
    video?: File | null;
  }): Observable<{ id: number; message: string }> {
    const form = new FormData();
    form.append('language', data.language);
    form.append('title', data.title);
    form.append('textMaterial', data.textMaterial);
    if (data.video) {
      form.append('videoFile', data.video);
    }
    return this.http.post<{ id: number; message: string }>(
      api(`/api/admin/courses/subjects/${subjectId}/lessons-multi`), form);
  }

  saveLessonTranslation(lessonId: number, request: LessonTranslationRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api(`/api/admin/courses/lessons/${lessonId}/translation`), request);
  }

  // ---- тесты
  addQuizQuestion(subjectId: number, request: QuizQuestionRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api(`/api/admin/management/subjects/${subjectId}/quiz-questions`), request);
  }

  // ---- баннеры
  getAds(): Observable<Advertisement[]> {
    return this.http.get<Advertisement[]>(api('/api/admin/advertisements/all'));
  }

  createAd(data: { title?: string; linkUrl?: string; image?: File | null }): Observable<Advertisement> {
    const form = new FormData();
    if (data.title) form.append('title', data.title);
    if (data.linkUrl) form.append('linkUrl', data.linkUrl);
    if (data.image) form.append('image', data.image);
    return this.http.post<Advertisement>(api('/api/admin/advertisements/create'), form);
  }

  toggleAd(id: number, active: boolean): Observable<Advertisement[]> {
    return this.http.put<Advertisement[]>(api(`/api/admin/advertisements/${id}/toggle`), null, {
      params: { active },
    });
  }

  deleteAd(id: number): Observable<Advertisement[]> {
    return this.http.delete<Advertisement[]>(api(`/api/admin/advertisements/${id}`));
  }

  // ---- заявки с сайта
  getContactRequests(): Observable<ContactRequest[]> {
    return this.http.get<ContactRequest[]>(api('/api/admin/contact-requests'));
  }

  setContactProcessed(id: number, processed: boolean): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(api(`/api/admin/contact-requests/${id}/processed`), null, {
      params: { processed },
    });
  }

  // ---- пользователи (SUPERADMIN)
  getUsers(): Observable<PortalUser[]> {
    return this.http.get<PortalUser[]>(api('/api/admin/management/users'));
  }

  changeRole(userId: number, role: UserRole): Observable<PortalUser> {
    return this.http.put<PortalUser>(api(`/api/admin/management/users/${userId}/role`), null, {
      params: { role },
    });
  }

  downloadReport(subjectId: number): Observable<Blob> {
    return this.http.get(api(`/api/admin/management/reports/excel/${subjectId}`), { responseType: 'blob' });
  }

  // ---- конкурсы
  contests(): Observable<AdminContest[]> {
    return this.http.get<AdminContest[]>(api('/api/admin/contests'));
  }

  saveContest(id: number | null, request: ContestRequest): Observable<AdminContest> {
    return id
      ? this.http.put<AdminContest>(api(`/api/admin/contests/${id}`), request)
      : this.http.post<AdminContest>(api('/api/admin/contests'), request);
  }

  deleteContest(id: number): Observable<void> {
    return this.http.delete<void>(api(`/api/admin/contests/${id}`));
  }

  contestEntries(id: number): Observable<ContestEntryAdmin[]> {
    return this.http.get<ContestEntryAdmin[]>(api(`/api/admin/contests/${id}/entries`));
  }

  // ---- поддержка студентов
  searchStudents(query: string): Observable<StudentAdmin[]> {
    return this.http.get<StudentAdmin[]>(api('/api/admin/students'), { params: { q: query } });
  }

  updateStudent(userId: number, request: UpdateStudentRequest): Observable<StudentAdmin> {
    return this.http.put<StudentAdmin>(api(`/api/admin/students/${userId}`), request);
  }

  grantCourse(userId: number, subjectId: number): Observable<StudentAdmin> {
    return this.http.post<StudentAdmin>(api(`/api/admin/students/${userId}/courses/${subjectId}`), null);
  }

  revokeCourse(userId: number, subjectId: number): Observable<StudentAdmin> {
    return this.http.delete<StudentAdmin>(api(`/api/admin/students/${userId}/courses/${subjectId}`));
  }

  quizLocked(): Observable<QuizLocked[]> {
    return this.http.get<QuizLocked[]>(api('/api/admin/students/quiz-locked'));
  }

  /** Открыть тест ещё на 3 попытки. */
  unlockQuiz(userId: number, subjectId: number): Observable<StudentAdmin> {
    return this.http.post<StudentAdmin>(api(`/api/admin/students/${userId}/courses/${subjectId}/unlock-quiz`), null);
  }

  nameChanges(): Observable<NameChange[]> {
    return this.http.get<NameChange[]>(api('/api/admin/name-changes'));
  }

  decideNameChange(id: number, approved: boolean, comment?: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api(`/api/admin/name-changes/${id}/decision`), { approved, comment });
  }

  announce(text: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api('/api/admin/announcements'), { text });
  }

  downloadSurveyReport(): Observable<Blob> {
    return this.http.get(api('/api/admin/reports/survey'), { responseType: 'blob' });
  }

  // ---- Өрлеу (LMS)
  orleuOverview(): Observable<OrleuOverview> {
    return this.http.get<OrleuOverview>(api('/api/admin/orleu'));
  }

  orleuResend(certificateId: number): Observable<OrleuCertificate> {
    return this.http.post<OrleuCertificate>(api(`/api/admin/orleu/certificates/${certificateId}/resend`), null);
  }

  orleuPing(): Observable<string[]> {
    return this.http.get<string[]>(api('/api/admin/orleu/ping'));
  }

  orleuSyncPrograms(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api('/api/admin/orleu/programs/sync'), null);
  }

  orleuPrograms(): Observable<OrleuProgram[]> {
    return this.http.get<OrleuProgram[]>(api('/api/admin/orleu/programs'));
  }
}
