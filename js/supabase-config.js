// KONFIGURIMI QENDROR I SUPABASE PER HERSTORY.AL
const SUPABASE_URL = "https://zbxpfsgbsqewxcdxxxxn.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_ToMihS0cqQI67NKCRIQ6Sw_ucnjuPs4";

// Krijimi i klientit global
if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}