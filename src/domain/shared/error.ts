export interface ProblemFieldErrors {
  [fieldName: string]: string;
}

export interface ApiProblemError {
  type?: string;
  title: string;
  status: number;
  detail: string;
  fields?: ProblemFieldErrors;
  request_id?: string;
}

export function isApiProblemError(error: unknown): error is ApiProblemError {
  return (
    typeof error === "object" &&
    error !== null &&
    "title" in error &&
    "status" in error &&
    typeof (error as ApiProblemError).status === "number"
  );
}

export function formatErrorMessage(error: unknown, fallback: string): string {
  if (isApiProblemError(error)) {
    if (error.fields && Object.keys(error.fields).length > 0) {
      const fieldList = Object.entries(error.fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      return `${error.detail || error.title} (${fieldList})`;
    }
    return error.detail || error.title;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
