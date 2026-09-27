#ifndef ARES_SYNC_UTILS_H
#define ARES_SYNC_UTILS_H

#include <iostream>
#include <string>
#include <vector>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <chrono>
#include <memory>
#include <sstream>

namespace ares {

// Struct representing process information
struct ProcessInfo {
    int pid;
    int ppid;
    std::string name;
    std::string state; // "Running", "Sleeping", "Zombie", "Stopped"
    double cpu_percent;
    double memory_percent;
    size_t memory_bytes;
    int sector_id; // 1: Islamabad, 2: Lahore, 3: Karachi, 4: Peshawar, 5: Quetta
};

// Telemetry event for WebSocket broadcast
struct TelemetryEvent {
    std::string event_type; // "SYSTEM_METRICS", "PROCESS_LIST", "ALERT", "DEADLOCK_REPORT", "SCHEDULER_REPORT", "MEMORY_SIM_REPORT", "IPC_EVENT"
    std::string timestamp;
    std::string payload_json;
};

// Thread-safe Producer-Consumer Queue guarded by mutex and condition variable
template <typename T>
class ThreadSafeQueue {
private:
    std::queue<T> queue_;
    mutable std::mutex mutex_;
    std::condition_variable cv_;
    size_t max_size_;

public:
    explicit ThreadSafeQueue(size_t max_size = 1000) : max_size_(max_size) {}

    void push(T item) {
        std::unique_lock<std::mutex> lock(mutex_);
        if (queue_.size() >= max_size_) {
            queue_.pop(); // Drop oldest if full
        }
        queue_.push(std::move(item));
        lock.unlock();
        cv_.notify_one();
    }

    bool pop(T& item, std::chrono::milliseconds timeout = std::chrono::milliseconds(100)) {
        std::unique_lock<std::mutex> lock(mutex_);
        if (!cv_.wait_for(lock, timeout, [this] { return !queue_.empty(); })) {
            return false;
        }
        item = std::move(queue_.front());
        queue_.pop();
        return true;
    }

    bool empty() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return queue_.empty();
    }

    size_t size() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return queue_.size();
    }
};

// Utility to get ISO 8601 Timestamp
inline std::string get_current_timestamp() {
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    struct tm buf;
#ifdef _WIN32
    localtime_s(&buf, &in_time_t);
#else
    localtime_r(&in_time_t, &buf);
#endif
    char str_buf[64];
    std::strftime(str_buf, sizeof(str_buf), "%Y-%m-%dT%H:%M:%SZ", &buf);
    return std::string(str_buf);
}

} // namespace ares

#endif // ARES_SYNC_UTILS_H
