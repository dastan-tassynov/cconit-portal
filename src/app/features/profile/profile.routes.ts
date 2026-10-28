import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards';
import { ProfileShellComponent } from './profile-shell.component';

const ADMIN = roleGuard('ROLE_ADMIN', 'ROLE_SUPERADMIN');

/**
 * Личный кабинет (структура как у kcppk-bilimzet.kz): оболочка с боковым меню
 * и разделы — каждый отдельный lazy-маршрут, поэтому студент не скачивает код админки.
 */
export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    component: ProfileShellComponent,
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

      // ---- админ
      { path: 'constructor', canActivate: [ADMIN], loadComponent: () => import('./tabs/course-constructor.component').then(m => m.CourseConstructorComponent) },
      { path: 'catalog', canActivate: [ADMIN], loadComponent: () => import('./tabs/catalog-admin.component').then(m => m.CatalogAdminComponent) },
      { path: 'translations', canActivate: [ADMIN], loadComponent: () => import('./tabs/translations.component').then(m => m.TranslationsComponent) },
      { path: 'content', canActivate: [ADMIN], loadComponent: () => import('./tabs/content-admin.component').then(m => m.ContentAdminComponent) },
      { path: 'applications', canActivate: [ADMIN], loadComponent: () => import('./tabs/applications-admin.component').then(m => m.ApplicationsAdminComponent) },
      { path: 'requests', canActivate: [ADMIN], loadComponent: () => import('./tabs/contact-requests.component').then(m => m.ContactRequestsComponent) },
      { path: 'contests-admin', canActivate: [ADMIN], loadComponent: () => import('./tabs/contests-admin.component').then(m => m.ContestsAdminComponent) },
      { path: 'support', canActivate: [ADMIN], loadComponent: () => import('./tabs/support.component').then(m => m.SupportComponent) },
      { path: 'ads', canActivate: [ADMIN], loadComponent: () => import('./tabs/advertisements.component').then(m => m.AdvertisementsComponent) },
      {
        path: 'users',
        canActivate: [roleGuard('ROLE_SUPERADMIN')],
        loadComponent: () => import('./tabs/users.component').then(m => m.UsersComponent),
      },
    ],
  },
];
