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
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AuthState } from '@core/auth/auth-state';
import { ApiException } from '@core/errors/api-error';
import { IPredictionResponse } from '@core/interfaces/prediction.interface';
import { ITournamentResponse } from '@core/interfaces/tournament.interface';
import { PredictionsService } from '@core/services/predictions.service';
import { TournamentsService } from '@core/services/tournaments.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import {
  LucideAngularModule,
  Settings,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    AvatarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly _authState = inject(AuthState);
  private readonly _tournamentsService = inject(TournamentsService);
  private readonly _predictionsService = inject(PredictionsService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly trophyIcon = Trophy;
  protected readonly sparklesIcon = Sparkles;
  protected readonly usersIcon = Users;
  protected readonly settingsIcon = Settings;

  protected readonly user = this._authState.user;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly ownedCount = signal(0);
  protected readonly joinedCount = signal(0);
  protected readonly totalPredictions = signal(0);
  protected readonly totalPoints = signal(0);

  protected readonly userName = computed(() => this.user()?.name ?? '');
  protected readonly userEmail = computed(() => this.user()?.email ?? '');
  protected readonly userAvatar = computed(() => this.user()?.avatarUrl ?? null);
  protected readonly userRoleLabel = computed(() => {
    const role = this.user()?.role;
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'USER') return 'Usuário';
    return role ?? '';
  });

  protected readonly memberSinceLabel = computed(() => {
    const iso = this.user()?.createdAt;
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return '';
    }
  });

  protected readonly totalTournaments = computed(
    () => this.ownedCount() + this.joinedCount(),
  );

  public ngOnInit(): void {
    this._load();
  }

  private _load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      mine: this._tournamentsService.listMine({ page: 0, size: 100 }).pipe(
        catchError(() => of({ content: [] as ITournamentResponse[], totalElements: 0 })),
      ),
      joined: this._tournamentsService.listJoined({ page: 0, size: 100 }).pipe(
        catchError(() => of({ content: [] as ITournamentResponse[], totalElements: 0 })),
      ),
    })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: ({ mine, joined }) => {
          this.ownedCount.set(mine.totalElements ?? mine.content.length);
          this.joinedCount.set(joined.totalElements ?? joined.content.length);
          this._loadPredictionAggregates([...mine.content, ...joined.content]);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set(
            err instanceof ApiException
              ? err.message
              : 'Não foi possível carregar suas informações.',
          );
        },
      });
  }

  private _loadPredictionAggregates(tournaments: ITournamentResponse[]): void {
    const dedup = new Map<string, ITournamentResponse>();
    for (const t of tournaments) dedup.set(t.id, t);
    const list = Array.from(dedup.values());

    if (list.length === 0) {
      this.totalPredictions.set(0);
      this.totalPoints.set(0);
      this.loading.set(false);
      return;
    }

    const calls = list.map((t) =>
      this._predictionsService.listMineInTournament(t.id).pipe(
        catchError(() => of<IPredictionResponse[]>([])),
        map((predictions) => predictions),
      ),
    );

    forkJoin(calls)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (results) => {
          let total = 0;
          let points = 0;
          for (const predictions of results) {
            total += predictions.length;
            points += predictions.reduce((sum, p) => sum + p.points, 0);
          }
          this.totalPredictions.set(total);
          this.totalPoints.set(points);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
