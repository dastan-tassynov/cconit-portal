import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { FooterComponent } from '../footer/footer.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import {SimpleTranslateService} from '../../core/services/translation.service';
import {LanguageSwitcherComponent} from '../language-switcher/language-switcher.component';

export interface Lesson {
  id: number;
  title: string;
  stepOrder: number;
  textMaterial: string;
  videoUrl?: string; // Поле добавляется динамически
}

@Component({
  selector: 'app-course-view',
  standalone: true,
  imports: [CommonModule, FooterComponent,TranslatePipe,LanguageSwitcherComponent],
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
    private cdr: ChangeDetectorRef,
    public translate: SimpleTranslateService
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
    const token = localStorage.getItem('token');

    // Делаем один запрос, который возвращает и описание, и список уроков
    this.http.get<any>(`https://c49w5cwg79ul.share.zrok.io/api/student/courses/subjects/${this.courseId}/lessons`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          // 1. Сохраняем описание и название курса
          this.courseData = {
            title: data.subjectTitle,
            description: data.subjectDescription
          };

          // 2. Обрабатываем список уроков с явной типизацией
          this.lessons = Array.isArray(data.lessons)
            ? data.lessons.map((l: Lesson) => ({
              ...l,
              videoUrl: `https://c49w5cwg79ul.share.zrok.io/api/student/videos/stream/lesson/${l.id}?token=${token}`
            })).sort((a: Lesson, b: Lesson) => a.stepOrder - b.stepOrder)
            : [];

          // 3. Загружаем прогресс
          this.loadProgress();

          this.cdr.detectChanges();
        },
        error: (err: any) => console.error('Ошибка загрузки данных курса:', err)
      });
  }

// Вынесли загрузку прогресса в отдельный метод для чистоты кода
  loadProgress(): void {
    this.http.get<any>(`https://c49w5cwg79ul.share.zrok.io/api/student/progress/${this.courseId}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (progress) => {
          this.maxAvailableStep = progress?.currentStepOrder || 1;
          this.isCourseFinished = progress?.isCompleted || false;
          this.cdr.detectChanges();
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
