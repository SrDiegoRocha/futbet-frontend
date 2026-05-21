import { HttpErrorResponse } from '@angular/common/http';
import {
  IApiError,
  IFieldError,
} from '@core/interfaces/api.interface';

export class ApiException extends Error {
  public readonly status: number;
  public readonly apiError: IApiError | null;
  public readonly fieldErrors: IFieldError[];
  public override readonly cause: HttpErrorResponse;

  constructor(response: HttpErrorResponse) {
    const apiError = isApiError(response.error) ? response.error : null;
    const message =
      apiError?.message ?? response.message ?? `HTTP ${response.status}`;
    super(message);
    this.name = 'ApiException';
    this.status = response.status;
    this.apiError = apiError;
    this.fieldErrors = apiError?.fieldErrors ?? [];
    this.cause = response;
  }

  public get isValidationError(): boolean {
    return this.status === 400;
  }

  public get isUnauthorized(): boolean {
    return this.status === 401;
  }

  public get isForbidden(): boolean {
    return this.status === 403;
  }

  public get isNotFound(): boolean {
    return this.status === 404;
  }

  public get isConflict(): boolean {
    return this.status === 409;
  }

  public fieldError(field: string): string | null {
    return this.fieldErrors.find((f) => f.field === field)?.message ?? null;
  }
}

function isApiError(value: unknown): value is IApiError {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['status'] === 'number' &&
    typeof obj['message'] === 'string' &&
    typeof obj['path'] === 'string'
  );
}
