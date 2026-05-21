import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
  Eye,
  EyeOff,
  LucideAngularModule,
  LucideIconData,
} from 'lucide-angular';

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'url'
  | 'number'
  | 'tel'
  | 'search';

let nextInputId = 0;

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  public readonly label = input<string | null>(null);
  public readonly type = input<InputType>('text');
  public readonly placeholder = input<string>('');
  public readonly helper = input<string | null>(null);
  public readonly errorText = input<string | null>(null);
  public readonly prefixIcon = input<LucideIconData | null>(null);
  public readonly autocomplete = input<string | null>(null);
  public readonly inputmode = input<
    'text' | 'email' | 'numeric' | 'tel' | 'url' | 'search' | 'decimal' | null
  >(null);
  public readonly inputId = input<string>(`app-input-${++nextInputId}`);
  public readonly required = input<boolean>(false);

  protected readonly eyeIcon = Eye;
  protected readonly eyeOffIcon = EyeOff;

  protected readonly value = signal('');
  protected readonly focused = signal(false);
  protected readonly internalDisabled = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly isPassword = computed(() => this.type() === 'password');
  protected readonly resolvedType = computed(() => {
    if (this.isPassword() && this.showPassword()) return 'text';
    return this.type();
  });

  protected readonly hasError = computed(
    () => this.errorText() !== null && this.errorText() !== '',
  );
  protected readonly hasPrefixIcon = computed(
    () => this.prefixIcon() !== null,
  );
  protected readonly helperId = computed(() => `${this.inputId()}-helper`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly describedBy = computed(() => {
    if (this.hasError()) return this.errorId();
    if (this.helper()) return this.helperId();
    return null;
  });

  private _onChange: (value: string) => void = () => {
    /* replaced by registerOnChange */
  };
  private _onTouched: () => void = () => {
    /* replaced by registerOnTouched */
  };

  public writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  public registerOnChange(fn: (value: string) => void): void {
    this._onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.internalDisabled.set(isDisabled);
  }

  protected handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this._onChange(target.value);
  }

  protected handleBlur(): void {
    this.focused.set(false);
    this._onTouched();
  }

  protected handleFocus(): void {
    this.focused.set(true);
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
