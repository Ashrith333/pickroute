import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { API_BASE_URL } from '../config';

// Get Supabase credentials from backend config or environment
// In production, these should come from your backend API
const SUPABASE_URL = __DEV__
  ? process.env.EXPO_PUBLIC_SUPABASE_URL || ''
  : process.env.EXPO_PUBLIC_SUPABASE_URL || '';

const SUPABASE_ANON_KEY = __DEV__
  ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
  : process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to get Supabase config from backend
export async function getSupabaseConfig() {
  try {
    const response = await fetch(`${API_BASE_URL}/app/config`);
    const config = await response.json();
    return {
      url: config.supabaseUrl,
      anonKey: config.supabaseAnonKey,
    };
  } catch (error) {
    console.error('Failed to get Supabase config from backend:', error);
    return null;
  }
}

