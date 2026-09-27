#ifndef ARES_ATTACK_INJECTOR_H
#define ARES_ATTACK_INJECTOR_H

#include <string>
#include <vector>
#include <mutex>

namespace ares {

struct AttackPayload {
    std::string attack_id;
    std::string attack_type; // e.g., 'SYN_FLOOD_ATTACK', 'DEADLOCK_LOCKUP', 'CPU_EXHAUSTION'
    std::string target_cluster;
    std::string severity; // "CRITICAL", "EMERGENCY"
    std::string injected_by;
    std::string timestamp;
    std::string status; // "ACTIVE_THREAT", "MITIGATED"
};

struct IncidentReportData {
    std::string report_id;
    std::string attack_id;
    std::string target_cluster;
    std::string summary;
    std::string dispatched_team_id;
    double cpu_snapshot;
    double memory_snapshot;
    std::string generated_at;
    std::string mitigation_steps;
};

class AttackInjector {
private:
    std::vector<AttackPayload> active_attacks_;
    std::vector<IncidentReportData> generated_reports_;
    std::mutex mutex_;

public:
    AttackInjector();
    ~AttackInjector();

    // Inject simulated attack against target cluster
    AttackPayload inject_attack(const std::string& attack_type, const std::string& target_cluster, const std::string& injected_by = "ADMIN_COMMANDER");

    // Mitigate active attack
    bool mitigate_attack(const std::string& attack_id);

    // Generate formal Security Incident & OS Audit Report
    IncidentReportData generate_incident_report(const AttackPayload& attack, const std::string& dispatched_team_id = "TEAM-01");

    // Get active attacks JSON
    std::string get_active_attacks_json();

    // Get generated incident reports JSON
    std::string get_incident_reports_json();
};

} // namespace ares

#endif // ARES_ATTACK_INJECTOR_H
