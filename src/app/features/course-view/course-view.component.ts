import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-course-view',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './course-view.component.html',
  styleUrls: ['./course-view.component.css']
})
export class CourseViewComponent implements OnInit {
  courseId!: string;
  courseData: any = null;
  lessons: any[] = [];
  viewMode: 'syllabus' | 'lesson' = 'syllabus';
  currentLesson: any = null;
  currentStepOrder: number = 1;
  maxAvailableStep: number = 1;
  isCourseFinished: boolean = false;

  // Переменная управления кастомным модальным окном
  isCompletionModalOpen: boolean = false;
  showBlockedModal: boolean = false;

  watermarkTop: string = '10%';
  watermarkLeft: string = '15%';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    this.generateWatermarkCoordinates();
    this.loadCourseAndProgress();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadCourseAndProgress(): void {
    // 1. Добавляем запрос для получения данных курса (название, описание)
    this.http.get<any>(`https://c49w5cwg79ul.share.zrok.io/api/admin/courses/subjects/${this.courseId}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          this.courseData = data; // Теперь тут будет название и описание
          this.cdr.detectChanges();
        }
      });

    // 2. Ваш текущий запрос лекций
    this.courseService.getCourseContent(this.courseId).subscribe({
      next: (lessonsData: any) => {
        const token = localStorage.getItem('token');
        this.lessons = Array.isArray(lessonsData)
          ? lessonsData.map(l => ({
            ...l,
            videoUrl: `https://c49w5cwg79ul.share.zrok.io/api/student/videos/stream/lesson/${l.id}?token=${token}`
          })).sort((a, b) => a.stepOrder - b.stepOrder)
          : [];

        // 3. Ваш текущий запрос прогресса
        this.http.get<any>(`https://c49w5cwg79ul.share.zrok.io/api/student/progress/${this.courseId}`, { headers: this.getAuthHeaders() })
          .subscribe({
            next: (progress) => {
              this.maxAvailableStep = progress?.currentStepOrder || 1;
              this.isCourseFinished = progress?.isCompleted || false;
              this.cdr.detectChanges();
            }
          });
      }
    });
  }

  openLesson(lesson: any): void {
    if (lesson.stepOrder > this.maxAvailableStep) {
      alert('Этот модуль заблокирован. Сначала пройдите предыдущие шаги!');
      return;
    }
    this.currentLesson = lesson;
    this.currentStepOrder = lesson.stepOrder;
    this.generateWatermarkCoordinates();
    this.viewMode = 'lesson';
    this.cdr.detectChanges();
  }

  showSyllabus(): void {
    this.viewMode = 'syllabus';
    this.currentLesson = null;
    this.cdr.detectChanges();
  }

  nextStep(): void {
    if (this.isCourseFinished) {
      this.showBlockedModal = true;
      this.cdr.detectChanges();
      return;
    }

    const nextStepNum = this.currentStepOrder + 1;
    const hasNextLesson = this.lessons.some(l => l.stepOrder === nextStepNum);

    if (hasNextLesson) {
      this.http.post(`https://c49w5cwg79ul.share.zrok.io/api/student/progress/${this.courseId}/step/${nextStepNum}`, null, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            this.maxAvailableStep = Math.max(this.maxAvailableStep, nextStepNum);
            const nextLesson = this.lessons.find(l => l.stepOrder === nextStepNum);
            this.openLesson(nextLesson);
          },
          error: () => alert('Не удалось сохранить прогресс на сервере.')
        });
    } else {
      // Вместо системного alert() открываем наше красивое модальное окно выбора
      this.isCompletionModalOpen = true;
      this.cdr.detectChanges();
    }
  }

  closeBlockedModal(): void {
    this.showBlockedModal = false;
    this.cdr.detectChanges();
  }

  generateWatermarkCoordinates(): void {
    this.watermarkTop = Math.floor(Math.random() * 60 + 10) + '%';
    this.watermarkLeft = Math.floor(Math.random() * 60 + 10) + '%';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToDashboard(): void {
    this.isCompletionModalOpen = false;
    this.router.navigate(['/dashboard']);
  }

  goToQuiz(): void {
    this.isCompletionModalOpen = false;
    // Используем правильный роут и query-параметры, как в вашей изначальной логике
    this.router.navigate(['/quiz'], { queryParams: { courseId: this.courseId } });
  }

  onVideoError(event: any): void {
    console.error('Ошибка видеоплеера:', event);
    alert('Не удалось загрузить видео. Проверьте соединение или права доступа.');
  }
}
