import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, LucideIconData, Plus } from 'lucide-angular';

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fab.component.html',
  styleUrl: './fab.component.scss',
})
export class FabComponent {
  public readonly icon = input<LucideIconData>(Plus);
  public readonly ariaLabel = input.required<string>();
  public readonly label = input<string | null>(null);
  public readonly routerPath = input<string | null>(null);

  public readonly buttonClick = output<MouseEvent>();

  protected onClick(event: MouseEvent): void {
    this.buttonClick.emit(event);
  }
}
