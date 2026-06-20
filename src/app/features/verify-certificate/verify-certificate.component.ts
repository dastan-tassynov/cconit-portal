import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-certificate',
  templateUrl: './verify-certificate.component.html',
  styleUrls: ['./verify-certificate.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class VerifyCertificateComponent implements OnInit {
  uuid: string | null = null;
  certData: any = null;
  errorMessage: string = '';
  isLoading: boolean = true;

  // Замени на свой реальный URL бэкенда при необходимости
  private apiUrl = 'https://c49w5cwg79ul.share.zrok.io/api/public/verify/certificate';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    // Вытаскиваем uuid из адресной строки: /verify/certificate/:uuid
    this.uuid = this.route.snapshot.paramMap.get('uuid');

    if (!this.uuid) {
      this.errorMessage = 'Идентификатор сертификата не указан.';
      this.isLoading = false;
      return;
    }

    // Делаем ПУБЛИЧНЫЙ запрос без заголовка Authorization (Bearer токен не нужен!)
    this.http.get(`${this.apiUrl}/${this.uuid}`).subscribe({
      next: (data) => {
        this.certData = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404) {
          this.errorMessage = err.error?.message || 'Сертификат с данным кодом не найден в системе Центра NIT.';
        } else {
          this.errorMessage = 'Произошла ошибка при связи с сервером верификации. Попробуйте позже.';
        }
      }
    });
  }
}
