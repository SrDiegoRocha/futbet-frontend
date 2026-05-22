import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiException } from '@core/errors/api-error';
import { ICreatePhaseRequest } from '@core/interfaces/phase.interface';
import { ITournamentResponse } from '@core/interfaces/tournament.interface';
import { PhasesService } from '@core/services/phases.service';
import { TournamentsService } from '@core/services/tournaments.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PhaseFormComponent } from '@shared/components/phase-form/phase-form.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-create-phase',
  standalone: true,
  imports: [PageHeaderComponent, PhaseFormComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-phase.component.html',
  styleUrl: './create-phase.component.scss',
})
export class CreatePhaseComponent implements OnInit {
  private readonly _tournamentsService = inject(TournamentsService);
  private readonly _phasesService = inject(PhasesService);
  private readonly _toast = inject(ToastService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly tournament = signal<ITournamentResponse | null>(null);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly backToHref = computed(() => {
    const t = this.tournament();
    return t ? `/tournaments/${t.id}/phases` : '/tournaments';
  });

  protected readonly tournamentStatus = computed(
    () => this.tournament()?.status ?? null,
  );

  public ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.loadError.set('Torneio não encontrado.');
      return;
    }
    this._loadTournament(id);
  }

  protected save(payload: ICreatePhaseRequest): void {
    const tid = this.tournament()?.id;
    if (!tid) return;

    this.submitting.set(true);
    this.serverError.set(null);

    this._phasesService
      .create(tid, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (phase) => {
          this.submitting.set(false);
          this._toast.success(`Fase "${phase.name}" criada.`);
          void this._router.navigate(['/tournaments', tid, 'phases']);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          const message =
            err instanceof ApiException
              ? err.message
              : 'Não foi possível criar a fase.';
          this.serverError.set(message);
          this._toast.error(message);
        },
      });
  }

  protected cancel(): void {
    const tid = this.tournament()?.id;
    void this._router.navigate(
      tid ? ['/tournaments', tid, 'phases'] : ['/tournaments'],
    );
  }

  private _loadTournament(id: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this._tournamentsService
      .getById(id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (tournament) => {
          this.tournament.set(tournament);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          if (err instanceof ApiException && err.isNotFound) {
            this.loadError.set('Torneio não encontrado.');
          } else if (err instanceof ApiException && err.isForbidden) {
            this.loadError.set('Você não tem acesso a este torneio.');
          } else {
            this.loadError.set(
              err instanceof ApiException
                ? err.message
                : 'Não foi possível carregar o torneio.',
            );
          }
        },
      });
  }
}
