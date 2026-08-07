import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evxtzvcdimtdouhuktjw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2eHR6dmNkaW10ZG91aHVrdGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzE5NjgsImV4cCI6MjEwMTY0Nzk2OH0.MCdmQqdNzrpiVlZjhRChcZKxY4h-6JaANyQTd1Qh8ow';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
