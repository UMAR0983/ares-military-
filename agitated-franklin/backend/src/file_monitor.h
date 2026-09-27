#ifndef ARES_FILE_MONITOR_H
#define ARES_FILE_MONITOR_H

#include <string>
#include <vector>
#include <map>
#include <filesystem>

namespace ares {

struct FileChangeEvent {
    std::string file_path;
    std::string action; // "CREATE", "MODIFY", "DELETE", "RENAME"
    std::string timestamp;
    std::string sector_associated;
    size_t file_size;
};

class FileMonitor {
private:
    std::string watch_path_;
    std::map<std::string, std::filesystem::file_time_type> file_snapshot_;
    std::vector<FileChangeEvent> recent_events_;

public:
    explicit FileMonitor(const std::string& watch_directory = ".");
    ~FileMonitor();

    // Scan target directory and detect file changes
    std::vector<FileChangeEvent> scan_for_changes();

    // Get recent file security log events formatted as JSON
    std::string get_file_events_json();
};

} // namespace ares

#endif // ARES_FILE_MONITOR_H
