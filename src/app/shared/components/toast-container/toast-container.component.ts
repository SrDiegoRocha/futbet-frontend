import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toastSlide } from '@shared/animations/animations';
import { ToastService } from '@shared/services/toast.service';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LucideAngularModule,
  X,
  XCircle,
} from 'lucide-angular';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  animations: [toastSlide],
})
export class ToastContainerComponent {
  private readonly _toastService = inject(ToastService);

  protected readonly toasts = this._toastService.toasts;

  protected readonly successIcon = CheckCircle2;
  protected readonly errorIcon = XCircle;
  protected readonly infoIcon = Info;
  protected readonly warningIcon = AlertTriangle;
  protected readonly closeIcon = X;

  protected dismiss(id: string): void {
    this._toastService.dismiss(id);
  }
}
