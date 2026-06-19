import { ApiError } from "../api/client";

/** User-facing message for failed AI generation API calls. */
export function aiGenerateErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 404) {
      return "API endpoint not found. Restart the backend (npm run backend) to load the latest routes.";
    }
    if (err.status < 500) {
      return err.message || fallback;
    }
  }
  return fallback;
}
