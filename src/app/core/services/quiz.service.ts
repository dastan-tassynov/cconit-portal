import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = 'https://c49w5cwg79ul.share.zrok.io/api/student/quiz';

  constructor(private http: HttpClient) {}

  // Получить вопросы по ID курса
  getQuestionsByCourse(courseId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/${courseId}`);
  }
}
