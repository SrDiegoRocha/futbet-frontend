import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ApiException } from '@core/errors/api-error';
import { ICreateTeamRequest } from '@core/interfaces/team.interface';
import { TeamsService } from '@core/services/teams.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TeamFormComponent } from '@shared/components/team-form/team-form.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-create-team',
  standalone: true,
  imports: [PageHeaderComponent, TeamFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-team.component.html',
  styleUrl: './create-team.component.scss',
})
export class CreateTeamComponent {
  private readonly _service = inject(TeamsService);
  private readonly _toast = inject(ToastService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected save(payload: ICreateTeamRequest): void {
    this.submitting.set(true);
    this.serverError.set(null);

    this._service
      .create(payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (team) => {
          this.submitting.set(false);
          this._toast.success(`Time "${team.name}" criado!`);
          void this._router.navigate(['/teams']);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          const message =
            err instanceof ApiException
              ? err.message
              : 'Não foi possível criar o time.';
          this.serverError.set(message);
          this._toast.error(message);
        },
      });
  }

  protected cancel(): void {
    void this._router.navigate(['/teams']);
  }
}
