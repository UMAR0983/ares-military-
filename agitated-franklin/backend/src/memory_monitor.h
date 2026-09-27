#ifndef ARES_MEMORY_MONITOR_H
#define ARES_MEMORY_MONITOR_H

#include <string>

namespace ares {

struct MemoryStats {
    size_t total_bytes;
    size_t used_bytes;
    size_t free_bytes;
    double memory_percent;
    size_t swap_total_bytes;
    size_t swap_used_bytes;
};

class MemoryMonitor {
public:
    MemoryMonitor();
    ~MemoryMonitor();

    MemoryStats get_memory_stats();
    std::string get_memory_json();
};

} // namespace ares

#endif // ARES_MEMORY_MONITOR_H
