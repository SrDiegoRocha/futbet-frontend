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

let nextColorPickerId = 0;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

@Component({
  selector: 'app-color-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true,
    },
  ],
})
export class ColorPickerComponent implements ControlValueAccessor {
  public readonly label = input<string | null>(null);
  public readonly errorText = input<string | null>(null);
  public readonly helper = input<string | null>(null);
  public readonly required = input<boolean>(false);
  public readonly inputId = input<string>(
    `app-color-picker-${++nextColorPickerId}`,
  );

  protected readonly value = signal('#000000');
  protected readonly internalDisabled = signal(false);

  protected readonly hasError = computed(
    () => this.errorText() !== null && this.errorText() !== '',
  );

  protected readonly normalizedColor = computed(() => {
    const v = this.value();
    return HEX_REGEX.test(v) ? v : '#000000';
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

  protected onPickerInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value.toUpperCase();
    this.value.set(next);
    this._onChange(next);
  }

  protected onTextInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    this.value.set(normalized);
    this._onChange(normalized);
  }

  protected onBlur(): void {
    this._onTouched();
  }
}
