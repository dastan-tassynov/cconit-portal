import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import {SimpleTranslateService} from '../../core/services/translation.service';
import {LanguageSwitcherComponent} from '../language-switcher/language-switcher.component';
import { Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule,TranslatePipe,LanguageSwitcherComponent],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css'
})
export class QuizComponent implements OnInit, OnDestroy  {
  questions: any[] = [];
  currentQuestionIndex: number = 0;
  selectedOptionId: number | null = null;
  studentAnswers: { [key: number]: number } = {};
  quizCompleted: boolean = false;
  courseId!: number;
  language: string = 'ru';
  private langSubscription!: Subscription;
  quizResult: any = null;

  private baseUrl = 'https://c49w5cwg79ul.share.zrok.io/api/student/quiz';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public translate: SimpleTranslateService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  ngOnInit(): void {
    this.langSubscription =
      this.translate.languageChanged.subscribe(lang => {
        this.language = lang;
        if(this.courseId){
          this.loadQuizQuestions();
        }
      });
    this.route.queryParams.subscribe(params => {
      this.courseId = params['courseId']
        ? Number(params['courseId'])
        : 1;

      this.language = params['lang']
        ? params['lang']
        : this.translate.getCurrentLang();

      this.checkCourseStatusAndLoad();

    });
  }

  checkCourseStatusAndLoad(): void {
    this.http.get<any>(`https://c49w5cwg79ul.share.zrok.io/api/student/progress/${this.courseId}`, { headers: this.getAuthHeaders() }).subscribe({
      next: (progress) => {
        if (progress && progress.isCompleted) {
          alert('Вы уже успешно сдали этот тест и завершили данный курс! Повторное прохождение заблокировано.');
          this.router.navigate(['/profile']);
        } else {
          this.loadQuizQuestions();
        }
      },
      error: () => {
        this.loadQuizQuestions();
      }
    });
  }

  loadQuizQuestions(): void {
    this.http.get<any[]>(
      `${this.baseUrl}/generate/${this.courseId}?language=${this.language}`,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (data) => {
        this.questions = data;
        this.restartQuiz();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки контрольного теста', err);
      }
    });
  }

  get currentQuestion(): any {
    return this.questions && this.questions.length > 0 ? this.questions[this.currentQuestionIndex] : null;
  }

  selectOption(optionId: number): void {
    this.selectedOptionId = optionId;
  }

  nextQuestion(): void {
    if (this.selectedOptionId === null || !this.currentQuestion) return;

    this.studentAnswers[this.currentQuestion.id] = this.selectedOptionId;

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedOptionId = this.studentAnswers[this.questions[this.currentQuestionIndex].id] || null;
    } else {
      this.submitQuizToBackend();
    }
  }

  submitQuizToBackend(): void {
    this.quizResult = { completed: false, lastScore: 0, attemptsCount: '...' };

    this.http.post<any>(`${this.baseUrl}/submit/${this.courseId}`, this.studentAnswers, { headers: this.getAuthHeaders() }).subscribe({
      next: (progressResult) => {
        this.quizResult = progressResult;
        this.quizCompleted = true;

        if (this.quizResult?.completed) {
          this.triggerCertificateGeneration();
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при отправке теста на проверку', err);
        this.quizResult = null;
        alert('Не удалось отправить тест. Пожалуйста, попробуйте еще раз.');
        this.cdr.detectChanges();
      }
    });
  }

  triggerCertificateGeneration(): void {
    this.http.get(`https://c49w5cwg79ul.share.zrok.io/api/student/certificates/download/${this.courseId}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).subscribe({
      next: () => {
        console.log('Запрос на генерацию успешно отправлен. Сертификат и интеграция с Орлеу обработаны.');
      },
      error: (err) => {
        console.error('Ошибка при автоматическом триггере генерации сертификата:', err);
      }
    });
  }

  restartQuiz(): void {
    if (this.quizResult?.completed) {
      alert('Вы уже успешно сдали этот тест! Повторное прохождение заблокировано.');
      return;
    }
    this.currentQuestionIndex = 0;
    this.selectedOptionId = null;
    this.studentAnswers = {};
    this.quizCompleted = false;
    this.quizResult = null;
    this.cdr.detectChanges();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {

    if(this.langSubscription){
      this.langSubscription.unsubscribe();
    }

  }
}
