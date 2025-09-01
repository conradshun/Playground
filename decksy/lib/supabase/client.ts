import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables in client:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
    })
    throw new Error("Missing required Supabase environment variables. Please check your .env.local file.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
