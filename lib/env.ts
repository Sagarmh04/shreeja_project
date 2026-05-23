const PLACEHOLDER_PREFIX = "__REPLACE_ME_";

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function isPlaceholder(value: string) {
  return value.length === 0 || value.startsWith(PLACEHOLDER_PREFIX);
}

export function requireServerEnv(name: string) {
  const value = readEnv(name);
  if (isPlaceholder(value)) {
    throw new Error(
      `${name} is not configured. Update .env.local and replace the __REPLACE_ME__ placeholder.`,
    );
  }

  return value;
}

export const env = {
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseAnonKey: readEnv("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  databaseUrl: readEnv("DATABASE_URL"),
  adminEmails: readEnv("ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
};

export function hasSupabaseClientEnv() {
  return (
    !isPlaceholder(env.supabaseUrl) &&
    !isPlaceholder(env.supabasePublishableKey)
  );
}

export function hasDatabaseEnv() {
  return !isPlaceholder(env.databaseUrl);
}

export function hasServiceRoleEnv() {
  return !isPlaceholder(env.supabaseServiceRoleKey);
}
