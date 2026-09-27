#ifndef ARES_PROCESS_MONITOR_H
#define ARES_PROCESS_MONITOR_H

#include "sync_utils.h"
#include <vector>
#include <map>

namespace ares {

class ProcessMonitor {
public:
    ProcessMonitor();
    ~ProcessMonitor();

    // Collect list of processes currently active on the system (or simulated cluster)
    std::vector<ProcessInfo> get_active_processes();

    // Format processes as JSON string for WebSocket telemetry broadcast
    std::string get_processes_json();

    // Map a PID to one of 5 fictional Pakistan Sectors
    static int assign_sector_for_pid(int pid);
    static std::string get_sector_name(int sector_id);
};

} // namespace ares

#endif // ARES_PROCESS_MONITOR_H
