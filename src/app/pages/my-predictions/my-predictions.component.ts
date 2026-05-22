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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { ApiException } from '@core/errors/api-error';
import { IMatchResponse } from '@core/interfaces/match.interface';
import { IPhaseResponse } from '@core/interfaces/phase.interface';
import { IPredictionResponse } from '@core/interfaces/prediction.interface';
import { ITournamentResponse } from '@core/interfaces/tournament.interface';
import { MatchesService } from '@core/services/matches.service';
import { PhasesService } from '@core/services/phases.service';
import { PredictionsService } from '@core/services/predictions.service';
import { TournamentsService } from '@core/services/tournaments.service';
import { listStagger } from '@shared/animations/animations';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TeamBadgeComponent } from '@shared/components/team-badge/team-badge.component';
import { LucideAngularModule, Sparkles, Trophy } from 'lucide-angular';

interface IGroupedPrediction {
  phase: IPhaseResponse;
  rows: {
    prediction: IPredictionResponse;
    match: IMatchResponse;
  }[];
}

@Component({
  selector: 'app-my-predictions',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    TeamBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-predictions.component.html',
  styleUrl: './my-predictions.component.scss',
  animations: [listStagger],
})
export class MyPredictionsComponent implements OnInit {
  private readonly _tournamentsService = inject(TournamentsService);
  private readonly _phasesService = inject(PhasesService);
  private readonly _matchesService = inject(MatchesService);
  private readonly _predictionsService = inject(PredictionsService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly sparklesIcon = Sparkles;
  protected readonly trophyIcon = Trophy;

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly tournament = signal<ITournamentResponse | null>(null);
  protected readonly grouped = signal<IGroupedPrediction[]>([]);

  protected readonly backToHref = computed(() => {
    const t = this.tournament();
    return t ? `/tournaments/${t.id}` : '/tournaments';
  });

  protected readonly totalPredictions = computed(() =>
    this.grouped().reduce((sum, g) => sum + g.rows.length, 0),
  );

  protected readonly totalPoints = computed(() =>
    this.grouped().reduce(
      (sum, g) => sum + g.rows.reduce((s, r) => s + r.prediction.points, 0),
      0,
    ),
  );

  public ngOnInit(): void {
    const tid = this._route.snapshot.paramMap.get('id');
    if (!tid) {
      this.loading.set(false);
      this.loadError.set('Torneio não encontrado.');
      return;
    }
    this._load(tid);
  }

  protected retry(): void {
    const tid = this._route.snapshot.paramMap.get('id');
    if (tid) this._load(tid);
  }

  protected matchLink(phase: IPhaseResponse, match: IMatchResponse): unknown[] {
    const t = this.tournament();
    if (!t) return [];
    return ['/tournaments', t.id, 'phases', phase.id, 'matches', match.id];
  }

  protected formatScheduled(iso: string | null): string {
    if (!iso) return 'Sem horário';
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return iso;
    }
  }

  private _load(tid: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      tournament: this._tournamentsService.getById(tid),
      phases: this._phasesService.list(tid),
      predictions: this._predictionsService.listMineInTournament(tid),
    })
      .pipe(
        switchMap(({ tournament, phases, predictions }) => {
          const empty: Record<string, IMatchResponse[]> = {};
          if (phases.length === 0) {
            return of({
              tournament,
              phases,
              predictions,
              matchesByPhase: empty,
            });
          }
          const matchCalls = phases.map((p) =>
            this._matchesService.list(tid, p.id),
          );
          return forkJoin(matchCalls).pipe(
            switchMap((matchesPerPhase) => {
              const matchesByPhase: Record<string, IMatchResponse[]> = {};
              phases.forEach((p, i) => {
                matchesByPhase[p.id] = matchesPerPhase[i] ?? [];
              });
              return of({ tournament, phases, predictions, matchesByPhase });
            }),
          );
        }),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        next: ({ tournament, phases, predictions, matchesByPhase }) => {
          this.tournament.set(tournament);

          const matchToPhase = new Map<string, IPhaseResponse>();
          const matchById = new Map<string, IMatchResponse>();
          for (const phase of phases) {
            for (const match of matchesByPhase[phase.id] ?? []) {
              matchToPhase.set(match.id, phase);
              matchById.set(match.id, match);
            }
          }

          const byPhase = new Map<
            string,
            { phase: IPhaseResponse; rows: IGroupedPrediction['rows'] }
          >();
          for (const pred of predictions) {
            const match = matchById.get(pred.matchId);
            const phase = matchToPhase.get(pred.matchId);
            if (!match || !phase) continue;
            if (!byPhase.has(phase.id)) {
              byPhase.set(phase.id, { phase, rows: [] });
            }
            byPhase.get(phase.id)?.rows.push({ prediction: pred, match });
          }

          const groups: IGroupedPrediction[] = [];
          for (const phase of phases) {
            const entry = byPhase.get(phase.id);
            if (entry && entry.rows.length > 0) {
              entry.rows.sort((a, b) => {
                const aTime = a.match.scheduledAt
                  ? new Date(a.match.scheduledAt).getTime()
                  : 0;
                const bTime = b.match.scheduledAt
                  ? new Date(b.match.scheduledAt).getTime()
                  : 0;
                return aTime - bTime;
              });
              groups.push(entry);
            }
          }

          this.grouped.set(groups);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          if (err instanceof ApiException && err.isForbidden) {
            this.loadError.set(
              'Você precisa ser membro ativo deste torneio para ver seus palpites.',
            );
          } else if (err instanceof ApiException && err.isNotFound) {
            this.loadError.set('Torneio não encontrado.');
          } else {
            this.loadError.set(
              err instanceof ApiException
                ? err.message
                : 'Não foi possível carregar seus palpites.',
            );
          }
        },
      });
  }
}
