import { Routes } from '@angular/router';
import { authGuard, guestGuard, surveyGuard } from './core/auth/guards';
import { PROGRAM_ROUTES } from './features/public/program/programs';

export const routes: Routes = [
  // ---------- публичный сайт
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent),
  },
  ...PROGRAM_ROUTES,
  {
    path: 'courses',
    loadComponent: () => import('./features/public/catalog/catalog.component').then(m => m.CatalogComponent),
  },
  {
    path: 'courses/:id',
    loadComponent: () => import('./features/public/course/course-detail.component').then(m => m.CourseDetailComponent),
  },
  {
    path: 'news',
    loadComponent: () => import('./features/public/news/news-list.component').then(m => m.NewsListComponent),
  },
  {
    path: 'news/:id',
    loadComponent: () => import('./features/public/news/news-detail.component').then(m => m.NewsDetailComponent),
  },
  {
    path: 'contests',
    loadComponent: () => import('./features/public/contests/contests.component').then(m => m.ContestsComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/public/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'payment/result',
    canActivate: [authGuard],
    loadComponent: () => import('./features/payment-result/payment-result.component').then(m => m.PaymentResultComponent),
  },
  {
    path: 'faq',
    loadComponent: () => import('./features/public/faq/faq.component').then(m => m.FaqComponent),
  },
  {
    path: 'verify/certificate/:uuid',
    loadComponent: () =>
      import('./features/verify-certificate/verify-certificate.component').then(m => m.VerifyCertificateComponent),
  },

  // ---------- вход
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent),
  },

  // ---------- кабинет студента
  // Старый дашборд: его заменили кабинет (/profile) и каталог (/courses)
  { path: 'dashboard', pathMatch: 'full', redirectTo: 'profile' },
  {
    path: 'course/:id',
    canActivate: [authGuard, surveyGuard],
    loadComponent: () => import('./features/course-view/course-view.component').then(m => m.CourseViewComponent),
  },
  {
    path: 'quiz/:courseId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/quiz/quiz.component').then(m => m.QuizComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
  },

  { path: '**', redirectTo: '' },
];
