import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CourseService, Course } from '../../core/services/course.service';
import { FooterComponent } from '../footer/footer.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import {SimpleTranslateService} from '../../core/services/translation.service';
import {LanguageSwitcherComponent} from '../language-switcher/language-switcher.component';

interface PromoSlide {
  title: string;
  description: string;
  badge: string;
  bgColor: string;
  imageUrl?: string; // Добавьте это поле
  textColor?: string;
}

export interface DashboardCourse {
  id: number;
  title: string;
  description: string;
  hasAccess: boolean;
  isCompleted: boolean;
  attemptsCount: number;
  lastScore: number | null;
}

export interface DashboardGroup {
  programCode: string;
  groupTitle: string;
  courses: DashboardCourse[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FooterComponent,TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  allCourses: Course[] = [];
  filteredCourses: Course[] = [];
  groupedCourses: DashboardGroup[] = [];
  filteredGroups: DashboardGroup[] = [];
  currentSlideIndex: number = 0;
  slideInterval: any;

  activeTab: 'all' | 'my' = 'all';


  promoSlides: PromoSlide[] = [
    {
      title: 'Скидка до 60%\nна все IT-направления',
      description: 'Учитесь в своем темпе. Получайте актуальные знания от экспертов индустрии.',
      badge: '⚡ ЛЕТО',
      bgColor: '#fef08a'
    },
    {
      title: 'Новый курс по ГИС\nи зондированию Земли!',
      description: 'Изучите расчет вегетационных индексов NDVI и экологический мониторинг сельскохозяйственных земель.',
      badge: '🌍 ГИС',
      bgColor: '#bbf7d0'
    },
    {
      title: 'Интеграция Forte Bank\nи Halyk Epay',
      description: 'Узнайте, как проектировать callback-контроллеры и обрабатывать банковские реестры на Spring Boot.',
      badge: '💳 API',
      bgColor: '#bfdbfe'
    }
  ];

  constructor(
    private authService: AuthService,
    private courseService: CourseService, // Внедряем наш сервис
    private router: Router,
    private cdr: ChangeDetectorRef,
    public translate: SimpleTranslateService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/auth']);
      return;
    }

    // Вызываем методы сразу, а не ждем клика
    this.loadCoursesByTab('all');
    this.loadLivePromoSlides();
    this.startPromoSlider();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  startPromoSlider(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.promoSlides.length;
  }

  prevSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.promoSlides.length) % this.promoSlides.length;
  }

  setSlide(index: number): void {
    this.currentSlideIndex = index;
  }

  loadMockCourses(): void {
    this.filteredCourses = [...this.allCourses];
  }

  loadLivePromoSlides(): void {
    // Убрал лишний setTimeout, который замедлял загрузку
    this.courseService.getActiveAds().subscribe({
      next: (serverSlides) => {
        if (serverSlides && serverSlides.length > 0) {
          this.promoSlides = serverSlides;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.warn('Баннеры не загружены', err)
    });
  }

  currentTab: 'all' | 'my' = 'all';
  // Удалите метод switchTab, используйте только loadCoursesByTab
  loadCoursesByTab(tab: 'all' | 'my'): void {
    this.currentTab = tab;
    this.activeTab = tab;

    const purchasedOnly = tab === 'my';

    const lang = this.translate.getCurrentLang();

    this.courseService.getDashboardGroups(purchasedOnly, lang)
      .subscribe({
        next: (data) => {
          this.groupedCourses = data;
          this.filteredGroups = [...data];
          this.cdr.detectChanges();
        }
      });
  }
  // ЗАПРОС К БЭКЕНДУ: получаем реальный список курсов
  loadRealCourses(): void {
    console.log("=== ДЭШБОРД: Попытка загрузки курсов ===");
    console.log("Токен в localStorage прямо СЕЙЧАС:", localStorage.getItem('token'));

    // Если токен ещё не успел сесть в память, подождем 100 миллисекунд
    setTimeout(() => {
      console.log("=== ДЭШБОРД: Запрос отправляется после паузы ===");
      console.log("Токен перед отправкой запроса:", localStorage.getItem('token'));

      this.courseService.getCourses().subscribe({
        next: (data) => {
          this.allCourses = data;
          this.filteredCourses = [...this.allCourses];
        },
        error: (err) => {
          console.error('Ошибка при загрузке курсов с бэкенда', err);
        }
      });
    }, 100); // 100 мс хватит браузеру с головой
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCourses = [...this.allCourses];
    } else {
      this.filteredCourses = this.allCourses.filter(course =>
        course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  viewCourse(courseId: number): void {
    this.router.navigate(['/course', courseId]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
