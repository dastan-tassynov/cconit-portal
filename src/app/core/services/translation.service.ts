import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SimpleTranslateService {
  private currentLang = 'ru';
  private translations: any = {
    // Внутри объекта translations в вашем сервисе
    ru: {
      'AUTH_LOGIN_TITLE': 'С возвращением',
      'AUTH_LOGIN_SUBTITLE': 'Войдите в свой аккаунт, чтобы продолжить обучение',
      'LABEL_EMAIL_IIN': 'E-mail / ИИН',
      'PLACEHOLDER_EMAIL_IIN': 'name@example.com или ИИН',
      'LABEL_PASSWORD': 'Пароль',
      'BTN_LOGGING_IN': 'Вход...',
      'BTN_LOGIN': 'Войти',
      'AUTH_NO_ACCOUNT': 'Нет аккаунта?',
      'AUTH_REGISTER_LINK': 'Зарегистрироваться',
      'AUTH_REGISTER_TITLE': 'Регистрация',
      'AUTH_REGISTER_SUBTITLE': 'Создайте аккаунт, чтобы начать обучение',
      'LABEL_FULL_NAME': 'Полное ФИО',
      'PLACEHOLDER_FULL_NAME': 'Иванов Иван Иванович',
      'LABEL_IIN': 'ИИН (12 цифр)',
      'PLACEHOLDER_IIN': 'Введите ваш ИИН',
      'LABEL_EMAIL': 'E-mail (используется для входа)',
      'LABEL_CONFIRM_PASSWORD': 'Подтвердите пароль',
      'BTN_CREATING': 'Создание аккаунта...',
      'BTN_REGISTER': 'Создать аккаунт',
      'AUTH_ALREADY_HAVE_ACCOUNT': 'Уже есть аккаунт?',
      'AUTH_LOGIN_LINK': 'Войти',
      'QUIZ_QUESTION_PROGRESS': 'Вопрос',
      'QUIZ_TEST_TITLE': 'Контрольное тестирование',
      'BTN_NEXT': 'Дальше →',
      'BTN_FINISH': 'Завершить тест',
      'RESULTS_SUCCESS_TITLE': 'Тестирование успешно сдано!',
      'RESULTS_SUCCESS_SUBTITLE': 'Поздравляем! Данные отправлены в систему Орлеу.',
      'RESULTS_FAIL_TITLE': 'Тест не пройден',
      'RESULTS_FAIL_SUBTITLE': 'Для сдачи нужно набрать не менее 70%.',
      'RESULTS_YOUR_SCORE': 'Ваш результат',
      'RESULTS_ATTEMPTS': 'Всего попыток',
      'BTN_DASHBOARD': 'Вернуться на главную',
      'BTN_RESTART': 'Пройти заново',
      'NAV_COURSES': 'Пройденные курсы', 'NAV_CERTIFICATES': 'Сертификаты', 'NAV_ADMIN_PANEL': 'Панель управления',
      'NAV_CONSTRUCTOR': 'Конструктор курсов', 'NAV_ADS': 'Рекламные баннеры', 'NAV_SECURITY': 'Безопасность',
      'NAV_ROLES': 'Пользователи и Роли', 'BTN_BACK': 'На главную', 'BTN_LOGOUT': 'Выйти',
      'PROFILE_TITLE': 'Личный кабинет', 'CURRENT_ROLE': 'Текущая роль', 'MY_COURSES': 'Мои предметы',
      'TH_NAME': 'Название', 'TH_ATTEMPTS': 'Попытки', 'TH_SCORE': 'Результат', 'TH_ACCESS': 'Доступ', 'TH_AUTHOR': 'Автор',
      'NO_TESTS': 'Не сдавался', 'OPEN': 'Открыт', 'LIMITED': 'Ограничен', 'STEP_1': 'Шаг 1: Создание дисциплины',
      'COURSE_NAME_LABEL': 'НАЗВАНИЕ ПРЕДМЕТА', 'PH_COURSE_NAME': 'Введите название...', 'BTN_REGISTER_COURSE': 'Зарегистрировать'
    },
    kk: {
      'AUTH_LOGIN_TITLE': 'Қош келдіңіз',
      'AUTH_LOGIN_SUBTITLE': 'Оқуды жалғастыру үшін аккаунтыңызға кіріңіз',
      'LABEL_EMAIL_IIN': 'E-mail / ЖСН',
      'PLACEHOLDER_EMAIL_IIN': 'name@example.com немесе ЖСН',
      'LABEL_PASSWORD': 'Құпия сөз',
      'BTN_LOGGING_IN': 'Кіру...',
      'BTN_LOGIN': 'Кіру',
      'AUTH_NO_ACCOUNT': 'Аккаунтыңыз жоқ па?',
      'AUTH_REGISTER_LINK': 'Тіркелу',
      'AUTH_REGISTER_TITLE': 'Тіркелу',
      'AUTH_REGISTER_SUBTITLE': 'Оқуды бастау үшін аккаунт жасаңыз',
      'LABEL_FULL_NAME': 'Толық аты-жөніңіз',
      'PLACEHOLDER_FULL_NAME': 'Иванов Иван Иванович',
      'LABEL_IIN': 'ЖСН (12 сан)',
      'PLACEHOLDER_IIN': 'ЖСН енгізіңіз',
      'LABEL_EMAIL': 'E-mail (кіру үшін қолданылады)',
      'LABEL_CONFIRM_PASSWORD': 'Құпия сөзді растаңыз',
      'BTN_CREATING': 'Аккаунт жасалуда...',
      'BTN_REGISTER': 'Аккаунтты жасау',
      'AUTH_ALREADY_HAVE_ACCOUNT': 'Аккаунтыңыз бар ма?',
      'AUTH_LOGIN_LINK': 'Кіру',
      'QUIZ_QUESTION_PROGRESS': 'Сұрақ',
      'QUIZ_TEST_TITLE': 'Бақылау тестілеуі',
      'BTN_NEXT': 'Келесі →',
      'BTN_FINISH': 'Тесті аяқтау',
      'RESULTS_SUCCESS_TITLE': 'Тестілеу сәтті тапсырылды!',
      'RESULTS_SUCCESS_SUBTITLE': 'Құттықтаймыз! Деректер Өрлеу жүйесіне жіберілді.',
      'RESULTS_FAIL_TITLE': 'Тест тапсырылмады',
      'RESULTS_FAIL_SUBTITLE': 'Тапсыру үшін кемінде 70% жинау керек.',
      'RESULTS_YOUR_SCORE': 'Сіздің нәтижеңіз',
      'RESULTS_ATTEMPTS': 'Барлық талпыныстар саны',
      'BTN_DASHBOARD': 'Басты бетке оралу',
      'BTN_RESTART': 'Қайта тапсыру',
      'NAV_COURSES': 'Өтілген курстар', 'NAV_CERTIFICATES': 'Сертификаттар', 'NAV_ADMIN_PANEL': 'Басқару панелі',
      'NAV_CONSTRUCTOR': 'Курс конструкторы', 'NAV_ADS': 'Жарнамалық баннерлер', 'NAV_SECURITY': 'Қауіпсіздік',
      'NAV_ROLES': 'Пайдаланушылар мен Рөлдер', 'BTN_BACK': 'Басты бет', 'BTN_LOGOUT': 'Шығу',
      'PROFILE_TITLE': 'Жеке кабинет', 'CURRENT_ROLE': 'Ағымдағы рөл', 'MY_COURSES': 'Менің пәндерім',
      'TH_NAME': 'Атауы', 'TH_ATTEMPTS': 'Талпыныстар', 'TH_SCORE': 'Нәтиже', 'TH_ACCESS': 'Қолжетімділік', 'TH_AUTHOR': 'Авторы',
      'NO_TESTS': 'Тапсырылмады', 'OPEN': 'Ашық', 'LIMITED': 'Шектеулі', 'STEP_1': '1-қадам: Пән құру',
      'COURSE_NAME_LABEL': 'ПӘН АТАУЫ', 'PH_COURSE_NAME': 'Атауын енгізіңіз...', 'BTN_REGISTER_COURSE': 'Тіркеу'
    }
  };

  public getCurrentLang(): string {
    return this.currentLang; // или как у вас называется переменная языка
  }
  use(lang: string) { this.currentLang = lang; }
  instant(key: string): string { return this.translations[this.currentLang][key] || key; }
}
