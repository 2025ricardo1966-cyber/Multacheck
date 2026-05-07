import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yfriwbbkpirlgmfngtuq.supabase.co";
const supabaseKey = "sb_publishable_rKJ0Fu578YlEgxdnQD1-7A_C6vPsiGZ";

export const supabase = createClient(supabaseUrl, supabaseKey);