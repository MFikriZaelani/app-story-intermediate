import config from "../config.js";
const AUTH_KEY = "app_story_auth";

export function getAccessToken() {
  return getToken(); // Ambil dari struktur data sebenarnya
}


export function saveAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function getAuth() {
  const stored = localStorage.getItem(AUTH_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function removeAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
  const auth = getAuth();
  return !!auth && !!auth.loginResult && !!auth.loginResult.token;
}

export function getToken() {
  const auth = getAuth();
  return auth?.loginResult?.token || null;
}
