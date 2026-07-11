import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { FooterComponent } from '../footer/footer.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import {SimpleTranslateService} from '../../core/services/translation.service';
import {LanguageSwitcherComponent} from '../language-switcher/language-switcher.component';

interface PortalUser { id: number; username: string; fullName: string; roles: string[]; }
interface SubjectDTO { id: number; title: string; description: string; attemptsCount: number; lastScore: number | null; hasAccess: boolean; createdBy?: string; }

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule,FooterComponent, TranslatePipe,LanguageSwitcherComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // Добавьте этот метод в класс ProfileComponent
  changeLanguage(lang: string): void {
    this.translate.use(lang);
    // Принудительно обновляем интерфейс, чтобы тексты сменились
    this.cdr.detectChanges();
  }
  // Массив для вопросов теста
  quizFormFields = [
    { label: 'LABEL_QUIZ_QUESTION', placeholder: 'PH_QUIZ_QUESTION', model: 'quizQuestionText' }
  ];
  activeTab: string = 'courses';
  userRole: string = 'ROLE_USER';

  toast = { show: false, message: '', type: 'success' as 'success' | 'error' };
  private toastTimeout: any;

  coursesFromBack: SubjectDTO[] = [];
  usersList: PortalUser[] = [];
  adsList: any[] = [];
  courseTextMaterial: string = '';

  courseTitle: string = '';
  courseDescription: string = '';
  selectedSubjectIdForLesson: number | null = null;
  lessonTitle: string = '';
  lessonTextMaterial: string = '';
  selectedSubjectIdForQuiz: number | null = null;
  quizQuestionText: string = '';
  courseCode: string = '';
  language:number| null = null;
  quizAnswers: any[] = [
    { answerText: '', isCorrect: true }, { answerText: '', isCorrect: false },
    { answerText: '', isCorrect: false }, { answerText: '', isCorrect: false }
  ];
  selectedLessonId: number | null = null;
  selectedVideoFile: File | null = null;

  adTitle: string = '';
  adDescription: string = '';
  adLinkUrl: string = '';
  selectedAdImage: File | null = null;

  constructor(private authService: AuthService,
              private router: Router,
              private http: HttpClient,
              private cdr: ChangeDetectorRef,
              public translate: SimpleTranslateService) {}

  get currentUserRole(): string { return this.authService.getUserRole() || 'ROLE_USER'; }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/auth']);
      return;
    }


    // Принудительная загрузка данных при входе
    this.loadStudentCourses();

    // Добавляем проверку ролей перед загрузкой административных данных
    if (this.hasRole(['ROLE_SUPERADMIN'])) {
      this.loadAllUsers();
    }
    if (this.hasRole(['ROLE_ADMIN', 'ROLE_SUPERADMIN'])) {
      this.loadAdvertisements();
    }
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast = { show: true, message, type };
    this.cdr.detectChanges();
    this.toastTimeout = setTimeout(() => { this.toast.show = false; this.cdr.detectChanges(); }, 4000);
  }

  hasRole(roles: string[]): boolean { return roles.includes(this.currentUserRole); }
  private getAuthHeaders(): HttpHeaders { return new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem('token') }); }

  selectTab(tabName: string): void {
    this.activeTab = tabName;
    if (tabName === 'courses') this.loadStudentCourses();
    else if (tabName === 'roles' && this.hasRole(['ROLE_SUPERADMIN'])) this.loadAllUsers();
    else if (tabName === 'ads' && this.hasRole(['ROLE_ADMIN', 'ROLE_SUPERADMIN'])) this.loadAdvertisements();
  }

  loadStudentCourses(): void {
    this.http.get<SubjectDTO[]>('https://c49w5cwg79ul.share.zrok.io/api/student/courses/subjects', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          this.coursesFromBack = data;
          this.cdr.detectChanges(); // ВАЖНО: детекция должна быть ЗДЕСЬ, внутри next
        }
      });
  }

  downloadCertificate(subjectId: number, courseTitle: string): void {
    this.http.get(`https://c49w5cwg79ul.share.zrok.io/api/student/certificates/download/${subjectId}`, { headers: this.getAuthHeaders(), responseType: 'blob' })
      .subscribe({
        next: (res: Blob) => {
          const url = window.URL.createObjectURL(res);
          const a = document.createElement('a'); a.href = url; a.download = `Сертификат_${courseTitle}.pdf`; a.click();
          this.showToast('Файл загружен!');
          this.cdr.detectChanges();
        },
        error: () => this.showToast('Ошибка загрузки', 'error')
      });
  }

  onVideoFileSelected(event: any): void { if (event.target.files.length > 0) this.selectedVideoFile = event.target.files[0]; }

  onCreateNewSubject(): void {
    this.http.post('https://c49w5cwg79ul.share.zrok.io/api/admin/courses/subjects',
      { programCode: this.courseCode,
        language: this.language === 1 ? 'RU' : 'KZ',
        title: this.courseTitle,
        description: this.courseDescription,
        hours: 0 },
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        // 1. Показываем уведомление
        this.showToast('Курс успешно создан!');

        // 2. ОЧИЩАЕМ поля, привязанные к [(ngModel)]
        this.courseCode = '';
        this.courseTitle = '';
        this.language = null;
        this.courseDescription = '';

        // 3. Обновляем список, чтобы новый курс сразу появился в таблице
        this.loadStudentCourses();

        // 4. Принудительно обновляем UI
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast('Ошибка при создании курса', 'error');
      }
    });
  }

  onAddLessonToSubject(): void {
    const formData = new FormData();
    formData.append('title', this.lessonTitle);
    formData.append('textMaterial', this.lessonTextMaterial);
    if (this.selectedVideoFile) formData.append('videoFile', this.selectedVideoFile);

    this.http.post(`https://c49w5cwg79ul.share.zrok.io/api/admin/courses/subjects/${this.selectedSubjectIdForLesson}/lessons-multi`, formData, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.showToast('Урок успешно добавлен!'); // Уведомление
          // Очистка полей
          this.lessonTitle = '';
          this.lessonTextMaterial = '';
          this.selectedVideoFile = null;
          this.cdr.detectChanges(); // Обновление UI
        },
        error: () => this.showToast('Ошибка при добавлении урока', 'error')
      });
  }

  setQuizCorrectAnswer(index: number): void { this.quizAnswers.forEach((ans, i) => ans.isCorrect = (i === index)); }

  onSaveQuizQuestion(): void {
    const payload = { questionText: this.quizQuestionText, answers: this.quizAnswers };

    this.http.post(`https://c49w5cwg79ul.share.zrok.io/api/admin/management/subjects/${this.selectedSubjectIdForQuiz}/quiz-questions`, payload, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.showToast('Вопрос успешно добавлен!'); // Уведомление
          // Очистка полей
          this.quizQuestionText = '';
          // Сброс ответов к начальному состоянию
          this.quizAnswers = [
            { answerText: '', isCorrect: true }, { answerText: '', isCorrect: false },
            { answerText: '', isCorrect: false }, { answerText: '', isCorrect: false }
          ];
          this.cdr.detectChanges(); // Обновление UI
        },
        error: () => this.showToast('Ошибка при сохранении вопроса', 'error')
      });
  }

  loadAdvertisements(): void {
    this.http.get<any[]>('https://c49w5cwg79ul.share.zrok.io/api/admin/advertisements/all', { headers: this.getAuthHeaders() })
      .subscribe({ next: (data) => { this.adsList = data; this.cdr.detectChanges(); this.cdr.detectChanges();} });
  }

  onAdImageSelected(event: any): void { if (event.target.files.length > 0) this.selectedAdImage = event.target.files[0]; }

  onCreateAdvertisement(): void {
    const formData = new FormData();
    if (this.adTitle) formData.append('title', this.adTitle);
    if (this.adLinkUrl) formData.append('linkUrl', this.adLinkUrl);
    if (this.selectedAdImage) formData.append('image', this.selectedAdImage);
    this.http.post('https://c49w5cwg79ul.share.zrok.io/api/admin/advertisements/create', formData, { headers: this.getAuthHeaders() })
      .subscribe({ next: () => { this.showToast('Баннер создан!'); this.loadAdvertisements(); } });
  }

  isDeleteModalOpen: boolean = false;
  adToDelete: any = null;

  confirmDelete(ad: any): void {
    this.adToDelete = ad;
    this.isDeleteModalOpen = true;
  }

  // Метод удаления
  onDeleteAd(): void {
    if (!this.adToDelete) return;

    this.http.delete(`https://c49w5cwg79ul.share.zrok.io/api/admin/advertisements/${this.adToDelete.id}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        // Убираем из массива, чтобы обновилось сразу
        this.adsList = this.adsList.filter(a => a.id !== this.adToDelete.id);
        this.isDeleteModalOpen = false; // Закрываем модалку
        this.showToast('Баннер успешно удален');
      },
      error: () => this.showToast('Ошибка удаления', 'error')
    });
  }

  // Исправленный метод переключения статуса
  onToggleAd(ad: any): void {
    const newStatus = !ad.active;
    this.http.put(`https://c49w5cwg79ul.share.zrok.io/api/admin/advertisements/${ad.id}/toggle`, null, {
      headers: this.getAuthHeaders(),
      params: { active: newStatus.toString() }
    }).subscribe({
      next: (response: any) => {
        // Если пришел новый массив - обновляем всё, если нет - меняем статус одного элемента
        if (Array.isArray(response)) {
          this.adsList = response;
        } else {
          ad.active = newStatus;
        }
        this.showToast('Статус обновлен');
        this.cdr.detectChanges();
      },
      error: () => this.showToast('Ошибка сервера', 'error')
    });
  }

  loadAllUsers(): void {
    this.http.get<PortalUser[]>('https://c49w5cwg79ul.share.zrok.io/api/admin/management/users', {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (d) => {
        this.usersList = d;
        // ВАЖНО: вызываем детекцию изменений здесь, когда данные точно пришли
        this.cdr.detectChanges();
      }
    });
  }
  toggleUserAdminRights(user: PortalUser): void {
    const newRole = user.roles.includes('ROLE_ADMIN') ? 'ROLE_USER' : 'ROLE_ADMIN';

    this.http.put(`https://c49w5cwg79ul.share.zrok.io/api/admin/management/users/${user.id}/role`, null, {
      headers: this.getAuthHeaders(),
      params: { role: newRole }
    })
      .subscribe({
        next: () => {
          // 1. Обновляем роль локально для мгновенного отклика UI
          user.roles = [newRole];

          // 2. Вызываем обновление интерфейса ТОЛЬКО после успеха
          this.cdr.detectChanges();

          // 3. Можно вызвать loadAllUsers(), если нужно обновить весь список с сервера
          this.loadAllUsers();
        },
        error: (err) => {
          console.error("Ошибка обновления роли", err);
          this.showToast("Не удалось изменить роль", "error");
        }
      });
  }

  goBack(): void { this.router.navigate(['/dashboard']); }
  logout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
}
