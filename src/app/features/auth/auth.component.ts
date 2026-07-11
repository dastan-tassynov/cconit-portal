import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';
import {SimpleTranslateService} from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import {LanguageSwitcherComponent} from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink,FooterComponent, TranslatePipe,LanguageSwitcherComponent],
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService,
              private router: Router,
              public translate: SimpleTranslateService) {}

  ngOnInit(): void {
    // Инициализация формы с валидацией
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.isLoading = false;

        // Перенаправляем пользователя на ваш реальный рабочий роут Дэшборда
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Неверный логин или пароль. Попробуйте еще раз.';
      }
    });
  }
}
