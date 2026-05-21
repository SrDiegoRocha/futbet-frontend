import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthState } from '@core/auth/auth-state';
import { AuthService } from '@core/services/auth.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { ThemeMode, ThemeService } from '@shared/services/theme.service';
import { LogOut, LucideAngularModule, Monitor, Moon, Sun } from 'lucide-angular';

@Component({
  selector: 'app-app-bar',
  standalone: true,
  imports: [LogoComponent, AvatarComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-bar.component.html',
  styleUrl: './app-bar.component.scss',
})
export class AppBarComponent {
  private readonly _authState = inject(AuthState);
  private readonly _authService = inject(AuthService);
  private readonly _themeService = inject(ThemeService);
  private readonly _router = inject(Router);

  protected readonly user = this._authState.user;
  protected readonly themeMode = this._themeService.mode;
  protected readonly menuOpen = signal(false);

  protected readonly sunIcon = Sun;
  protected readonly moonIcon = Moon;
  protected readonly monitorIcon = Monitor;
  protected readonly logOutIcon = LogOut;

  protected readonly userName = computed(() => this.user()?.name ?? '');
  protected readonly userEmail = computed(() => this.user()?.email ?? '');
  protected readonly userAvatar = computed(() => this.user()?.avatarUrl ?? null);

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected setTheme(mode: ThemeMode): void {
    this._themeService.setMode(mode);
  }

  protected signOut(): void {
    this._authService.signOut();
    this.closeMenu();
    void this._router.navigate(['/auth/signin']);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    }
  }
}
