#include "attack_injector.h"
#include "logger.h"
#include "sync_utils.h"
#include <sstream>
#include <iostream>
#include <algorithm>

namespace ares {

AttackInjector::AttackInjector() {}
AttackInjector::~AttackInjector() {}

AttackPayload AttackInjector::inject_attack(const std::string& attack_type, const std::string& target_cluster, const std::string& injected_by) {
    std::lock_guard<std::mutex> lock(mutex_);

    static int attack_counter = 101;
    AttackPayload attack;
    attack.attack_id = "ATK-" + std::to_string(attack_counter++);
    attack.attack_type = attack_type.empty() ? "SYN_FLOOD_ATTACK" : attack_type;
    attack.target_cluster = target_cluster.empty() ? "SEC-01-ISB" : target_cluster;
    attack.severity = (attack.attack_type == "DEADLOCK_LOCKUP" || attack.attack_type == "SYN_FLOOD_ATTACK") ? "EMERGENCY" : "CRITICAL";
    attack.injected_by = injected_by;
    attack.timestamp = get_current_timestamp();
    attack.status = "ACTIVE_THREAT";

    active_attacks_.push_back(attack);
    Logger::critical("AttackInjector", "ATTACK INJECTED BY " + injected_by + ": " + attack.attack_type + " target [" + attack.target_cluster + "]");

    // Automatically generate formal incident report and dispatch team
    generate_incident_report(attack, "TEAM-01");

    return attack;
}

bool AttackInjector::mitigate_attack(const std::string& attack_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& atk : active_attacks_) {
        if (atk.attack_id == attack_id && atk.status == "ACTIVE_THREAT") {
            atk.status = "MITIGATED";
            Logger::info("AttackInjector", "Attack " + attack_id + " mitigated successfully by Tactical Team.");
            return true;
        }
    }
    return false;
}

IncidentReportData AttackInjector::generate_incident_report(const AttackPayload& attack, const std::string& dispatched_team_id) {
    static int report_counter = 501;
    IncidentReportData rpt;
    rpt.report_id = "RPT-" + std::to_string(report_counter++);
    rpt.attack_id = attack.attack_id;
    rpt.target_cluster = attack.target_cluster;
    rpt.dispatched_team_id = dispatched_team_id;
    rpt.cpu_snapshot = 88.5 + (rand() % 10);
    rpt.memory_snapshot = 92.4;
    rpt.generated_at = get_current_timestamp();

    if (attack.attack_type == "SYN_FLOOD_ATTACK") {
        rpt.summary = "High-volume SYN Packet Flood detected on cluster network interface. Socket buffer exhaustion observed.";
        rpt.mitigation_steps = "1. Enable iptables rate limiting.\n2. Reconfigure kernel TCP SYN cookies.\n3. Isolate affected network segment.";
    } else if (attack.attack_type == "DEADLOCK_LOCKUP") {
        rpt.summary = "Resource Allocation Graph (RAG) cyclic dependency detected between Process P1 and Resource R2. System threads deadlocked.";
        rpt.mitigation_steps = "1. Preempt resource R2 allocation.\n2. Terminate deadlocked thread PID 1104.\n3. Execute Banker's Algorithm safe sequence.";
    } else {
        rpt.summary = "Severe CPU starvation and memory page corruption anomaly detected on target cluster daemons.";
        rpt.mitigation_steps = "1. Flush dirty memory pages.\n2. Restart affected OS daemon workers.\n3. Restore clean configuration image.";
    }

    generated_reports_.push_back(rpt);
    return rpt;
}

std::string AttackInjector::get_active_attacks_json() {
    std::lock_guard<std::mutex> lock(mutex_);
    std::ostringstream ss;
    ss << "[";
    for (size_t i = 0; i < active_attacks_.size(); ++i) {
        const auto& a = active_attacks_[i];
        ss << "{"
           << "\"attack_id\":\"" << a.attack_id << "\","
           << "\"attack_type\":\"" << a.attack_type << "\","
           << "\"target_cluster\":\"" << a.target_cluster << "\","
           << "\"severity\":\"" << a.severity << "\","
           << "\"injected_by\":\"" << a.injected_by << "\","
           << "\"timestamp\":\"" << a.timestamp << "\","
           << "\"status\":\"" << a.status << "\""
           << "}";
        if (i + 1 < active_attacks_.size()) ss << ",";
    }
    ss << "]";
    return ss.str();
}

std::string AttackInjector::get_incident_reports_json() {
    std::lock_guard<std::mutex> lock(mutex_);
    std::ostringstream ss;
    ss << "[";
    for (size_t i = 0; i < generated_reports_.size(); ++i) {
        const auto& r = generated_reports_[i];
        ss << "{"
           << "\"report_id\":\"" << r.report_id << "\","
           << "\"attack_id\":\"" << r.attack_id << "\","
           << "\"target_cluster\":\"" << r.target_cluster << "\","
           << "\"summary\":\"" << r.summary << "\","
           << "\"dispatched_team_id\":\"" << r.dispatched_team_id << "\","
           << "\"cpu_snapshot\":" << r.cpu_snapshot << ","
           << "\"memory_snapshot\":" << r.memory_snapshot << ","
           << "\"generated_at\":\"" << r.generated_at << "\","
           << "\"mitigation_steps\":\"" << r.mitigation_steps << "\""
           << "}";
        if (i + 1 < generated_reports_.size()) ss << ",";
    }
    ss << "]";
    return ss.str();
}

} // namespace ares
