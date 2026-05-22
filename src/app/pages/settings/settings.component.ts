import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthState } from '@core/auth/auth-state';
import { AuthService } from '@core/services/auth.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ThemeMode, ThemeService } from '@shared/services/theme.service';
import {
  LogOut,
  LucideAngularModule,
  Monitor,
  Moon,
  Sun,
  User,
} from 'lucide-angular';

interface IThemeOption {
  mode: ThemeMode;
  label: string;
  description: string;
  iconKey: 'sun' | 'moon' | 'monitor';
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    AvatarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly _themeService = inject(ThemeService);
  private readonly _authService = inject(AuthService);
  private readonly _authState = inject(AuthState);
  private readonly _router = inject(Router);

  protected readonly themeMode = this._themeService.mode;
  protected readonly user = this._authState.user;

  protected readonly sunIcon = Sun;
  protected readonly moonIcon = Moon;
  protected readonly monitorIcon = Monitor;
  protected readonly userIcon = User;
  protected readonly logOutIcon = LogOut;

  protected readonly themeOptions: readonly IThemeOption[] = [
    {
      mode: 'light',
      label: 'Claro',
      description: 'Tema sempre claro.',
      iconKey: 'sun',
    },
    {
      mode: 'dark',
      label: 'Escuro',
      description: 'Tema sempre escuro.',
      iconKey: 'moon',
    },
    {
      mode: 'system',
      label: 'Sistema',
      description: 'Segue a preferência do dispositivo.',
      iconKey: 'monitor',
    },
  ];

  protected readonly userName = computed(() => this.user()?.name ?? '');
  protected readonly userEmail = computed(() => this.user()?.email ?? '');
  protected readonly userAvatar = computed(() => this.user()?.avatarUrl ?? null);
  protected readonly userRoleLabel = computed(() => {
    const role = this.user()?.role;
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'USER') return 'Usuário';
    return role ?? '';
  });

  protected readonly memberSinceLabel = computed(() => {
    const iso = this.user()?.createdAt;
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return '';
    }
  });

  protected setTheme(mode: ThemeMode): void {
    this._themeService.setMode(mode);
  }

  protected iconFor(iconKey: IThemeOption['iconKey']) {
    switch (iconKey) {
      case 'sun':
        return this.sunIcon;
      case 'moon':
        return this.moonIcon;
      case 'monitor':
        return this.monitorIcon;
    }
  }

  protected signOut(): void {
    this._authService.signOut();
    void this._router.navigate(['/auth/signin']);
  }
}
