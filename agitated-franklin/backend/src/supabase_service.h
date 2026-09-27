#ifndef ARES_SUPABASE_SERVICE_H
#define ARES_SUPABASE_SERVICE_H

#include <string>
#include <mutex>
#include <thread>
#include <atomic>

namespace ares {

class SupabaseService {
private:
    std::string url_;
    std::string key_;
    std::atomic<bool> enabled_;

public:
    SupabaseService();
    ~SupabaseService();

    void init(const std::string& url, const std::string& key, bool enabled = true);

    // Push system telemetry snapshot to Supabase PostgreSQL table system_events
    bool log_system_event(const std::string& event_type, const std::string& sector_id, double cpu_load, double memory_load, int active_procs);

    // Push security / deadlock alert to Supabase alert_logs table
    bool log_alert(const std::string& severity, const std::string& source_module, const std::string& message, const std::string& sector_id);

    // Push deadlock audit report to Supabase deadlock_audits table
    bool log_deadlock_audit(bool has_deadlock, bool is_safe_state, const std::string& safe_sequence_json);

private:
    bool post_to_supabase_rest(const std::string& endpoint_table, const std::string& json_payload);
};

} // namespace ares

#endif // ARES_SUPABASE_SERVICE_H
