#include "process_monitor.h"
#include <sstream>
#include <algorithm>
#include <random>

#ifdef _WIN32
#include <windows.h>
#include <psapi.h>
#else
#include <dirent.h>
#include <fstream>
#include <unistd.h>
#endif

namespace ares {

ProcessMonitor::ProcessMonitor() {}
ProcessMonitor::~ProcessMonitor() {}

int ProcessMonitor::assign_sector_for_pid(int pid) {
    // Map PIDs deterministically into 5 Fictional Sector Zones
    // 1: Sector-1 (Islamabad Core)
    // 2: Sector-2 (Lahore Hub)
    // 3: Sector-3 (Karachi Coastal)
    // 4: Sector-4 (Peshawar Ridge)
    // 5: Sector-5 (Quetta Outpost)
    return 1 + (pid % 5);
}

std::string ProcessMonitor::get_sector_name(int sector_id) {
    switch (sector_id) {
        case 1: return "Sector-1 (Islamabad)";
        case 2: return "Sector-2 (Lahore)";
        case 3: return "Sector-3 (Karachi)";
        case 4: return "Sector-4 (Peshawar)";
        case 5: return "Sector-5 (Quetta)";
        default: return "Sector-1 (Islamabad)";
    }
}

std::vector<ProcessInfo> ProcessMonitor::get_active_processes() {
    std::vector<ProcessInfo> processes;

#ifdef _WIN32
    DWORD aProcesses[1024], cbNeeded, cProcesses;
    if (EnumProcesses(aProcesses, sizeof(aProcesses), &cbNeeded)) {
        cProcesses = cbNeeded / sizeof(DWORD);
        size_t count = 0;
        for (unsigned int i = 0; i < cProcesses && count < 25; i++) {
            if (aProcesses[i] != 0) {
                HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, aProcesses[i]);
                if (hProcess != NULL) {
                    HMODULE hMod;
                    DWORD cbNeededMod;
                    char szProcessName[MAX_PATH] = "<unknown>";
                    if (EnumProcessModules(hProcess, &hMod, sizeof(hMod), &cbNeededMod)) {
                        GetModuleBaseNameA(hProcess, hMod, szProcessName, sizeof(szProcessName) / sizeof(char));
                    }

                    PROCESS_MEMORY_COUNTERS pmc;
                    size_t mem_bytes = 1024 * 1024 * 15;
                    if (GetProcessMemoryInfo(hProcess, &pmc, sizeof(pmc))) {
                        mem_bytes = pmc.WorkingSetSize;
                    }

                    ProcessInfo p;
                    p.pid = (int)aProcesses[i];
                    p.ppid = 4; // Default System PPID
                    p.name = std::string(szProcessName);
                    p.state = (i % 7 == 0) ? "Sleeping" : "Running";
                    p.cpu_percent = 0.5 + (rand() % 150) / 10.0;
                    p.memory_bytes = mem_bytes;
                    p.memory_percent = (double)mem_bytes / (16.0 * 1024 * 1024 * 1024) * 100.0;
                    if (p.memory_percent < 0.1) p.memory_percent = 0.4 + (rand() % 20) / 10.0;
                    p.sector_id = assign_sector_for_pid(p.pid);

                    processes.push_back(p);
                    count++;
                    CloseHandle(hProcess);
                }
            }
        }
    }
#else
    // Linux /proc reading
    DIR* dir = opendir("/proc");
    if (dir) {
        struct dirent* entry;
        size_t count = 0;
        while ((entry = readdir(dir)) != NULL && count < 25) {
            if (entry->d_type == DT_DIR) {
                std::string dir_name(entry->d_name);
                if (std::all_of(dir_name.begin(), dir_name.end(), ::isdigit)) {
                    int pid = std::stoi(dir_name);
                    std::ifstream stat_file("/proc/" + dir_name + "/stat");
                    if (stat_file.is_open()) {
                        int p_pid, p_ppid;
                        std::string comm, state_char;
                        stat_file >> p_pid >> comm >> state_char >> p_ppid;

                        // Remove parentheses from process name
                        if (comm.size() >= 2 && comm.front() == '(' && comm.back() == ')') {
                            comm = comm.substr(1, comm.size() - 2);
                        }

                        ProcessInfo p;
                        p.pid = pid;
                        p.ppid = p_ppid;
                        p.name = comm;
                        p.state = (state_char == "S") ? "Sleeping" : (state_char == "R") ? "Running" : "Zombie";
                        p.cpu_percent = 0.5 + (rand() % 150) / 10.0;
                        p.memory_bytes = 1024 * 1024 * (10 + rand() % 200);
                        p.memory_percent = 0.5 + (rand() % 40) / 10.0;
                        p.sector_id = assign_sector_for_pid(pid);

                        processes.push_back(p);
                        count++;
                    }
                }
            }
        }
        closedir(dir);
    }
#endif

    // Fallback simulated processes if system process access is restricted
    if (processes.empty()) {
        const std::vector<std::string> sample_names = {
            "ares_core", "radar_recon", "sector_poller", "crypto_vault",
            "ipc_gate", "mem_allocator", "deadlock_sentinel", "viz_stream"
        };
        for (int i = 0; i < 12; i++) {
            ProcessInfo p;
            p.pid = 1000 + i * 47;
            p.ppid = (i == 0) ? 1 : 1000;
            p.name = sample_names[i % sample_names.size()];
            p.state = (i % 3 == 0) ? "Sleeping" : "Running";
            p.cpu_percent = 1.2 + (rand() % 120) / 10.0;
            p.memory_bytes = (15 + (rand() % 180)) * 1024 * 1024;
            p.memory_percent = 0.8 + (rand() % 35) / 10.0;
            p.sector_id = assign_sector_for_pid(p.pid);
            processes.push_back(p);
        }
    }

    return processes;
}

std::string ProcessMonitor::get_processes_json() {
    auto procs = get_active_processes();
    std::ostringstream ss;
    ss << "[";
    for (size_t i = 0; i < procs.size(); ++i) {
        const auto& p = procs[i];
        ss << "{"
           << "\"pid\":" << p.pid << ","
           << "\"ppid\":" << p.ppid << ","
           << "\"name\":\"" << p.name << "\","
           << "\"state\":\"" << p.state << "\","
           << "\"cpu\":" << p.cpu_percent << ","
           << "\"memory_mb\":" << (p.memory_bytes / (1024 * 1024)) << ","
           << "\"memory_percent\":" << p.memory_percent << ","
           << "\"sector_id\":" << p.sector_id << ","
           << "\"sector_name\":\"" << get_sector_name(p.sector_id) << "\""
           << "}";
        if (i + 1 < procs.size()) ss << ",";
    }
    ss << "]";
    return ss.str();
}

} // namespace ares
