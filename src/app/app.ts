import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContentProtectionService } from './core/ui/content-protection.service';
import { ToastsComponent } from './core/ui/toasts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <app-toasts />
  `,
})
export class App implements OnInit {
  private readonly contentProtection = inject(ContentProtectionService);

  ngOnInit(): void {
    this.contentProtection.enable();
  }
}
