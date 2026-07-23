// Konfigurimi Kryesor i Supabase
const SUPABASE_URL = 'https://zvqesypyijgtuqefmsqf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cWVzeXB5aWpndHVxZWZtc3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MzUzODUsImV4cCI6MjA1NDExMTM4NX0.4C26CvhS4P84g60L3yT6u_YJIs4yJb2s2k9_Wk6YJpE';

// Sigurohemi që SDK e Supabase është ngarkuar nga CDN
if (typeof supabase === 'undefined' && window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else if (typeof supabase !== 'undefined' && supabase.createClient) {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error('Kujdes: Supabase SDK nuk u gjet! Sigurohu që ke vendosur script-in CDN te HTML.');
}

// Global variable për lehtësi përdorimi
const db = window.supabaseClient;