#include "config_manager.h"
#include "logger.h"
#include <fstream>
#include <sstream>
#include <iostream>

namespace ares {

ConfigManager* ConfigManager::instance_ = nullptr;
std::mutex ConfigManager::mutex_;

ConfigManager::ConfigManager() {
    // Default fallback values
    config_.app_name = "ARES Military-Grade OS Reconnaissance & Security System";
    config_.version = "2.4.0-ENTERPRISE";
    config_.environment = "TACTICAL_SIMULATION";
    config_.server_port = 8080;
    config_.polling_interval_ms = 2000;
    config_.supabase_enabled = true;
    config_.supabase_url = "https://your-project.supabase.co";
    config_.supabase_service_key = "YOUR_SUPABASE_SERVICE_KEY";
    config_.supabase_auto_sync_interval_sec = 10;
}

ConfigManager::~ConfigManager() {}

ConfigManager& ConfigManager::getInstance() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (instance_ == nullptr) {
        instance_ = new ConfigManager();
    }
    return *instance_;
}

static std::string extract_json_value(const std::string& json, const std::string& key) {
    size_t key_pos = json.find("\"" + key + "\"");
    if (key_pos == std::string::npos) return "";

    size_t colon_pos = json.find(":", key_pos);
    if (colon_pos == std::string::npos) return "";

    size_t val_start = json.find_first_not_of(" \t\n\r", colon_pos + 1);
    if (val_start == std::string::npos) return "";

    if (json[val_start] == '"') {
        size_t val_end = json.find('"', val_start + 1);
        if (val_end != std::string::npos) {
            return json.substr(val_start + 1, val_end - val_start - 1);
        }
    } else {
        size_t val_end = json.find_first_of(",}\n\r", val_start);
        if (val_end != std::string::npos) {
            return json.substr(val_start, val_end - val_start);
        }
    }
    return "";
}

bool ConfigManager::load_config(const std::string& config_file_path) {
    std::lock_guard<std::mutex> lock(mutex_);
    std::ifstream file(config_file_path);
    if (!file.is_open()) {
        // Try fallback parent path
        file.open("../" + config_file_path);
    }

    if (!file.is_open()) {
        Logger::warn("ConfigManager", "Could not open config file: " + config_file_path + ". Using enterprise defaults.");
        return false;
    }

    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string json = buffer.str();

    std::string port_str = extract_json_value(json, "server_port");
    if (!port_str.empty()) config_.server_port = std::stoi(port_str);

    std::string url = extract_json_value(json, "supabase_url");
    if (!url.empty()) config_.supabase_url = url;

    std::string key = extract_json_value(json, "supabase_service_key");
    if (!key.empty()) config_.supabase_service_key = key;

    Logger::info("ConfigManager", "Configuration loaded successfully from " + config_file_path);
    return true;
}

} // namespace ares
