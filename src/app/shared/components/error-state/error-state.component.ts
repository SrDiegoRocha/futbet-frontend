import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { AlertTriangle, LucideAngularModule, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  public readonly title = input<string>('Algo deu errado');
  public readonly message = input<string>('');
  public readonly canRetry = input<boolean>(false);
  public readonly retrying = input<boolean>(false);
  public readonly retryLabel = input<string>('Tentar novamente');

  public readonly retry = output<void>();

  protected readonly alertIcon = AlertTriangle;
  protected readonly refreshIcon = RefreshCw;

  protected onRetry(): void {
    if (!this.retrying()) this.retry.emit();
  }
}
