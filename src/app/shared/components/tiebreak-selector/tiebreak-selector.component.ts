import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { TiebreakCriteria } from '@core/interfaces/enums';
import { GripVertical, LucideAngularModule, Plus, X } from 'lucide-angular';

const ALL_CRITERIA: TiebreakCriteria[] = [
  'POINTS',
  'WINS',
  'GOAL_DIFFERENCE',
  'GOALS_FOR',
  'HEAD_TO_HEAD',
  'FEWEST_LOSSES',
];

const LABELS: Record<TiebreakCriteria, string> = {
  POINTS: 'Pontos',
  WINS: 'Vitórias',
  GOAL_DIFFERENCE: 'Saldo de gols',
  GOALS_FOR: 'Gols pró',
  HEAD_TO_HEAD: 'Confronto direto',
  FEWEST_LOSSES: 'Menos derrotas',
};

@Component({
  selector: 'app-tiebreak-selector',
  standalone: true,
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tiebreak-selector.component.html',
  styleUrl: './tiebreak-selector.component.scss',
})
export class TiebreakSelectorComponent {
  public readonly value = input<TiebreakCriteria[]>([]);
  public readonly disabled = input<boolean>(false);
  public readonly valueChange = output<TiebreakCriteria[]>();

  protected readonly gripIcon = GripVertical;
  protected readonly xIcon = X;
  protected readonly plusIcon = Plus;

  protected readonly available = computed(() => {
    const selected = new Set(this.value());
    return ALL_CRITERIA.filter((c) => !selected.has(c));
  });

  protected labelOf(criterion: TiebreakCriteria): string {
    return LABELS[criterion];
  }

  protected add(criterion: TiebreakCriteria): void {
    if (this.disabled()) return;
    if (this.value().includes(criterion)) return;
    this.valueChange.emit([...this.value(), criterion]);
  }

  protected remove(criterion: TiebreakCriteria): void {
    if (this.disabled()) return;
    this.valueChange.emit(this.value().filter((c) => c !== criterion));
  }

  protected onDrop(event: CdkDragDrop<TiebreakCriteria[]>): void {
    if (this.disabled()) return;
    const updated = [...this.value()];
    moveItemInArray(updated, event.previousIndex, event.currentIndex);
    this.valueChange.emit(updated);
  }
}
