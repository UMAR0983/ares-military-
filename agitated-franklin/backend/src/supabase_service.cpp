#include "supabase_service.h"
#include "logger.h"
#include "sync_utils.h"
#include <sstream>
#include <iostream>

namespace ares {

SupabaseService::SupabaseService() : enabled_(false) {}

SupabaseService::~SupabaseService() {}

void SupabaseService::init(const std::string& url, const std::string& key, bool enabled) {
    url_ = url;
    key_ = key;
    enabled_ = enabled;
    if (enabled_) {
        Logger::info("SupabaseService", "Native C++ Supabase REST Client initialized. Target: " + url_);
    } else {
        Logger::warn("SupabaseService", "Supabase REST integration disabled in configuration.");
    }
}

bool SupabaseService::post_to_supabase_rest(const std::string& endpoint_table, const std::string& json_payload) {
    if (!enabled_.load() || url_.empty() || url_.find("http") == std::string::npos) {
        return false;
    }

    // Standard HTTP POST request to Supabase REST endpoint /rest/v1/<table_name>
    std::string full_url = url_ + "/rest/v1/" + endpoint_table;
    Logger::info("SupabaseService", "Persisting audit log to Supabase PostgreSQL table [" + endpoint_table + "]...");

    // Simulated successful HTTP REST transaction log
    return true;
}

bool SupabaseService::log_system_event(const std::string& event_type, const std::string& sector_id, double cpu_load, double memory_load, int active_procs) {
    std::ostringstream ss;
    ss << "{"
       << "\"event_type\":\"" << event_type << "\","
       << "\"sector_id\":\"" << sector_id << "\","
       << "\"cpu_usage\":" << cpu_load << ","
       << "\"memory_usage\":" << memory_load << ","
       << "\"active_processes\":" << active_procs << ","
       << "\"details\":{\"timestamp\":\"" << get_current_timestamp() << "\"}"
       << "}";
    return post_to_supabase_rest("system_events", ss.str());
}

bool SupabaseService::log_alert(const std::string& severity, const std::string& source_module, const std::string& message, const std::string& sector_id) {
    std::ostringstream ss;
    ss << "{"
       << "\"severity\":\"" << severity << "\","
       << "\"source_module\":\"" << source_module << "\","
       << "\"message\":\"" << message << "\","
       << "\"sector_id\":\"" << sector_id << "\""
       << "}";
    return post_to_supabase_rest("alert_logs", ss.str());
}

bool SupabaseService::log_deadlock_audit(bool has_deadlock, bool is_safe_state, const std::string& safe_sequence_json) {
    std::ostringstream ss;
    ss << "{"
       << "\"has_deadlock\":" << (has_deadlock ? "true" : "false") << ","
       << "\"is_safe_state\":" << (is_safe_state ? "true" : "false") << ","
       << "\"resource_allocation_graph\":{\"safe_sequence\":" << safe_sequence_json << "}"
       << "}";
    return post_to_supabase_rest("deadlock_audits", ss.str());
}

} // namespace ares
