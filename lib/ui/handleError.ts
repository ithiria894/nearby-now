import { alertAsync } from "./dialog";

export function handleError(
  title: string,
  error: unknown,
  fallbackMessage = "Unknown error"
) {
  console.error(`[${title}]`, error);
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as any).message)
      : fallbackMessage;
  alertAsync(title, message);
}
