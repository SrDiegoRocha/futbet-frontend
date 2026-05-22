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
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthState } from '@core/auth/auth-state';
import { ApiException } from '@core/errors/api-error';
import { IRankingRowResponse } from '@core/interfaces/ranking.interface';
import { ITournamentResponse } from '@core/interfaces/tournament.interface';
import { RankingService } from '@core/services/ranking.service';
import { TournamentsService } from '@core/services/tournaments.service';
import { listStagger } from '@shared/animations/animations';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { Crown, LucideAngularModule, Medal, Trophy } from 'lucide-angular';

@Component({
  selector: 'app-tournament-ranking',
  standalone: true,
  imports: [
    LucideAngularModule,
    PageHeaderComponent,
    AvatarComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tournament-ranking.component.html',
  styleUrl: './tournament-ranking.component.scss',
  animations: [listStagger],
})
export class TournamentRankingComponent implements OnInit {
  private readonly _tournamentsService = inject(TournamentsService);
  private readonly _rankingService = inject(RankingService);
  private readonly _authState = inject(AuthState);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly trophyIcon = Trophy;
  protected readonly crownIcon = Crown;
  protected readonly medalIcon = Medal;

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly tournament = signal<ITournamentResponse | null>(null);
  protected readonly rows = signal<IRankingRowResponse[]>([]);

  protected readonly backToHref = computed(() => {
    const t = this.tournament();
    return t ? `/tournaments/${t.id}` : '/tournaments';
  });

  protected readonly myUserId = computed(() => this._authState.user()?.id ?? null);

  protected readonly podium = computed(() => this.rows().slice(0, 3));
  protected readonly tail = computed(() => this.rows().slice(3));

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

  protected accuracyLabel(row: IRankingRowResponse): string {
    if (row.totalPredictions === 0) return 'sem palpites';
    const evaluated = row.exactScoreHits + row.winnerHits + row.wrongs;
    if (evaluated === 0) return 'aguardando resultados';
    const exactPct = Math.round((row.exactScoreHits / evaluated) * 100);
    return `${row.exactScoreHits} exato${row.exactScoreHits === 1 ? '' : 's'} · ${exactPct}%`;
  }

  protected podiumIcon(position: number) {
    if (position === 1) return this.crownIcon;
    return this.medalIcon;
  }

  private _load(tid: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      tournament: this._tournamentsService.getById(tid),
      ranking: this._rankingService.list(tid),
    })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: ({ tournament, ranking }) => {
          this.tournament.set(tournament);
          this.rows.set(ranking);
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
                : 'Não foi possível carregar o ranking.',
            );
          }
        },
      });
  }
}
