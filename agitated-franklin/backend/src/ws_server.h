#ifndef ARES_WS_SERVER_H
#define ARES_WS_SERVER_H

#include "sync_utils.h"
#include "process_monitor.h"
#include "cpu_monitor.h"
#include "memory_monitor.h"
#include "file_monitor.h"
#include "scheduler_sim.h"
#include "memory_sim.h"
#include "deadlock_detector.h"
#include "ipc_demo.h"
#include "attack_injector.h"
#include "cluster_manager.h"

#include <string>
#include <vector>
#include <thread>
#include <atomic>

namespace ares {

class WsServer {
private:
    int port_;
    std::atomic<bool> running_;
    std::thread server_thread_;

    ProcessMonitor proc_mon_;
    CpuMonitor cpu_mon_;
    MemoryMonitor mem_mon_;
    FileMonitor file_mon_;
    SchedulerSimulator scheduler_sim_;
    MemorySimulator memory_sim_;
    DeadlockDetector deadlock_det_;
    IpcDemo ipc_demo_;
    AttackInjector attack_inj_;
    ClusterManager cluster_mgr_;

public:
    explicit WsServer(int port = 8080);
    ~WsServer();

    void start();
    void stop();
    bool is_running() const { return running_; }

    std::string build_full_telemetry_json(bool inject_deadlock = false);

private:
    void run_server_loop();
    std::string handle_http_request(const std::string& request_str);
};

} // namespace ares

#endif // ARES_WS_SERVER_H
