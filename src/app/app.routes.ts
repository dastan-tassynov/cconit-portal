import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { QuizComponent } from './features/quiz/quiz.component';
import { authGuard } from './core/guards/auth.guard';
import { RegisterComponent } from './features/register/register.component';
import { CourseViewComponent } from './features/course-view/course-view.component'; // Импортируем новый компонент
import { ProfileComponent } from './features/profile/profile.component'; // Импортируем новый компонент
import { VerifyCertificateComponent } from './features/verify-certificate/verify-certificate.component';
import {LandingPredComponent} from './features/landing/landingPred/landing.pred.component';
import {LandingPravaComponent} from './features/landing/landingPrava/landing.prava.component';
import {LandingBioComponent} from './features/landing/landingBio/landing.bio.component';

export const routes: Routes = [
  { path: '', redirectTo: 'landingPred', pathMatch: 'full' },

  // Открытый роут для авторизации
  { path: 'auth', component: AuthComponent },
  { path: 'register', component: RegisterComponent }, // <-- Добавили открытую регистрацию

  // Защищенные роуты (доступны только после логина)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'course/:id', component: CourseViewComponent, canActivate: [authGuard] },
  { path: 'quiz', component: QuizComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  {path: 'verify/certificate/:uuid', component: VerifyCertificateComponent},
  { path: 'landingPred', component: LandingPredComponent },
  { path: 'landingBio', component: LandingBioComponent },
  { path: 'landingPrava', component: LandingPravaComponent },

  // Любой другой левый адрес кидает на страницу входа
  { path: '**', redirectTo: 'auth' }
];
