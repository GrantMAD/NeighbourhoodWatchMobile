import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import fetch from 'cross-fetch'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch },
  realtime: { enabled: false }  // 👈 disables `ws` dependency
})
