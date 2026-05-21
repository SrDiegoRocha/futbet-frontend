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
import { ApiException } from '@core/errors/api-error';
import { ITournamentResponse } from '@core/interfaces/tournament.interface';
import { TournamentsService } from '@core/services/tournaments.service';
import { listStagger } from '@shared/animations/animations';
import { ButtonComponent } from '@shared/components/button/button.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { TournamentCardComponent } from '@shared/components/tournament-card/tournament-card.component';
import { Trophy } from 'lucide-angular';

@Component({
  selector: 'app-my-tournaments',
  standalone: true,
  imports: [TournamentCardComponent, EmptyStateComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-tournaments.component.html',
  styleUrl: './my-tournaments.component.scss',
  animations: [listStagger],
})
export class MyTournamentsComponent implements OnInit {
  private readonly _service = inject(TournamentsService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly trophyIcon = Trophy;

  protected readonly loading = signal(true);
  protected readonly items = signal<ITournamentResponse[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly isEmpty = computed(
    () =>
      !this.loading() &&
      this.items().length === 0 &&
      this.errorMessage() === null,
  );

  public ngOnInit(): void {
    this._load();
  }

  protected retry(): void {
    this._load();
  }

  private _load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this._service
      .listMine({ page: 0, size: 20, sort: 'createdAt,desc' })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (page) => {
          this.items.set(page.content);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            err instanceof ApiException
              ? err.message
              : 'Não foi possível carregar seus torneios.',
          );
          this.loading.set(false);
        },
      });
  }
}
