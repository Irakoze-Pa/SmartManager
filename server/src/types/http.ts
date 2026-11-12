export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
}

