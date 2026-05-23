"use client";

import { createBrowserClient } from "@supabase/ssr";

import { env, hasSupabaseClientEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseClientEnv()) {
    throw new Error(
      "Supabase client environment variables are not configured. Update .env.local placeholders first.",
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      env.supabaseUrl,
      env.supabasePublishableKey,
    );
  }

  return browserClient;
}
