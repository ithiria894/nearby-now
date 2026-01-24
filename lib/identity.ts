// lib/identity.ts
import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabase";

const DEVICE_ID_KEY = "device_id_v1";

// :zap: CHANGE 1: Ensure we have a stable device_id across app launches
async function getOrCreateDeviceId(): Promise<string> {
  if (Platform.OS === "web") {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const created = Crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  }

  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const created = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  return created;
}

// :zap: CHANGE 2: Actually create/read the DB user row and return users.id (uuid)
export async function getOrCreateUserId(): Promise<string> {
  const deviceId = await getOrCreateDeviceId();

  // Upsert by unique device_id, then fetch the user id
  const { data, error } = await supabase
    .from("users")
    .upsert({ device_id: deviceId }, { onConflict: "device_id" })
    .select("id")
    .single();

  if (error) {
    // This log helps you see if it's RLS / permission / network etc.
    console.error("getOrCreateUserId failed:", {
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    throw error;
  }

  return data.id;
}
