#ifndef ARES_LOGGER_H
#define ARES_LOGGER_H

#include <string>
#include <mutex>
#include <fstream>
#include <iostream>

namespace ares {

enum class LogLevel {
    INFO_LEVEL,
    WARN_LEVEL,
    ERROR_LEVEL,
    CRITICAL_LEVEL
};

class Logger {
private:
    static Logger* instance_;
    static std::mutex mutex_;
    std::ofstream log_file_;
    bool console_enabled_;

    Logger();

public:
    ~Logger();

    static Logger& getInstance();

    void init(const std::string& filename = "ares_system.log", bool console = true);

    void log(LogLevel level, const std::string& module_name, const std::string& message);

    static void info(const std::string& module_name, const std::string& message) {
        getInstance().log(LogLevel::INFO_LEVEL, module_name, message);
    }

    static void warn(const std::string& module_name, const std::string& message) {
        getInstance().log(LogLevel::WARN_LEVEL, module_name, message);
    }

    static void error(const std::string& module_name, const std::string& message) {
        getInstance().log(LogLevel::ERROR_LEVEL, module_name, message);
    }

    static void critical(const std::string& module_name, const std::string& message) {
        getInstance().log(LogLevel::CRITICAL_LEVEL, module_name, message);
    }
};

} // namespace ares

#endif // ARES_LOGGER_H
