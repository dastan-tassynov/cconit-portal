import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import {SimpleTranslateService} from '../../core/services/translation.service';
import {LanguageSwitcherComponent} from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink,FooterComponent,TranslatePipe,LanguageSwitcherComponent],
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  errorMessage: string = '';
  isLoading: boolean = false;

  registerData = {
    username: '',        // Сюда пишется ФИО
    iin: '',             // Твой новый ИИН
    email: '',           // E-mail
    password: '',
    confirmPassword: ''
  };

  constructor(private authService: AuthService, private router: Router,
              public translate: SimpleTranslateService) {}

  onRegister(): void {
    // 1. Базовая проверка заполнения полей
    if (!this.registerData.username || !this.registerData.iin || !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
      return;
    }

    // 2. Валидация ИИН на стороне фронтенда
    const iinPattern = /^\d{12}$/;
    if (!iinPattern.test(this.registerData.iin)) {
      this.errorMessage = 'ИИН должен состоять ровно из 12 цифр.';
      return;
    }

    // 3. Проверка длины пароля
    if (this.registerData.password.length < 4) {
      this.errorMessage = 'Пароль должен быть не менее 4 символов.';
      return;
    }

    // 4. Проверка совпадения паролей
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Пароли не совпадают!';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Формируем объект для отправки на бэкенд
    const userData = {
      username: this.registerData.email,  // Логином будет являться email
      iin: this.registerData.iin,          // Добавляем ИИН
      fullName: this.registerData.username,// Наше ФИО
      password: this.registerData.password
    };

    // 5. Отправляем запрос на бэкенд
    this.authService.register(userData).subscribe({
      next: (res) => {
        // Автоматический вход после успешной регистрации
        const credentials = {
          username: userData.username,
          password: userData.password
        };

        this.authService.login(credentials).subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/student/dashboard']);
          },
          error: () => {
            this.isLoading = false;
            this.router.navigate(['/auth']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Ошибка при регистрации. Проверьте введенные данные.';
      }
    });
  }
}
