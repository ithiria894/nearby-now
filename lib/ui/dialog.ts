// Cross-platform dialogs. react-native-web does NOT implement Alert, so any
// Alert.alert(...) is a silent no-op on web — confirmations never appear and
// errors never surface. These helpers use the browser's window.confirm/alert
// on web and Alert.alert on native, so dialogs work everywhere.
import { Alert, Platform } from "react-native";

type ConfirmOptions = {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

/**
 * Ask the user to confirm. Resolves true if they confirm, false otherwise.
 * On web the button labels are the browser's own (OK / Cancel); the title +
 * message convey what's being confirmed. On native the labels are honored.
 */
export function confirmAsync(
  title: string,
  message?: string,
  opts: ConfirmOptions = {}
): Promise<boolean> {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(Boolean(globalThis.confirm?.(text)));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: opts.cancelText ?? "Cancel",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: opts.confirmText ?? "OK",
        style: opts.destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}

/** Show an informational / error message. Works on web and native. */
export function alertAsync(title: string, message?: string): void {
  if (Platform.OS === "web") {
    globalThis.alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
