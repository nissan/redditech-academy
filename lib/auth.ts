// lib/auth.ts
// Stub for future auth implementation.
// Currently returns null for all users (no auth).
// When auth is added, implement these functions to check session/JWT.

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: "google" | "email";
  courseAccess: Record<string, string[]>; // courseSlug → unlockedModuleIds
}

export async function getUser(): Promise<User | null> {
  // TODO: implement when auth is added
  return null;
}

export async function signIn(provider: "google" | "email"): Promise<void> {
  // TODO: implement with NextAuth.js or similar
  throw new Error("Auth not yet implemented");
}

export async function signOut(): Promise<void> {
  // TODO: implement
  throw new Error("Auth not yet implemented");
}
