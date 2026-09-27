#ifndef ARES_MEMORY_SIM_H
#define ARES_MEMORY_SIM_H

#include <vector>
#include <string>

namespace ares {

struct PageStep {
    int page_requested;
    bool is_page_fault;
    std::vector<int> frame_state;
};

struct MemorySimResult {
    std::string algorithm;
    int num_frames;
    int total_requests;
    int page_faults;
    int page_hits;
    double hit_ratio;
    std::vector<PageStep> timeline;
};

class MemorySimulator {
public:
    MemorySimulator();
    ~MemorySimulator();

    // FIFO Page Replacement
    MemorySimResult run_fifo(const std::vector<int>& pages, int num_frames);

    // LRU Page Replacement
    MemorySimResult run_lru(const std::vector<int>& pages, int num_frames);

    // Optimal Page Replacement
    MemorySimResult run_optimal(const std::vector<int>& pages, int num_frames);

    // Run all and return JSON summary
    std::string run_all_simulations_json(const std::vector<int>& reference_string, int num_frames = 4);

    static std::vector<int> get_default_reference_string();
};

} // namespace ares

#endif // ARES_MEMORY_SIM_H
