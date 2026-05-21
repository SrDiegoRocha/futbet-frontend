import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  public readonly name = input<string | null | undefined>('');
  public readonly imageUrl = input<string | null | undefined>(null);
  public readonly size = input<number>(40);

  protected readonly initials = computed(() => {
    const raw = (this.name() ?? '').trim();
    if (!raw) return 'FB';
    const parts = raw.split(/\s+/).filter((p) => p.length > 0);
    const first = parts[0]?.charAt(0) ?? '';
    const last =
      parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
    const combined = (first + last) || 'FB';
    return combined.toUpperCase();
  });

  protected readonly sizePx = computed(() => `${this.size()}px`);
  protected readonly initialsFontPx = computed(
    () => `${Math.max(11, Math.round(this.size() * 0.4))}px`,
  );
}
