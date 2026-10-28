import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards';
import { ProfileShellComponent } from '../profile/profile-shell.component';

/**
 * Кабинет администратора (/admin): те же оболочка и стиль, что у кабинета студента,
 * но в меню только разделы управления. Каждый раздел — отдельная lazy-страница.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: ProfileShellComponent,
    data: { area: 'admin' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'students' },
      // «Студенты и рассылка» разбиты на отдельные страницы
      ...(['students', 'quiz-locked', 'name-changes', 'orleu', 'reports', 'announcements'] as const).map(section => ({
        path: section,
        data: { section },
        loadComponent: () => import('../profile/tabs/support.component').then(m => m.SupportComponent),
      })),
      { path: 'support', pathMatch: 'full' as const, redirectTo: 'students' },
      { path: 'constructor', loadComponent: () => import('../profile/tabs/course-constructor.component').then(m => m.CourseConstructorComponent) },
      { path: 'catalog', loadComponent: () => import('../profile/tabs/catalog-admin.component').then(m => m.CatalogAdminComponent) },
      { path: 'translations', loadComponent: () => import('../profile/tabs/translations.component').then(m => m.TranslationsComponent) },
      { path: 'content', loadComponent: () => import('../profile/tabs/content-admin.component').then(m => m.ContentAdminComponent) },
      { path: 'applications', loadComponent: () => import('../profile/tabs/applications-admin.component').then(m => m.ApplicationsAdminComponent) },
      { path: 'contests-admin', loadComponent: () => import('../profile/tabs/contests-admin.component').then(m => m.ContestsAdminComponent) },
      { path: 'requests', loadComponent: () => import('../profile/tabs/contact-requests.component').then(m => m.ContactRequestsComponent) },
      { path: 'ads', loadComponent: () => import('../profile/tabs/advertisements.component').then(m => m.AdvertisementsComponent) },
      {
        path: 'users',
        canActivate: [roleGuard('ROLE_SUPERADMIN')],
        loadComponent: () => import('../profile/tabs/users.component').then(m => m.UsersComponent),
      },
    ],
  },
];
