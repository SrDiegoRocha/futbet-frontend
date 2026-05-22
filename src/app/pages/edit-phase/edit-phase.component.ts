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
import { forkJoin } from 'rxjs';
import { ApiException } from '@core/errors/api-error';
import {
  ICreatePhaseRequest,
  IPhaseResponse,
} from '@core/interfaces/phase.interface';
import { ITournamentResponse } from '@core/interfaces/tournament.interface';
import { PhasesService } from '@core/services/phases.service';
import { TournamentsService } from '@core/services/tournaments.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PhaseFormComponent } from '@shared/components/phase-form/phase-form.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-edit-phase',
  standalone: true,
  imports: [
    PageHeaderComponent,
    PhaseFormComponent,
    ButtonComponent,
    ConfirmDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-phase.component.html',
  styleUrl: './edit-phase.component.scss',
})
export class EditPhaseComponent implements OnInit {
  private readonly _tournamentsService = inject(TournamentsService);
  private readonly _phasesService = inject(PhasesService);
  private readonly _toast = inject(ToastService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly tournament = signal<ITournamentResponse | null>(null);
  protected readonly phase = signal<IPhaseResponse | null>(null);

  protected readonly submitting = signal(false);
  protected readonly deleting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly confirmDeleteOpen = signal(false);

  protected readonly backToHref = computed(() => {
    const t = this.tournament();
    return t ? `/tournaments/${t.id}/phases` : '/tournaments';
  });

  protected readonly tournamentStatus = computed(
    () => this.tournament()?.status ?? null,
  );

  public ngOnInit(): void {
    const tid = this._route.snapshot.paramMap.get('id');
    const pid = this._route.snapshot.paramMap.get('pid');
    if (!tid || !pid) {
      this.loading.set(false);
      this.loadError.set('Fase não encontrada.');
      return;
    }
    this._load(tid, pid);
  }

  protected save(payload: ICreatePhaseRequest): void {
    const tid = this.tournament()?.id;
    const pid = this.phase()?.id;
    if (!tid || !pid) return;

    this.submitting.set(true);
    this.serverError.set(null);

    this._phasesService
      .update(tid, pid, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.phase.set(updated);
          this._toast.success(`Fase "${updated.name}" atualizada.`);
          void this._router.navigate(['/tournaments', tid, 'phases']);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          const message =
            err instanceof ApiException
              ? err.message
              : 'Não foi possível atualizar a fase.';
          this.serverError.set(message);
          this._toast.error(message);
        },
      });
  }

  protected requestDelete(): void {
    this.confirmDeleteOpen.set(true);
  }

  protected confirmDelete(): void {
    const tid = this.tournament()?.id;
    const phase = this.phase();
    if (!tid || !phase) return;

    this.deleting.set(true);

    this._phasesService
      .remove(tid, phase.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.confirmDeleteOpen.set(false);
          this._toast.success(`Fase "${phase.name}" excluída.`);
          void this._router.navigate(['/tournaments', tid, 'phases']);
        },
        error: (err: unknown) => {
          this.deleting.set(false);
          this.confirmDeleteOpen.set(false);
          const message =
            err instanceof ApiException
              ? err.message
              : 'Não foi possível excluir a fase.';
          this._toast.error(message);
        },
      });
  }

  protected cancelDelete(): void {
    this.confirmDeleteOpen.set(false);
  }

  protected cancel(): void {
    const tid = this.tournament()?.id;
    void this._router.navigate(
      tid ? ['/tournaments', tid, 'phases'] : ['/tournaments'],
    );
  }

  private _load(tid: string, pid: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      tournament: this._tournamentsService.getById(tid),
      phase: this._phasesService.getById(tid, pid),
    })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: ({ tournament, phase }) => {
          this.tournament.set(tournament);
          this.phase.set(phase);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          if (err instanceof ApiException && err.isNotFound) {
            this.loadError.set('Fase não encontrada.');
          } else if (err instanceof ApiException && err.isForbidden) {
            this.loadError.set('Você não tem acesso a esta fase.');
          } else {
            this.loadError.set(
              err instanceof ApiException
                ? err.message
                : 'Não foi possível carregar a fase.',
            );
          }
        },
      });
  }
}
