import { Routes } from '@angular/router';

export interface ProgramDocument {
  /** ID файла в /api/public/documents/{id} */
  id: string;
  /** Язык документа: показываем сначала документы на языке интерфейса */
  lang: 'ru' | 'kk';
  name: string;
}

export interface Program {
  id: string;
  /** Старый адрес страницы — сохранён, чтобы не сломать ссылки */
  path: string;
  icon: string;
  /** Ключи перевода: PROGRAM_<ID>_TITLE / _DESC */
  titleKey: string;
  descriptionKey: string;
  documents: ProgramDocument[];
}

/**
 * Образовательные программы. Раньше это были 8 одинаковых компонентов (по 300+ строк каждый),
 * отличавшихся только списком PDF. Теперь — данные + один компонент ProgramComponent.
 * Добавить программу = добавить запись сюда и два ключа в public/i18n/*.json.
 */
export const PROGRAMS: Program[] = [
  {
    id: 'pred',
    path: 'landingPred',
    icon: '🧸',
    titleKey: 'PROGRAM_PRED_TITLE',
    descriptionKey: 'PROGRAM_PRED_DESC',
    documents: [
      { id: 'mektep_aldy_kaz', lang: 'kk', name: 'Қоғамдық талқылауға арналған білім беру бағдарламалардың жобасы (Мектепалды даярлық)' },
      { id: 'pred_shkola', lang: 'ru', name: 'Проект образовательных программ для публичного обсуждения (для педагогов предшкольных классов)' },
    ],
  },
  {
    id: 'prava',
    path: 'landingPrava',
    icon: '⚖️',
    titleKey: 'PROGRAM_PRAVA_TITLE',
    descriptionKey: 'PROGRAM_PRAVA_DESC',
    documents: [
      { id: 'osnovy_prava', lang: 'ru', name: 'Проект образовательных программ для публичного обсуждения («Основы права»)' },
      { id: 'quqyqtyq_negiz', lang: 'kk', name: 'Қоғамдық талқылауға арналған білім беру бағдарламалардың жобасы (Құқық негіздері)' },
    ],
  },
  {
    id: 'bio',
    path: 'landingBio',
    icon: '🧬',
    titleKey: 'PROGRAM_BIO_TITLE',
    descriptionKey: 'PROGRAM_BIO_DESC',
    documents: [
      { id: 'bio_kz', lang: 'kk', name: '«Биология пәнін оқытудың заманауи әдістері: жасанды интеллект технологияларын пайдалану» атты педагогтардың біліктілігін арттыру курстарының БІЛІМ БЕРУ БАҒДАРЛАМАСЫ' },
      { id: 'bio_ru', lang: 'ru', name: 'ОБРАЗОВАТЕЛЬНАЯ ПРОГРАММА курсов повышения квалификации для педагогов «Современные методы обучения биологии: использование технологий искусственного интеллекта»' },
    ],
  },
  {
    id: 'bulling',
    path: 'landingBul',
    icon: '🤝',
    titleKey: 'PROGRAM_BULLING_TITLE',
    descriptionKey: 'PROGRAM_BULLING_DESC',
    documents: [
      { id: 'bulling_ru', lang: 'ru', name: 'Развитие профессиональных компетенций педагогов по профилактике буллинга и созданию безопасной образовательной среды' },
      { id: 'bulling_kaz', lang: 'kk', name: 'Педагогтердің буллингтің алдын алу және қауіпсіз білім беру ортасын қалыптастыру бойынша кәсіби құзыреттіліктерін дамыту' },
    ],
  },
  {
    id: 'geo',
    path: 'landingGeo',
    icon: '🗺️',
    titleKey: 'PROGRAM_GEO_TITLE',
    descriptionKey: 'PROGRAM_GEO_DESC',
    documents: [
      { id: 'geo_rus', lang: 'ru', name: '«Развитие профессиональных компетенций педагогов по преподаванию обязательного учебного курса «География Казахстана» в 8–9 классах»' },
      { id: 'geo_kaz', lang: 'kk', name: '«8–9-сыныптарда «Қазақстан географиясы» міндетті оқу курсын оқыту бойынша педагогтердің кәсіби құзыреттерін дамыту»' },
    ],
  },
  {
    id: 'const',
    path: 'landingConst',
    icon: '📜',
    titleKey: 'PROGRAM_CONST_TITLE',
    descriptionKey: 'PROGRAM_CONST_DESC',
    documents: [
      { id: 'konsti_ru', lang: 'ru', name: '««Развитие профессиональных компетенций педагогов по преподаванию курса «Основы Конституции» в 5–7 классах»' },
      { id: 'konsti_kaz', lang: 'kk', name: '«5–7-сыныптарда «Конституция негіздері» курсын оқыту бойынша педагогтердің кәсіби құзыреттерін дамыту»' },
    ],
  },
  {
    id: 'zakon',
    path: 'landingZakon',
    icon: '🛡️',
    titleKey: 'PROGRAM_ZAKON_TITLE',
    descriptionKey: 'PROGRAM_ZAKON_DESC',
    documents: [
      { id: 'zakon_ru', lang: 'ru', name: '«Развитие профессиональных компетенций педагогов по преподаванию обязательного учебного курса «Закон и порядок» в 8–11 классах»' },
      { id: 'zakon_kaz', lang: 'kk', name: '«8–11-сыныптарда «Заң және тәртіп» міндетті оқу курсын оқыту бойынша педагогтердің кәсіби құзыреттерін дамыту»' },
    ],
  },
  {
    id: 'security',
    path: 'landingSecurity',
    icon: '🦺',
    titleKey: 'PROGRAM_SECURITY_TITLE',
    descriptionKey: 'PROGRAM_SECURITY_DESC',
    documents: [
      { id: 'security_ru', lang: 'ru', name: '«Развитие профессиональных компетенций педагогов по преподаванию обязательного учебного курса «Личная безопасность» в 5–11 классах»' },
      { id: 'security_kaz', lang: 'kk', name: '«5–11-сыныптарда «Жеке қауіпсіздік» міндетті оқу курсын оқыту бойынша педагогтердің кәсіби құзыреттерін дамыту»' },
    ],
  },
];

export function findProgram(id: string): Program | undefined {
  return PROGRAMS.find(p => p.id === id);
}

export const PROGRAM_ROUTES: Routes = [
  {
    path: 'programs/:programId',
    loadComponent: () => import('./program.component').then(m => m.ProgramComponent),
  },
  // Старые адреса /landingBio и т.д. ведут на новые страницы
  ...PROGRAMS.map(p => ({ path: p.path, redirectTo: `programs/${p.id}`, pathMatch: 'full' as const })),
];
