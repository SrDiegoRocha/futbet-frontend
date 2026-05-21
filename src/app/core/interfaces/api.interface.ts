export interface IApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: IFieldError[] | null;
}

export interface IFieldError {
  field: string;
  message: string;
}

export interface IPageSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface IPageable {
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
  sort: IPageSort;
}

export interface IPage<T> {
  content: T[];
  number: number;
  size: number;
  numberOfElements: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  pageable: IPageable;
  sort: IPageSort;
}

export interface IPageParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}
