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
import { ApiException } from '@core/errors/api-error';
import { ITeamResponse } from '@core/interfaces/team.interface';
import { TeamsService } from '@core/services/teams.service';
import { listStagger } from '@shared/animations/animations';
import { ButtonComponent } from '@shared/components/button/button.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { FabComponent } from '@shared/components/fab/fab.component';
import { TeamCardComponent } from '@shared/components/team-card/team-card.component';
import { Plus, Shield } from 'lucide-angular';

@Component({
  selector: 'app-my-teams',
  standalone: true,
  imports: [
    TeamCardComponent,
    EmptyStateComponent,
    ButtonComponent,
    FabComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-teams.component.html',
  styleUrl: './my-teams.component.scss',
  animations: [listStagger],
})
export class MyTeamsComponent implements OnInit {
  private readonly _service = inject(TeamsService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly shieldIcon = Shield;
  protected readonly plusIcon = Plus;

  protected readonly loading = signal(true);
  protected readonly items = signal<ITeamResponse[]>([]);
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
      .list({ page: 0, size: 30, sort: 'name,asc' })
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
              : 'Não foi possível carregar seus times.',
          );
          this.loading.set(false);
        },
      });
  }
}
