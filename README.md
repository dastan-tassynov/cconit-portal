# ЦОНИТ — фронтенд (Angular 21)

## Запуск

```bash
npm ci
npm start          # http://localhost:4200, бэкенд: http://localhost:8081 (environment.development.ts)
npm run build      # прод-сборка, бэкенд из src/environments/environment.ts
npm test           # юнит-тесты (vitest)
```

Адрес бэкенда меняется **только** в `src/environments/environment*.ts`.

## Структура

```
src/app/
  core/
    api/         типизированные сервисы API и модели (models.ts — контракт с бэкендом)
    auth/        SessionService (signals), guards
    http/        apiInterceptor: токен + Accept-Language + обработка 401
    i18n/        LanguageService поверх ngx-translate
    ui/          уведомления (вместо alert), «защита» контента
  shared/        шапка сайта, футер, переключатель языка, окно оплаты курса
  features/
    public/      главная страница и страницы образовательных программ
    auth, register, dashboard, course-view, quiz, verify-certificate
    profile/     кабинет: оболочка + вкладки (каждая — отдельный lazy-маршрут)
public/i18n/     словари ru.json / kk.json
```

## Локализация (ru / kk)

- Тексты интерфейса — `public/i18n/ru.json` и `kk.json` (ключи одинаковые в обоих файлах).
- В шаблонах: `{{ 'KEY' | translate }}`, с параметрами: `{{ 'KEY' | translate: { score: 70 } }}`.
- В коде: `inject(LanguageService).instant('KEY')`.
- Выбранный язык сохраняется в браузере и уходит на бэкенд заголовком `Accept-Language`,
  поэтому курсы, уроки и тесты приходят на нужном языке без параметров в каждом запросе.
- Компоненты, показывающие контент с сервера, перезагружают его при смене языка (`effect` на `LanguageService.current`).

## Образовательные программы

Данные — в `features/public/program/programs.ts`. Добавить программу: запись в массив
и ключи `PROGRAM_<ID>_TITLE` / `PROGRAM_<ID>_DESC` в оба словаря. Старые адреса (`/landingBio` и т.д.) перенаправляются.

## Оплата

Кнопка «Купить курс» на дашборде открывает окно оплаты: создаётся заказ, показывается номер счёта для Kaspi.
Пока API Kaspi не подключён, при `KASPI_STUB_ENABLED=true` на бэкенде появляется кнопка «Тестовая оплата».
