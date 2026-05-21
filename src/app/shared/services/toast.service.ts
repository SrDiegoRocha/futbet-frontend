import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface IToast {
  id: string;
  type: ToastType;
  message: string;
}

const DEFAULT_DURATION_MS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  info: 4000,
  warning: 5000,
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<IToast[]>([]);
  private _nextId = 0;

  public readonly toasts = this._toasts.asReadonly();

  public success(message: string, durationMs?: number): void {
    this._show('success', message, durationMs ?? DEFAULT_DURATION_MS.success);
  }

  public error(message: string, durationMs?: number): void {
    this._show('error', message, durationMs ?? DEFAULT_DURATION_MS.error);
  }

  public info(message: string, durationMs?: number): void {
    this._show('info', message, durationMs ?? DEFAULT_DURATION_MS.info);
  }

  public warning(message: string, durationMs?: number): void {
    this._show('warning', message, durationMs ?? DEFAULT_DURATION_MS.warning);
  }

  public dismiss(id: string): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  public dismissAll(): void {
    this._toasts.set([]);
  }

  private _show(type: ToastType, message: string, durationMs: number): void {
    this._nextId += 1;
    const id = `toast-${this._nextId}`;
    const toast: IToast = { id, type, message };
    this._toasts.update((list) => [...list, toast]);

    if (durationMs > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }
}
