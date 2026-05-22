import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { IMatchResponse } from '@core/interfaces/match.interface';
import { backdropFade, modalScale } from '@shared/animations/animations';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TeamBadgeComponent } from '@shared/components/team-badge/team-badge.component';
import { LucideAngularModule, Minus, Plus } from 'lucide-angular';

export interface IMatchResultPayload {
  homeScore: number;
  awayScore: number;
}

const MAX_SCORE = 99;

@Component({
  selector: 'app-match-result-dialog',
  standalone: true,
  imports: [ButtonComponent, TeamBadgeComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './match-result-dialog.component.html',
  styleUrl: './match-result-dialog.component.scss',
  animations: [modalScale, backdropFade],
})
export class MatchResultDialogComponent {
  public readonly open = input<boolean>(false);
  public readonly match = input<IMatchResponse | null>(null);
  public readonly submitting = input<boolean>(false);
  public readonly serverError = input<string | null>(null);

  public readonly confirmed = output<IMatchResultPayload>();
  public readonly cancelled = output<void>();

  protected readonly minusIcon = Minus;
  protected readonly plusIcon = Plus;

  protected readonly homeScore = signal(0);
  protected readonly awayScore = signal(0);

  protected readonly title = computed(() =>
    this.match()?.status === 'COMPLETED' ? 'Editar resultado' : 'Lançar resultado',
  );

  protected readonly confirmLabel = computed(() =>
    this.match()?.status === 'COMPLETED' ? 'Salvar resultado' : 'Lançar resultado',
  );

  constructor() {
    effect(() => {
      const m = this.match();
      const isOpen = this.open();
      if (isOpen && m) {
        this.homeScore.set(m.homeScore ?? 0);
        this.awayScore.set(m.awayScore ?? 0);
      }
    });
  }

  protected incHome(): void {
    if (this.submitting()) return;
    this.homeScore.update((v) => Math.min(MAX_SCORE, v + 1));
  }

  protected decHome(): void {
    if (this.submitting()) return;
    this.homeScore.update((v) => Math.max(0, v - 1));
  }

  protected incAway(): void {
    if (this.submitting()) return;
    this.awayScore.update((v) => Math.min(MAX_SCORE, v + 1));
  }

  protected decAway(): void {
    if (this.submitting()) return;
    this.awayScore.update((v) => Math.max(0, v - 1));
  }

  protected onHomeInput(event: Event): void {
    const value = this._parseScore((event.target as HTMLInputElement).value);
    this.homeScore.set(value);
  }

  protected onAwayInput(event: Event): void {
    const value = this._parseScore((event.target as HTMLInputElement).value);
    this.awayScore.set(value);
  }

  protected onBackdropClick(): void {
    if (!this.submitting()) {
      this.cancelled.emit();
    }
  }

  protected onCancel(): void {
    if (!this.submitting()) {
      this.cancelled.emit();
    }
  }

  protected onConfirm(): void {
    this.confirmed.emit({
      homeScore: this.homeScore(),
      awayScore: this.awayScore(),
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open() && !this.submitting()) {
      this.cancelled.emit();
    }
  }

  private _parseScore(raw: string): number {
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return 0;
    return Math.min(MAX_SCORE, n);
  }
}
