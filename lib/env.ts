const requiredPublicEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

const requiredServerEnv = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

function readEnv(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const env = {
  supabaseUrl: readEnv(requiredPublicEnv[0]),
  supabasePublishableKey: readEnv(requiredPublicEnv[1]),
  supabaseServiceRoleKey: readEnv(requiredServerEnv[0]),
  adminEmail: "admin@northernstar.com",
};
