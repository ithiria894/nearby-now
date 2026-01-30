import { Alert } from "react-native";

export function handleError(
  title: string,
  error: unknown,
  fallbackMessage = "Unknown error"
) {
  if (__DEV__) {
    console.error(error);
  }
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as any).message)
      : fallbackMessage;
  Alert.alert(title, message);
}
