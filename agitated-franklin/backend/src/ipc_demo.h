#ifndef ARES_IPC_DEMO_H
#define ARES_IPC_DEMO_H

#include <string>
#include <mutex>
#include <thread>
#include <atomic>

namespace ares {

struct RaceConditionResult {
    bool mutex_enabled;
    int expected_value;
    int actual_value;
    double execution_time_ms;
    std::string status; // "SAFE" or "RACE_CONDITION_DETECTED"
};

class IpcDemo {
private:
    std::atomic<bool> mutex_mode_enabled_;
    int shared_counter_;
    std::mutex counter_mutex_;

public:
    IpcDemo();
    ~IpcDemo();

    void set_mutex_enabled(bool enabled);
    bool is_mutex_enabled() const;

    // Run race condition simulation with N threads updating shared memory
    RaceConditionResult run_race_condition_test(int num_threads = 10, int increments_per_thread = 5000);

    // Named Pipe simulation output JSON
    std::string get_ipc_status_json();
};

} // namespace ares

#endif // ARES_IPC_DEMO_H
