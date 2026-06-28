import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ckwnxcajthzxtrk2easu.supabase.co'
const supabaseKey = 'sb_publishable_4Ojzo107rDK3VcugEmpngg_UUOsb3KL' // your publishable key

export const supabase = createClient(supabaseUrl, supabaseKey)