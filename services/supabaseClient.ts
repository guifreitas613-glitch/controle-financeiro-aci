import { createClient } from '@supabase/supabase-js';

// These variables should be configured in your application's environment.
// For Vite, environment variables must be prefixed with VITE_ to be exposed to the client.
// FIX: Switched from import.meta.env to process.env to resolve TypeScript type errors
// when Vite client types are not configured in tsconfig.json.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Initialize and export the Supabase client.
// We remove the hard check here to allow the app to load.
// The AuthProvider will handle the case where the client is not configured.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
