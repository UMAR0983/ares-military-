#include "sync_utils.h"
#include "logger.h"
#include "config_manager.h"
#include "supabase_service.h"
#include "ws_server.h"
#include "process_monitor.h"
#include "cpu_monitor.h"
#include "memory_monitor.h"
#include "file_monitor.h"
#include "scheduler_sim.h"
#include "memory_sim.h"
#include "deadlock_detector.h"
#include "ipc_demo.h"

#include <iostream>
#include <thread>
#include <chrono>
#include <csignal>

using namespace ares;

static std::atomic<bool> g_keep_running(true);

void signal_handler(int signum) {
    Logger::warn("System", "Termination signal received (" + std::to_string(signum) + "). Initiating safe shutdown...");
    g_keep_running = false;
}

int main(int argc, char* argv[]) {
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    // Initialize Logger & Config
    Logger::getInstance().init("ares_system.log", true);

    Logger::info("Main", "=================================================================");
    Logger::info("Main", "  ARES — Advanced Reconnaissance and Event Security System  ");
    Logger::info("Main", "  Enterprise OS Reconnaissance Engine v2.4.0 (TACTICAL EDITION)   ");
    Logger::info("Main", "=================================================================");

    ConfigManager::getInstance().load_config("config/ares_config.json");
    const auto& config = ConfigManager::getInstance().getConfig();

    // Native C++ Supabase Service Integration
    SupabaseService supabase_service;
    supabase_service.init(config.supabase_url, config.supabase_service_key, config.supabase_enabled);

    Logger::info("Main", "[Layer 1: Reconnaissance Unit] Starting Process, CPU, Memory & File Monitors...");
    ProcessMonitor proc_mon;
    CpuMonitor cpu_mon;
    MemoryMonitor mem_mon;
    FileMonitor file_mon(".");

    Logger::info("Main", "[Layer 2: Tactical Analysis Unit] Loading OS Simulators & Deadlock Engine...");
    SchedulerSimulator scheduler_sim;
    MemorySimulator memory_sim;
    DeadlockDetector deadlock_det;
    IpcDemo ipc_demo;

    int server_port = config.server_port;
    if (argc > 1) {
        server_port = std::atoi(argv[1]);
    }

    Logger::info("Main", "[Layer 3: Command Coordination Unit] Starting Telemetry Server on Port " + std::to_string(server_port) + "...");
    WsServer server(server_port);
    server.start();

    Logger::info("Main", "[Layer 4: Command Center Ready] Launch frontend/index.html to view Tactical Command Dashboard.");

    // Background thread for periodic reconnaissance logging & native Supabase audit persistence
    std::thread recon_thread([&]() {
        int cycle_count = 0;
        while (g_keep_running) {
            auto total_cpu = cpu_mon.get_total_cpu_load();
            auto mem_stats = mem_mon.get_memory_stats();
            auto procs = proc_mon.get_active_processes();

            std::ostringstream msg;
            msg << "CPU Load: " << total_cpu << "% | Memory Used: "
                << (double)mem_stats.used_bytes / (1024 * 1024 * 1024) << " GB ("
                << mem_stats.memory_percent << "%) | Active Daemons: " << procs.size();
            Logger::info("ReconCycle", msg.str());

            // Persist periodic audit log to Supabase PostgreSQL table natively via C++
            if (cycle_count % 3 == 0) {
                supabase_service.log_system_event("TELEMETRY_SNAPSHOT", "Sector-1 (Islamabad)", total_cpu, mem_stats.memory_percent, (int)procs.size());
            }

            cycle_count++;
            std::this_thread::sleep_for(std::chrono::seconds(4));
        }
    });

    while (g_keep_running) {
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
    }

    if (recon_thread.joinable()) {
        recon_thread.join();
    }
    server.stop();

    Logger::info("Main", "[ARES Core Engine] Clean shutdown complete.");
    return 0;
}
