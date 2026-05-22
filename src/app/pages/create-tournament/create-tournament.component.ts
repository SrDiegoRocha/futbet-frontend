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
import { ICreateTournamentRequest } from '@core/interfaces/tournament.interface';
import { TournamentsService } from '@core/services/tournaments.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TournamentFormComponent } from '@shared/components/tournament-form/tournament-form.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-create-tournament',
  standalone: true,
  imports: [PageHeaderComponent, TournamentFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-tournament.component.html',
  styleUrl: './create-tournament.component.scss',
})
export class CreateTournamentComponent {
  private readonly _service = inject(TournamentsService);
  private readonly _toast = inject(ToastService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected save(payload: ICreateTournamentRequest): void {
    this.submitting.set(true);
    this.serverError.set(null);

    this._service
      .create(payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (tournament) => {
          this.submitting.set(false);
          this._toast.success(`Torneio "${tournament.name}" criado!`);
          void this._router.navigate(['/tournaments']);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          const message =
            err instanceof ApiException
              ? err.message
              : 'Não foi possível criar o torneio.';
          this.serverError.set(message);
          this._toast.error(message);
        },
      });
  }

  protected cancel(): void {
    void this._router.navigate(['/tournaments']);
  }
}
