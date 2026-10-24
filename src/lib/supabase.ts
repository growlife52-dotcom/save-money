import 'server-only';
import { createClient } from '@supabase/supabase-js';
export function database() {
 const url = process.env.SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (Boolean(url) !== Boolean(key)) throw new Error('SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 함께 설정해 주세요.');
 return url && key ? createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}) : null;
}
