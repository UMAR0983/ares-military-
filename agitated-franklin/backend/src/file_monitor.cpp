#include "file_monitor.h"
#include "sync_utils.h"
#include <sstream>
#include <iostream>
#include <algorithm>

namespace ares {

namespace fs = std::filesystem;

FileMonitor::FileMonitor(const std::string& watch_directory) : watch_path_(watch_directory) {
    if (fs::exists(watch_path_) && fs::is_directory(watch_path_)) {
        for (const auto& entry : fs::directory_iterator(watch_path_)) {
            if (entry.is_regular_file()) {
                file_snapshot_[entry.path().string()] = entry.last_write_time();
            }
        }
    }
}

FileMonitor::~FileMonitor() {}

std::vector<FileChangeEvent> FileMonitor::scan_for_changes() {
    std::vector<FileChangeEvent> new_events;
    std::map<std::string, fs::file_time_type> current_snapshot;

    if (fs::exists(watch_path_) && fs::is_directory(watch_path_)) {
        for (const auto& entry : fs::directory_iterator(watch_path_)) {
            if (entry.is_regular_file()) {
                std::string path_str = entry.path().filename().string();
                auto last_write = entry.last_write_time();
                current_snapshot[path_str] = last_write;

                auto it = file_snapshot_.find(path_str);
                if (it == file_snapshot_.end()) {
                    FileChangeEvent ev;
                    ev.file_path = path_str;
                    ev.action = "CREATE";
                    ev.timestamp = get_current_timestamp();
                    ev.sector_associated = "Sector-1 (Islamabad)";
                    ev.file_size = entry.file_size();
                    new_events.push_back(ev);
                } else if (it->second != last_write) {
                    FileChangeEvent ev;
                    ev.file_path = path_str;
                    ev.action = "MODIFY";
                    ev.timestamp = get_current_timestamp();
                    ev.sector_associated = "Sector-2 (Lahore)";
                    ev.file_size = entry.file_size();
                    new_events.push_back(ev);
                }
            }
        }

        for (const auto& [prev_path, _] : file_snapshot_) {
            if (current_snapshot.find(prev_path) == current_snapshot.end()) {
                FileChangeEvent ev;
                ev.file_path = prev_path;
                ev.action = "DELETE";
                ev.timestamp = get_current_timestamp();
                ev.sector_associated = "Sector-3 (Karachi)";
                ev.file_size = 0;
                new_events.push_back(ev);
            }
        }
        file_snapshot_ = current_snapshot;
    }

    // Generate occasional simulated file security events for demonstration if directory is static
    if (new_events.empty() && (rand() % 100 < 20)) {
        static const std::vector<std::string> demo_files = {
            "config_vault.json", "sector_keys.pem", "kernel_patch.bin",
            "access_log.audit", "payload_stream.tmp"
        };
        static const std::vector<std::string> actions = { "CREATE", "MODIFY", "DELETE" };
        static const std::vector<std::string> sectors = {
            "Sector-1 (Islamabad)", "Sector-2 (Lahore)", "Sector-3 (Karachi)",
            "Sector-4 (Peshawar)", "Sector-5 (Quetta)"
        };

        FileChangeEvent ev;
        ev.file_path = demo_files[rand() % demo_files.size()];
        ev.action = actions[rand() % actions.size()];
        ev.timestamp = get_current_timestamp();
        ev.sector_associated = sectors[rand() % sectors.size()];
        ev.file_size = 1024 * (1 + rand() % 500);
        new_events.push_back(ev);
    }

    for (const auto& ev : new_events) {
        recent_events_.push_back(ev);
        if (recent_events_.size() > 50) recent_events_.erase(recent_events_.begin());
    }

    return new_events;
}

std::string FileMonitor::get_file_events_json() {
    scan_for_changes();
    std::ostringstream ss;
    ss << "[";
    for (size_t i = 0; i < recent_events_.size(); ++i) {
        const auto& ev = recent_events_[i];
        ss << "{"
           << "\"file_path\":\"" << ev.file_path << "\","
           << "\"action\":\"" << ev.action << "\","
           << "\"timestamp\":\"" << ev.timestamp << "\","
           << "\"sector\":\"" << ev.sector_associated << "\","
           << "\"file_size\":" << ev.file_size
           << "}";
        if (i + 1 < recent_events_.size()) ss << ",";
    }
    ss << "]";
    return ss.str();
}

} // namespace ares
