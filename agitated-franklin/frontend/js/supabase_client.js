/* =====================================================================
   ARES — Supabase Cloud Database Client Integration
   ===================================================================== */

class AresSupabaseClient {
    constructor() {
        this.supabaseUrl = localStorage.getItem('ARES_SUPABASE_URL') || '';
        this.supabaseKey = localStorage.getItem('ARES_SUPABASE_KEY') || '';
        this.client = null;
        this.isConnected = false;

        this.init();
    }

    init() {
        if (this.supabaseUrl && this.supabaseKey && window.supabase) {
            try {
                this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
                this.isConnected = true;
                console.log("[ARES Supabase] Client initialized successfully.");
            } catch (err) {
                console.error("[ARES Supabase] Init error:", err);
                this.isConnected = false;
            }
        }
    }

    setCredentials(url, key) {
        this.supabaseUrl = url;
        this.supabaseKey = key;
        localStorage.setItem('ARES_SUPABASE_URL', url);
        localStorage.setItem('ARES_SUPABASE_KEY', key);
        this.init();
    }

    async logSystemEvent(eventType, sectorId, cpuUsage, memUsage, details = {}) {
        if (!this.client) return { error: "Supabase not connected" };

        try {
            const { data, error } = await this.client
                .from('system_events')
                .insert([{
                    event_type: eventType,
                    sector_id: sectorId,
                    cpu_usage: cpuUsage,
                    memory_usage: memUsage,
                    details: details
                }]);
            return { data, error };
        } catch (err) {
            return { error: err.message };
        }
    }

    async fetchRecentAlerts(limit = 20) {
        if (!this.client) return [];

        try {
            const { data, error } = await this.client
                .from('alert_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error("[ARES Supabase] Error fetching alerts:", err);
            return [];
        }
    }
}
