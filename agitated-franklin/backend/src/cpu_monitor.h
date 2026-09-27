#ifndef ARES_CPU_MONITOR_H
#define ARES_CPU_MONITOR_H

#include <vector>
#include <string>

namespace ares {

struct CoreMetric {
    int core_id;
    double load_percent;
};

struct SectorLoad {
    int sector_id;
    std::string sector_name;
    double cpu_load;
    double memory_load;
    int process_count;
    std::string alert_status; // "NORMAL", "ELEVATED", "CRITICAL"
};

class CpuMonitor {
private:
    double previous_total_time_;
    double previous_idle_time_;

public:
    CpuMonitor();
    ~CpuMonitor();

    // Get current total CPU load percentage
    double get_total_cpu_load();

    // Get per-core CPU load percentages
    std::vector<CoreMetric> get_core_metrics();

    // Calculate dynamic load metrics for each of the 5 Pakistan Sector Zones
    std::vector<SectorLoad> get_sector_loads();

    // Format sector loads as JSON for WebSocket payload
    std::string get_sector_loads_json();
};

} // namespace ares

#endif // ARES_CPU_MONITOR_H
