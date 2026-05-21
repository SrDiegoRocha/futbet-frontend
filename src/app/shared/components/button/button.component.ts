import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'brand-outline';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  public readonly variant = input<ButtonVariant>('primary');
  public readonly size = input<ButtonSize>('md');
  public readonly type = input<ButtonType>('button');
  public readonly disabled = input<boolean>(false);
  public readonly loading = input<boolean>(false);
  public readonly fullWidth = input<boolean>(false);
  public readonly ariaLabel = input<string | null>(null);

  public readonly buttonClick = output<MouseEvent>();

  protected readonly isInactive = computed(
    () => this.disabled() || this.loading(),
  );

  protected readonly cssClasses = computed(() => {
    const classes = [
      'btn',
      `btn--${this.variant()}`,
      `btn--${this.size()}`,
    ];
    if (this.fullWidth()) classes.push('btn--full');
    if (this.loading()) classes.push('btn--loading');
    return classes.join(' ');
  });

  protected handleClick(event: MouseEvent): void {
    if (this.isInactive()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.buttonClick.emit(event);
  }
}
