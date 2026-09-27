#include "logger.h"
#include "sync_utils.h"

namespace ares {

Logger* Logger::instance_ = nullptr;
std::mutex Logger::mutex_;

Logger::Logger() : console_enabled_(true) {}

Logger::~Logger() {
    if (log_file_.is_open()) {
        log_file_.close();
    }
}

Logger& Logger::getInstance() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (instance_ == nullptr) {
        instance_ = new Logger();
    }
    return *instance_;
}

void Logger::init(const std::string& filename, bool console) {
    std::lock_guard<std::mutex> lock(mutex_);
    console_enabled_ = console;
    if (!log_file_.is_open()) {
        log_file_.open(filename, std::ios::app);
        if (log_file_.is_open()) {
            log_file_ << "\n--- ARES SYSTEM LOG SESSION STARTED AT " << get_current_timestamp() << " ---\n";
        }
    }
}

void Logger::log(LogLevel level, const std::string& module_name, const std::string& message) {
    std::lock_guard<std::mutex> lock(mutex_);
    std::string timestamp = get_current_timestamp();
    std::string level_str;
    std::string color_code = "";
    std::string reset_code = "";

#ifdef _WIN32
    // Plain output for Windows console or standard ansi if supported
#else
    reset_code = "\033[0m";
#endif

    switch (level) {
        case LogLevel::INFO_LEVEL:
            level_str = "INFO";
            color_code = "\033[36m"; // Cyan
            break;
        case LogLevel::WARN_LEVEL:
            level_str = "WARN";
            color_code = "\033[33m"; // Yellow
            break;
        case LogLevel::ERROR_LEVEL:
            level_str = "ERROR";
            color_code = "\033[31m"; // Red
            break;
        case LogLevel::CRITICAL_LEVEL:
            level_str = "CRITICAL";
            color_code = "\033[41;37m"; // White on Red
            break;
    }

    std::string formatted = "[" + timestamp + "] [" + level_str + "] [" + module_name + "] " + message;

    if (console_enabled_) {
        std::cout << color_code << formatted << reset_code << std::endl;
    }

    if (log_file_.is_open()) {
        log_file_ << formatted << "\n";
        log_file_.flush();
    }
}

} // namespace ares
