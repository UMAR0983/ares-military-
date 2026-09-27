#include "memory_sim.h"
#include <algorithm>
#include <sstream>
#include <unordered_set>
#include <map>
#include <deque>
#include <iostream>

namespace ares {

MemorySimulator::MemorySimulator() {}
MemorySimulator::~MemorySimulator() {}

std::vector<int> MemorySimulator::get_default_reference_string() {
    return { 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1 };
}

MemorySimResult MemorySimulator::run_fifo(const std::vector<int>& pages, int num_frames) {
    MemorySimResult res;
    res.algorithm = "FIFO (First-In First-Out)";
    res.num_frames = num_frames;
    res.total_requests = static_cast<int>(pages.size());
    res.page_faults = 0;
    res.page_hits = 0;

    std::vector<int> frames;
    std::deque<int> fifo_queue;

    for (int p : pages) {
        bool hit = false;
        if (std::find(frames.begin(), frames.end(), p) != frames.end()) {
            hit = true;
            res.page_hits++;
        } else {
            res.page_faults++;
            if (static_cast<int>(frames.size()) < num_frames) {
                frames.push_back(p);
                fifo_queue.push_back(p);
            } else {
                int victim = fifo_queue.front();
                fifo_queue.pop_front();
                auto it = std::find(frames.begin(), frames.end(), victim);
                if (it != frames.end()) {
                    *it = p;
                }
                fifo_queue.push_back(p);
            }
        }
        res.timeline.push_back({p, !hit, frames});
    }

    res.hit_ratio = (res.total_requests > 0) ? ((double)res.page_hits / res.total_requests) * 100.0 : 0.0;
    return res;
}

MemorySimResult MemorySimulator::run_lru(const std::vector<int>& pages, int num_frames) {
    MemorySimResult res;
    res.algorithm = "LRU (Least Recently Used)";
    res.num_frames = num_frames;
    res.total_requests = static_cast<int>(pages.size());
    res.page_faults = 0;
    res.page_hits = 0;

    std::vector<int> frames;
    std::map<int, int> last_used;

    for (int time = 0; time < static_cast<int>(pages.size()); ++time) {
        int p = pages[time];
        bool hit = false;

        if (std::find(frames.begin(), frames.end(), p) != frames.end()) {
            hit = true;
            res.page_hits++;
        } else {
            res.page_faults++;
            if (static_cast<int>(frames.size()) < num_frames) {
                frames.push_back(p);
            } else {
                int victim = -1;
                int min_time = 1e9;
                for (int f : frames) {
                    if (last_used[f] < min_time) {
                        min_time = last_used[f];
                        victim = f;
                    }
                }
                auto it = std::find(frames.begin(), frames.end(), victim);
                if (it != frames.end()) {
                    *it = p;
                }
            }
        }
        last_used[p] = time;
        res.timeline.push_back({p, !hit, frames});
    }

    res.hit_ratio = (res.total_requests > 0) ? ((double)res.page_hits / res.total_requests) * 100.0 : 0.0;
    return res;
}

MemorySimResult MemorySimulator::run_optimal(const std::vector<int>& pages, int num_frames) {
    MemorySimResult res;
    res.algorithm = "Optimal Page Replacement";
    res.num_frames = num_frames;
    res.total_requests = static_cast<int>(pages.size());
    res.page_faults = 0;
    res.page_hits = 0;

    std::vector<int> frames;

    for (size_t i = 0; i < pages.size(); ++i) {
        int p = pages[i];
        bool hit = false;

        if (std::find(frames.begin(), frames.end(), p) != frames.end()) {
            hit = true;
            res.page_hits++;
        } else {
            res.page_faults++;
            if (static_cast<int>(frames.size()) < num_frames) {
                frames.push_back(p);
            } else {
                int victim_idx = -1;
                int farthest = -1;

                for (size_t f = 0; f < frames.size(); ++f) {
                    int next_use = 1e9;
                    for (size_t j = i + 1; j < pages.size(); ++j) {
                        if (pages[j] == frames[f]) {
                            next_use = static_cast<int>(j);
                            break;
                        }
                    }
                    if (next_use > farthest) {
                        farthest = next_use;
                        victim_idx = static_cast<int>(f);
                    }
                }
                frames[victim_idx] = p;
            }
        }
        res.timeline.push_back({p, !hit, frames});
    }

    res.hit_ratio = (res.total_requests > 0) ? ((double)res.page_hits / res.total_requests) * 100.0 : 0.0;
    return res;
}

static std::string result_to_json(const MemorySimResult& r) {
    std::ostringstream ss;
    ss << "{"
       << "\"algorithm\":\"" << r.algorithm << "\","
       << "\"num_frames\":" << r.num_frames << ","
       << "\"total_requests\":" << r.total_requests << ","
       << "\"page_faults\":" << r.page_faults << ","
       << "\"page_hits\":" << r.page_hits << ","
       << "\"hit_ratio\":" << r.hit_ratio << ","
       << "\"timeline\":[";
    for (size_t i = 0; i < r.timeline.size(); ++i) {
        const auto& step = r.timeline[i];
        ss << "{"
           << "\"page\":" << step.page_requested << ","
           << "\"fault\":" << (step.is_page_fault ? "true" : "false") << ","
           << "\"frames\":[";
        for (size_t f = 0; f < step.frame_state.size(); ++f) {
            ss << step.frame_state[f];
            if (f + 1 < step.frame_state.size()) ss << ",";
        }
        ss << "]}";
        if (i + 1 < r.timeline.size()) ss << ",";
    }
    ss << "]}";
    return ss.str();
}

std::string MemorySimulator::run_all_simulations_json(const std::vector<int>& reference_string, int num_frames) {
    auto refs = reference_string.empty() ? get_default_reference_string() : reference_string;

    auto fifo = run_fifo(refs, num_frames);
    auto lru = run_lru(refs, num_frames);
    auto opt = run_optimal(refs, num_frames);

    std::ostringstream ss;
    ss << "{"
       << "\"fifo\":" << result_to_json(fifo) << ","
       << "\"lru\":" << result_to_json(lru) << ","
       << "\"optimal\":" << result_to_json(opt)
       << "}";
    return ss.str();
}

} // namespace ares
