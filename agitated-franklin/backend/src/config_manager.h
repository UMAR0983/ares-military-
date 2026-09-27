#ifndef ARES_CONFIG_MANAGER_H
#define ARES_CONFIG_MANAGER_H

#include <string>
#include <mutex>

namespace ares {

struct SystemConfig {
    std::string app_name;
    std::string version;
    std::string environment;
    int server_port;
    int polling_interval_ms;

    // Supabase REST settings
    bool supabase_enabled;
    std::string supabase_url;
    std::string supabase_service_key;
    int supabase_auto_sync_interval_sec;
};

class ConfigManager {
private:
    static ConfigManager* instance_;
    static std::mutex mutex_;
    SystemConfig config_;

    ConfigManager();

public:
    ~ConfigManager();

    static ConfigManager& getInstance();

    bool load_config(const std::string& config_file_path = "config/ares_config.json");

    const SystemConfig& getConfig() const { return config_; }
};

} // namespace ares

#endif // ARES_CONFIG_MANAGER_H
