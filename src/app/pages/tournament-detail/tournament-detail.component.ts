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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthState } from '@core/auth/auth-state';
import { ApiException } from '@core/errors/api-error';
import {
  TiebreakCriteria,
  TournamentStatus,
} from '@core/interfaces/enums';
import { ITournamentResponse } from '@core/interfaces/tournament.interface';
import { TournamentsService } from '@core/services/tournaments.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ToastService } from '@shared/services/toast.service';
import {
  ChevronRight,
  Copy,
  Flag,
  Globe,
  Lock,
  LucideAngularModule,
  Medal,
  Pencil,
  Play,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
  Workflow,
} from 'lucide-angular';

const STATUS_FLOW: Record<TournamentStatus, TournamentStatus | null> = {
  DRAFT: 'OPEN',
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'FINISHED',
  FINISHED: null,
};

const STATUS_LABEL: Record<TournamentStatus, string> = {
  DRAFT: 'Rascunho',
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Finalizado',
};

const TIEBREAK_LABEL: Record<TiebreakCriteria, string> = {
  POINTS: 'Pontos',
  WINS: 'Vitórias',
  GOAL_DIFFERENCE: 'Saldo de gols',
  GOALS_FOR: 'Gols pró',
  HEAD_TO_HEAD: 'Confronto direto',
  FEWEST_LOSSES: 'Menos derrotas',
};

interface IStatusActionContext {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'default' | 'destructive';
  buttonLabel: string;
  buttonIcon: 'play' | 'flag';
}

const STATUS_ACTION_CONTEXT: Record<
  Exclude<TournamentStatus, 'FINISHED'>,
  IStatusActionContext
> = {
  DRAFT: {
    title: 'Abrir torneio?',
    description:
      'O torneio fica disponível para receber participantes pelo código de convite. Você ainda poderá editar configurações depois.',
    confirmLabel: 'Abrir torneio',
    variant: 'default',
    buttonLabel: 'Abrir torneio',
    buttonIcon: 'play',
  },
  OPEN: {
    title: 'Iniciar torneio?',
    description:
      'Ao iniciar, a privacidade não poderá mais ser alterada e os palpites começam a contar pontos.',
    confirmLabel: 'Iniciar',
    variant: 'default',
    buttonLabel: 'Iniciar torneio',
    buttonIcon: 'play',
  },
  IN_PROGRESS: {
    title: 'Encerrar torneio?',
    description:
      'Após encerrar, nada mais pode ser modificado: resultados, palpites e configurações ficam congelados.',
    confirmLabel: 'Encerrar',
    variant: 'destructive',
    buttonLabel: 'Encerrar torneio',
    buttonIcon: 'flag',
  },
};

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    ButtonComponent,
    ConfirmDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tournament-detail.component.html',
  styleUrl: './tournament-detail.component.scss',
})
export class TournamentDetailComponent implements OnInit {
  private readonly _service = inject(TournamentsService);
  private readonly _authState = inject(AuthState);
  private readonly _toast = inject(ToastService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly copyIcon = Copy;
  protected readonly refreshIcon = RefreshCw;
  protected readonly pencilIcon = Pencil;
  protected readonly playIcon = Play;
  protected readonly flagIcon = Flag;
  protected readonly globeIcon = Globe;
  protected readonly lockIcon = Lock;
  protected readonly usersIcon = Users;
  protected readonly trophyIcon = Trophy;
  protected readonly workflowIcon = Workflow;
  protected readonly chevronRightIcon = ChevronRight;
  protected readonly medalIcon = Medal;
  protected readonly sparklesIcon = Sparkles;

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly tournament = signal<ITournamentResponse | null>(null);

  protected readonly changingStatus = signal(false);
  protected readonly regenerating = signal(false);

  protected readonly statusDialogOpen = signal(false);
  protected readonly regenerateDialogOpen = signal(false);

  protected readonly isOwner = computed(() => {
    const t = this.tournament();
    const user = this._authState.user();
    if (!t || !user) return false;
    return t.owner.id === user.id;
  });

  protected readonly nextStatus = computed<TournamentStatus | null>(() => {
    const t = this.tournament();
    return t ? STATUS_FLOW[t.status] : null;
  });

  protected readonly statusContext = computed<IStatusActionContext | null>(
    () => {
      const t = this.tournament();
      if (!t || t.status === 'FINISHED') return null;
      return STATUS_ACTION_CONTEXT[t.status];
    },
  );

  protected readonly statusLabel = computed(() => {
    const t = this.tournament();
    return t ? STATUS_LABEL[t.status] : '';
  });

  protected readonly statusClass = computed(() => {
    const t = this.tournament();
    if (!t) return '';
    return `detail__status detail__status--${t.status.toLowerCase()}`;
  });

  protected readonly privacyLabel = computed(() => {
    const t = this.tournament();
    return t?.privacy === 'PRIVATE' ? 'Privado' : 'Público';
  });

  protected readonly memberCountLabel = computed(() => {
    const t = this.tournament();
    if (!t) return '';
    return t.maxParticipants !== null
      ? `${t.memberCount} / ${t.maxParticipants}`
      : String(t.memberCount);
  });

  protected readonly teamCountLabel = computed(() => {
    const t = this.tournament();
    if (!t) return '';
    return t.maxTeams !== null
      ? `${t.teamCount} / ${t.maxTeams}`
      : String(t.teamCount);
  });

  protected readonly createdAtLabel = computed(() => {
    const t = this.tournament();
    if (!t) return '';
    try {
      const date = new Date(t.createdAt);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  });

  public ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.loadError.set('Torneio não encontrado.');
      return;
    }
    this._load(id);
  }

  protected tiebreakLabel(criterion: TiebreakCriteria): string {
    return TIEBREAK_LABEL[criterion];
  }

  protected async copyCode(): Promise<void> {
    const code = this.tournament()?.inviteCode;
    if (!code) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        this._toast.success('Código copiado!');
      } else {
        this._toast.error('Seu navegador não suporta copiar automaticamente.');
      }
    } catch {
      this._toast.error('Não foi possível copiar o código.');
    }
  }

  protected requestRegenerate(): void {
    this.regenerateDialogOpen.set(true);
  }

  protected confirmRegenerate(): void {
    const t = this.tournament();
    if (!t || this.regenerating()) return;
    this.regenerating.set(true);
    this._service
      .regenerateInviteCode(t.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (updated) => {
          this.regenerating.set(false);
          this.regenerateDialogOpen.set(false);
          this.tournament.set(updated);
          this._toast.success('Novo código gerado.');
        },
        error: (err: unknown) => {
          this.regenerating.set(false);
          this.regenerateDialogOpen.set(false);
          const message =
            err instanceof ApiException
              ? err.message
              : 'Não foi possível regenerar o código.';
          this._toast.error(message);
        },
      });
  }

  protected cancelRegenerate(): void {
    this.regenerateDialogOpen.set(false);
  }

  protected requestStatusChange(): void {
    if (this.nextStatus() === null) return;
    this.statusDialogOpen.set(true);
  }

  protected confirmStatusChange(): void {
    const t = this.tournament();
    const next = this.nextStatus();
    if (!t || !next || this.changingStatus()) return;

    this.changingStatus.set(true);
    this._service
      .changeStatus(t.id, { targetStatus: next })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (updated) => {
          this.changingStatus.set(false);
          this.statusDialogOpen.set(false);
          this.tournament.set(updated);
          this._toast.success(`Status atualizado para ${STATUS_LABEL[next]}.`);
        },
        error: (err: unknown) => {
          this.changingStatus.set(false);
          this.statusDialogOpen.set(false);
          const message =
            err instanceof ApiException
              ? err.message
              : 'Não foi possível mudar o status.';
          this._toast.error(message);
        },
      });
  }

  protected cancelStatusChange(): void {
    this.statusDialogOpen.set(false);
  }

  private _load(id: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this._service
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
