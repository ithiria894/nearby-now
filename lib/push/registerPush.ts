import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { backend } from "../backend";

// How a notification behaves when it arrives while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function getProjectId(): string | undefined {
  // EAS project id — required by getExpoPushTokenAsync in a build.
  return (
    (
      Constants.expoConfig?.extra as
        | { eas?: { projectId?: string } }
        | undefined
    )?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/**
 * Ask for notification permission, get this device's Expo push token, and store
 * it for the user. Returns the token, or null when unavailable (simulator, web,
 * or permission denied). Safe to call repeatedly — the token upsert is idempotent.
 */
export async function registerForPush(userId: string): Promise<string | null> {
  try {
    // Push tokens only exist on physical devices (not web / simulator).
    if (Platform.OS === "web" || !Device.isDevice) return null;

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = getProjectId();
    const tokenResp = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResp.data;
    if (token && userId) {
      await backend.push.upsertPushToken(userId, token, Platform.OS);
    }
    return token ?? null;
  } catch (e) {
    console.error("registerForPush failed:", e);
    return null;
  }
}
