import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { api } from '../../../core/http/api-url';
import { LanguageService } from '../../../core/i18n/language.service';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';
import { ProgramDocument, findProgram } from './programs';

/** Страница образовательной программы (заменяет 8 копий landing*.component). */
@Component({
  selector: 'app-program',
  imports: [RouterLink, TranslatePipe, PdfViewerModule, SiteHeaderComponent, FooterComponent],
  templateUrl: './program.component.html',
  styleUrls: ['../public.css', './program.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramComponent {
  private readonly language = inject(LanguageService);

  /** Параметр маршрута programs/:programId (withComponentInputBinding). */
  readonly programId = input.required<string>();

  protected readonly program = computed(() => findProgram(this.programId()));

  /** Сначала документы на языке интерфейса. */
  protected readonly documents = computed<ProgramDocument[]>(() => {
    const lang = this.language.current();
    const docs = this.program()?.documents ?? [];
    return [...docs].sort((a, b) => Number(b.lang === lang) - Number(a.lang === lang));
  });

  protected readonly openedPdf = signal<string | null>(null);

  protected open(doc: ProgramDocument): void {
    this.openedPdf.set(api(`/api/public/documents/${doc.id}`));
  }

  protected close(): void {
    this.openedPdf.set(null);
  }
}
