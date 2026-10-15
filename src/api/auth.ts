import * as SecureStore from "expo-secure-store";

import { API_BASE_URL, API_TIMEOUT_MS } from "./config";

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  business_id: number;
}

export interface PermittedLocation {
  location_id: number;
  name: string;
  address: string;
  mobile: string;
  gst_no: string | null;
}

export interface LoginSuccess {
  token: string;
  user: AuthUser;
  locations: PermittedLocation[];
  message: string;
}

interface LoginApiRaw {
  status?: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
  permitted_locations?: PermittedLocation[];
}

export async function loginRequest(
  username: string,
  password: string,
): Promise<LoginSuccess> {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) throw new Error("Please enter your username.");
  if (!password) throw new Error("Please enter your password.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: normalizedUsername,
        password,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Login timed out. Check your connection and retry.");
    }
    throw new Error(
      "Could not reach the server. Check your internet connection.",
    );
  } finally {
    clearTimeout(timer);
  }

  let data: LoginApiRaw | null = null;
  try {
    data = (await res.json()) as LoginApiRaw;
  } catch {
    throw new Error(`Login failed (server returned ${res.status}).`);
  }

  if (!res.ok || data?.status === false) {
    throw new Error(data?.message || `Login failed (${res.status}).`);
  }

  if (!data?.token || !data?.user) {
    throw new Error(data?.message || "Login failed: invalid server response.");
  }

  return {
    token: data.token,
    user: data.user,
    locations: data.permitted_locations ?? [],
    message: data.message || "Login success",
  };
}

const TOKEN_KEY = "zuzu_auth_token";
const PROFILE_KEY = "zuzu_auth_profile";

export interface StoredAuth {
  token: string;
  user: AuthUser;
  locations: PermittedLocation[];
}

interface StoredProfile {
  user: AuthUser;
  locations: PermittedLocation[];
}

export async function saveAuth(session: StoredAuth): Promise<void> {
  const profile: StoredProfile = {
    user: session.user,
    locations: session.locations,
  };
  // Best-effort persist: SecureStore is unavailable on web, where the
  // session simply lives in memory until the page is reloaded.
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, session.token);
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn("Could not persist auth session", e);
  }
}

export async function loadAuth(): Promise<StoredAuth | null> {
  try {
    const [token, rawProfile] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(PROFILE_KEY),
    ]);
    if (!token || !rawProfile) return null;
    const parsed = JSON.parse(rawProfile) as Partial<StoredProfile>;
    if (!parsed.user) return null;
    return {
      token,
      user: parsed.user,
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
    };
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Missing key or platform error — treat as logged out.
  }
  try {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
  } catch {
    // Missing key or platform error — treat as logged out.
  }
}

/** Authenticated JSON fetch — adds `Authorization: Bearer <token>`. */
export async function authFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}
