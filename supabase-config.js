// Supabase Configuration
// TODO: Replace these with your actual Supabase project credentials
// Get these from: https://app.supabase.com/project/_/settings/api

const SUPABASE_CONFIG = {
    url: 'https://yknvgrydvxnkzycpjblv.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbnZncnlkdnhua3p5Y3BqYmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTMzMjIsImV4cCI6MjA3Njg4OTMyMn0.03anxGoZAh3qmZl18Uh1Bi0CJnJzW-07ql78TfSxYQY'
};

// Initialize Supabase client (this will be available globally)
let supabaseClient = null;

function initSupabase() {
    // Check if credentials are configured
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || 
        SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('⚠️ Supabase not configured - running in demo mode');
        console.log('📝 To enable cloud storage, follow the setup guide in SUPABASE_SETUP.md');
        return null;
    }

    // Check if Supabase library is loaded
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase library not loaded');
        return null;
    }

    // Initialize Supabase client
    try {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase client initialized successfully');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return null;
    }
}

