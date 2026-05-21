import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  public readonly icon = input<LucideIconData | null>(null);
  public readonly title = input<string>('');
  public readonly description = input<string>('');
}
