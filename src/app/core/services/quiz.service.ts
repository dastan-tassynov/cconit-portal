import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuizAnswer {
  id: number;
  answerText: string;
}


export interface Question {
  id: number;
  questionText: string;
  subjectId: number;
  answers: QuizAnswer[];
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = 'https://c49w5cwg79ul.share.zrok.io/api/student/quiz';

  constructor(private http: HttpClient) {}

  // Получить вопросы по ID курса
  getQuestionsByCourse(
    courseId: number,
    language: string = 'ru'
  ): Observable<Question[]> {

    return this.http.get<Question[]>(
      `${this.apiUrl}/generate/${courseId}?language=${language}`
    );

  }
}
