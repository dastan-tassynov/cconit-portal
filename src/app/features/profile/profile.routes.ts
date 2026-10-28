import { Routes } from '@angular/router';
import { ProfileShellComponent } from './profile-shell.component';

/**
 * Кабинет студента (структура как у kcppk-bilimzet.kz): оболочка с боковым меню
 * и разделы — каждый отдельный lazy-маршрут. Админ-разделы — в отдельном кабинете /admin.
 */
export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    component: ProfileShellComponent,
    data: { area: 'student' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },

      // ---- студент
      { path: 'home', loadComponent: () => import('./tabs/cabinet-home.component').then(m => m.CabinetHomeComponent) },
      { path: 'account', loadComponent: () => import('./tabs/account.component').then(m => m.AccountComponent) },
      { path: 'courses', loadComponent: () => import('./tabs/my-courses.component').then(m => m.MyCoursesComponent) },
      { path: 'certificates', loadComponent: () => import('./tabs/certificates.component').then(m => m.CertificatesComponent) },
      { path: 'survey', loadComponent: () => import('./tabs/survey.component').then(m => m.SurveyComponent) },
      { path: 'contests', loadComponent: () => import('./tabs/my-contests.component').then(m => m.MyContestsComponent) },
      { path: 'notifications', loadComponent: () => import('./tabs/notifications.component').then(m => m.NotificationsComponent) },
      {
        path: 'workgroups',
        data: { type: 'WORKGROUP' },
        loadComponent: () => import('./tabs/applications.component').then(m => m.ApplicationsComponent),
      },
      {
        path: 'lecturer',
        data: { type: 'LECTURER' },
        loadComponent: () => import('./tabs/applications.component').then(m => m.ApplicationsComponent),
      },

      // ---- старые адреса админ-разделов → кабинет администратора
      ...['constructor', 'catalog', 'translations', 'content', 'applications', 'support', 'contests-admin', 'requests', 'ads', 'users']
        .map(path => ({ path, redirectTo: `/admin/${path}` })),
    ],
  },
];
