import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  TournamentPhaseType,
  TournamentStatus,
} from '@core/interfaces/enums';
import {
  ICreateMatchRequest,
  IMatchResponse,
  IUpdateMatchRequest,
} from '@core/interfaces/match.interface';
import { IPhaseGroupResponse } from '@core/interfaces/phase-group.interface';
import { IPhaseTeamResponse } from '@core/interfaces/phase-team.interface';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';

export type MatchFormMode = 'create' | 'edit';
export type MatchFormPayload = ICreateMatchRequest | IUpdateMatchRequest;

function differentTeamsValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const home = group.get('homeTeamId')?.value;
  const away = group.get('awayTeamId')?.value;
  if (!home || !away) return null;
  return home !== away ? null : { sameTeams: true };
}

function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  } catch {
    return '';
  }
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './match-form.component.html',
  styleUrl: './match-form.component.scss',
})
export class MatchFormComponent implements OnInit {
  public readonly initial = input<IMatchResponse | null>(null);
  public readonly mode = input<MatchFormMode>('create');
  public readonly phaseType = input.required<TournamentPhaseType>();
  public readonly phaseTeams = input<IPhaseTeamResponse[]>([]);
  public readonly groups = input<IPhaseGroupResponse[]>([]);
  public readonly tournamentStatus = input<TournamentStatus | null>(null);
  public readonly matchStatus = input<IMatchResponse['status'] | null>(null);
  public readonly submitting = input<boolean>(false);
  public readonly serverError = input<string | null>(null);

  public readonly saveForm = output<MatchFormPayload>();
  public readonly cancelForm = output<void>();

  private readonly _fb = inject(FormBuilder);

  protected readonly form = this._fb.group(
    {
      homeTeamId: this._fb.nonNullable.control('', {
        validators: [Validators.required],
      }),
      awayTeamId: this._fb.nonNullable.control('', {
        validators: [Validators.required],
      }),
      round: this._fb.nonNullable.control(1, {
        validators: [Validators.required, Validators.min(1)],
      }),
      groupId: this._fb.control<string | null>(null),
      scheduledAt: this._fb.nonNullable.control(''),
    },
    { validators: [differentTeamsValidator] },
  );

  private readonly _formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  private readonly _homeValue = toSignal(
    this.form.controls.homeTeamId.valueChanges,
    { initialValue: this.form.controls.homeTeamId.value },
  );
  private readonly _awayValue = toSignal(
    this.form.controls.awayTeamId.valueChanges,
    { initialValue: this.form.controls.awayTeamId.value },
  );

  protected readonly isGroupsPhase = computed(
    () => this.phaseType() === 'GROUPS',
  );

  protected readonly homeOptions = computed<IPhaseTeamResponse[]>(() => {
    const away = this._awayValue();
    return this.phaseTeams().filter((t) => t.teamId !== away);
  });

  protected readonly awayOptions = computed<IPhaseTeamResponse[]>(() => {
    const home = this._homeValue();
    return this.phaseTeams().filter((t) => t.teamId !== home);
  });

  protected readonly statusBanner = computed<string | null>(() => {
    if (this.tournamentStatus() === 'FINISHED') {
      return 'Torneio finalizado — partidas não podem ser modificadas.';
    }
    if (this.mode() === 'edit' && this.matchStatus() === 'COMPLETED') {
      return 'Partida já concluída. Para editar o agendamento, primeiro limpe o resultado (cancele a partida).';
    }
    return null;
  });

  protected readonly isLocked = computed(() => {
    if (this.tournamentStatus() === 'FINISHED') return true;
    if (this.mode() === 'edit' && this.matchStatus() === 'COMPLETED') {
      return true;
    }
    return false;
  });

  protected readonly submitLabel = computed(() =>
    this.mode() === 'create' ? 'Criar partida' : 'Salvar alterações',
  );

  protected readonly teamsError = computed<string | null>(() => {
    void this._formStatus();
    if (!this.form.touched) return null;
    if (this.form.hasError('sameTeams')) {
      return 'Os times mandante e visitante devem ser diferentes.';
    }
    return null;
  });

  protected readonly groupRequiredError = computed<string | null>(() => {
    void this._formStatus();
    if (!this.isGroupsPhase()) return null;
    const c = this.form.controls.groupId;
    if (!c.touched) return null;
    return c.value ? null : 'Selecione um grupo';
  });

  public ngOnInit(): void {
    const init = this.initial();
    if (init) {
      this.form.setValue({
        homeTeamId: init.homeTeam.id,
        awayTeamId: init.awayTeam.id,
        round: init.round + 1,
        groupId: init.groupId,
        scheduledAt: isoToLocalInput(init.scheduledAt),
      });
    }
    if (this.isLocked()) {
      this.form.disable();
    }
  }

  protected roundError(): string | null {
    const c = this.form.controls.round;
    if (!c.touched || c.valid) return null;
    if (c.hasError('required')) return 'Obrigatório';
    if (c.hasError('min')) return 'Mínimo 1';
    return null;
  }

  protected onSubmit(): void {
    if (this.submitting() || this.isLocked()) return;
    void this._formStatus();

    if (this.isGroupsPhase() && !this.form.controls.groupId.value) {
      this.form.controls.groupId.markAsTouched();
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const basePayload = {
      homeTeamId: raw.homeTeamId,
      awayTeamId: raw.awayTeamId,
      round: raw.round - 1,
      groupId: this.isGroupsPhase() ? raw.groupId : null,
      scheduledAt: localInputToIso(raw.scheduledAt),
    };

    this.saveForm.emit(basePayload);
  }

  protected onCancel(): void {
    this.cancelForm.emit();
  }
}
