import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LogoComponent } from '@shared/components/logo/logo.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  public readonly title = input<string>('');
  public readonly subtitle = input<string>('');
  public readonly logoSize = input<number>(48);
}
