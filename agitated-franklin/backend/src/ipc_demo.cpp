#include "ipc_demo.h"
#include <sstream>
#include <vector>
#include <chrono>
#include <iostream>

namespace ares {

IpcDemo::IpcDemo() : mutex_mode_enabled_(true), shared_counter_(0) {}
IpcDemo::~IpcDemo() {}

void IpcDemo::set_mutex_enabled(bool enabled) {
    mutex_mode_enabled_ = enabled;
}

bool IpcDemo::is_mutex_enabled() const {
    return mutex_mode_enabled_;
}

RaceConditionResult IpcDemo::run_race_condition_test(int num_threads, int increments_per_thread) {
    shared_counter_ = 0;
    bool use_mutex = mutex_mode_enabled_.load();

    auto start_time = std::chrono::high_resolution_clock::now();

    std::vector<std::thread> threads;
    for (int t = 0; t < num_threads; ++t) {
        threads.emplace_back([this, use_mutex, increments_per_thread]() {
            for (int i = 0; i < increments_per_thread; ++i) {
                if (use_mutex) {
                    std::lock_guard<std::mutex> lock(counter_mutex_);
                    shared_counter_++;
                } else {
                    // Unsafe concurrent access intentionally inducing race condition
                    int temp = shared_counter_;
                    std::this_thread::yield(); // Force thread context switch
                    shared_counter_ = temp + 1;
                }
            }
        });
    }

    for (auto& th : threads) {
        if (th.joinable()) th.join();
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    double duration_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();

    RaceConditionResult res;
    res.mutex_enabled = use_mutex;
    res.expected_value = num_threads * increments_per_thread;
    res.actual_value = shared_counter_;
    res.execution_time_ms = duration_ms;
    res.status = (res.actual_value == res.expected_value) ? "SAFE" : "RACE_CONDITION_DETECTED";

    return res;
}

std::string IpcDemo::get_ipc_status_json() {
    auto test_res = run_race_condition_test(5, 2000);

    std::ostringstream ss;
    ss << "{"
       << "\"named_pipe\":{"
       << "\"pipe_name\":\"/tmp/ares_cmd_pipe\","
       << "\"status\":\"ACTIVE_LISTENING\","
       << "\"messages_processed\":1482"
       << "},"
       << "\"shared_memory\":{"
       << "\"shm_segment\":\"/ares_shm_telemetry\","
       << "\"allocated_bytes\":65536,"
       << "\"mutex_protected\":" << (test_res.mutex_enabled ? "true" : "false")
       << "},"
       << "\"race_test_result\":{"
       << "\"mutex_enabled\":" << (test_res.mutex_enabled ? "true" : "false") << ","
       << "\"expected_count\":" << test_res.expected_value << ","
       << "\"actual_count\":" << test_res.actual_value << ","
       << "\"execution_time_ms\":" << test_res.execution_time_ms << ","
       << "\"status\":\"" << test_res.status << "\""
       << "}"
       << "}";
    return ss.str();
}

} // namespace ares
