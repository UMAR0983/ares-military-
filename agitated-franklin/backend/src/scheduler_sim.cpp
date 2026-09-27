#include "scheduler_sim.h"
#include <algorithm>
#include <sstream>
#include <queue>
#include <iostream>

namespace ares {

SchedulerSimulator::SchedulerSimulator() {}
SchedulerSimulator::~SchedulerSimulator() {}

std::vector<SimProcess> SchedulerSimulator::get_default_sample_processes() {
    return {
        {101, "P1 (Recon)", 0, 8, 3, 8, -1, 0, 0, 0, -1},
        {102, "P2 (Decryption)", 1, 4, 1, 4, -1, 0, 0, 0, -1},
        {103, "P3 (Telemetry)", 2, 9, 4, 9, -1, 0, 0, 0, -1},
        {104, "P4 (RadarScan)", 3, 5, 2, 5, -1, 0, 0, 0, -1},
        {105, "P5 (AlertGate)", 4, 2, 5, 2, -1, 0, 0, 0, -1}
    };
}

SchedulingResult SchedulerSimulator::run_fcfs(std::vector<SimProcess> processes) {
    SchedulingResult res;
    res.algorithm = "FCFS (First-Come First-Served)";
    res.quantum = 0;

    std::sort(processes.begin(), processes.end(), [](const SimProcess& a, const SimProcess& b) {
        return a.arrival_time < b.arrival_time;
    });

    int current_time = 0;
    double total_wt = 0, total_tat = 0, total_rt = 0;

    for (auto& p : processes) {
        if (current_time < p.arrival_time) {
            current_time = p.arrival_time;
        }
        p.start_time = current_time;
        p.response_time = p.start_time - p.arrival_time;
        p.completion_time = current_time + p.burst_time;
        p.turnaround_time = p.completion_time - p.arrival_time;
        p.waiting_time = p.turnaround_time - p.burst_time;

        res.gantt_chart.push_back({p.pid, p.name, p.start_time, p.completion_time});
        current_time = p.completion_time;

        total_wt += p.waiting_time;
        total_tat += p.turnaround_time;
        total_rt += p.response_time;
    }

    size_t n = processes.size();
    res.avg_waiting_time = n > 0 ? total_wt / n : 0;
    res.avg_turnaround_time = n > 0 ? total_tat / n : 0;
    res.avg_response_time = n > 0 ? total_rt / n : 0;
    res.process_results = processes;

    return res;
}

SchedulingResult SchedulerSimulator::run_sjf(std::vector<SimProcess> processes) {
    SchedulingResult res;
    res.algorithm = "SJF (Shortest Job First - Non-Preemptive)";
    res.quantum = 0;

    int current_time = 0;
    int completed = 0;
    int n = static_cast<int>(processes.size());
    std::vector<bool> is_completed(n, false);
    double total_wt = 0, total_tat = 0, total_rt = 0;

    while (completed < n) {
        int idx = -1;
        int min_burst = 1e9;

        for (int i = 0; i < n; ++i) {
            if (processes[i].arrival_time <= current_time && !is_completed[i]) {
                if (processes[i].burst_time < min_burst) {
                    min_burst = processes[i].burst_time;
                    idx = i;
                }
            }
        }

        if (idx == -1) {
            current_time++;
            continue;
        }

        auto& p = processes[idx];
        p.start_time = current_time;
        p.response_time = p.start_time - p.arrival_time;
        p.completion_time = current_time + p.burst_time;
        p.turnaround_time = p.completion_time - p.arrival_time;
        p.waiting_time = p.turnaround_time - p.burst_time;

        res.gantt_chart.push_back({p.pid, p.name, p.start_time, p.completion_time});
        current_time = p.completion_time;
        is_completed[idx] = true;
        completed++;

        total_wt += p.waiting_time;
        total_tat += p.turnaround_time;
        total_rt += p.response_time;
    }

    res.avg_waiting_time = n > 0 ? total_wt / n : 0;
    res.avg_turnaround_time = n > 0 ? total_tat / n : 0;
    res.avg_response_time = n > 0 ? total_rt / n : 0;
    res.process_results = processes;

    return res;
}

SchedulingResult SchedulerSimulator::run_priority(std::vector<SimProcess> processes) {
    SchedulingResult res;
    res.algorithm = "Priority Scheduling (Non-Preemptive)";
    res.quantum = 0;

    int current_time = 0;
    int completed = 0;
    int n = static_cast<int>(processes.size());
    std::vector<bool> is_completed(n, false);
    double total_wt = 0, total_tat = 0, total_rt = 0;

    while (completed < n) {
        int idx = -1;
        int highest_priority = 1e9;

        for (int i = 0; i < n; ++i) {
            if (processes[i].arrival_time <= current_time && !is_completed[i]) {
                if (processes[i].priority < highest_priority) {
                    highest_priority = processes[i].priority;
                    idx = i;
                }
            }
        }

        if (idx == -1) {
            current_time++;
            continue;
        }

        auto& p = processes[idx];
        p.start_time = current_time;
        p.response_time = p.start_time - p.arrival_time;
        p.completion_time = current_time + p.burst_time;
        p.turnaround_time = p.completion_time - p.arrival_time;
        p.waiting_time = p.turnaround_time - p.burst_time;

        res.gantt_chart.push_back({p.pid, p.name, p.start_time, p.completion_time});
        current_time = p.completion_time;
        is_completed[idx] = true;
        completed++;

        total_wt += p.waiting_time;
        total_tat += p.turnaround_time;
        total_rt += p.response_time;
    }

    res.avg_waiting_time = n > 0 ? total_wt / n : 0;
    res.avg_turnaround_time = n > 0 ? total_tat / n : 0;
    res.avg_response_time = n > 0 ? total_rt / n : 0;
    res.process_results = processes;

    return res;
}

SchedulingResult SchedulerSimulator::run_round_robin(std::vector<SimProcess> processes, int quantum) {
    SchedulingResult res;
    res.algorithm = "Round-Robin";
    res.quantum = quantum;

    int n = static_cast<int>(processes.size());
    for (auto& p : processes) {
        p.remaining_time = p.burst_time;
        p.start_time = -1;
    }

    std::sort(processes.begin(), processes.end(), [](const SimProcess& a, const SimProcess& b) {
        return a.arrival_time < b.arrival_time;
    });

    int current_time = 0;
    int completed = 0;
    std::queue<int> q;
    std::vector<bool> in_queue(n, false);

    // Push initial arrived processes
    for (int i = 0; i < n; ++i) {
        if (processes[i].arrival_time <= current_time) {
            q.push(i);
            in_queue[i] = true;
        }
    }

    while (completed < n) {
        if (q.empty()) {
            current_time++;
            for (int i = 0; i < n; ++i) {
                if (processes[i].arrival_time <= current_time && processes[i].remaining_time > 0 && !in_queue[i]) {
                    q.push(i);
                    in_queue[i] = true;
                }
            }
            continue;
        }

        int idx = q.front();
        q.pop();
        auto& p = processes[idx];

        if (p.start_time == -1) {
            p.start_time = current_time;
            p.response_time = p.start_time - p.arrival_time;
        }

        int exec_time = std::min(quantum, p.remaining_time);
        int seg_start = current_time;
        current_time += exec_time;
        p.remaining_time -= exec_time;

        res.gantt_chart.push_back({p.pid, p.name, seg_start, current_time});

        // Add newly arrived processes during this time frame
        for (int i = 0; i < n; ++i) {
            if (i != idx && processes[i].arrival_time <= current_time && processes[i].remaining_time > 0 && !in_queue[i]) {
                q.push(i);
                in_queue[i] = true;
            }
        }

        if (p.remaining_time > 0) {
            q.push(idx); // Re-queue
        } else {
            p.completion_time = current_time;
            p.turnaround_time = p.completion_time - p.arrival_time;
            p.waiting_time = p.turnaround_time - p.burst_time;
            completed++;
        }
    }

    double total_wt = 0, total_tat = 0, total_rt = 0;
    for (const auto& p : processes) {
        total_wt += p.waiting_time;
        total_tat += p.turnaround_time;
        total_rt += p.response_time;
    }

    res.avg_waiting_time = n > 0 ? total_wt / n : 0;
    res.avg_turnaround_time = n > 0 ? total_tat / n : 0;
    res.avg_response_time = n > 0 ? total_rt / n : 0;
    res.process_results = processes;

    return res;
}

static std::string result_to_json(const SchedulingResult& r) {
    std::ostringstream ss;
    ss << "{"
       << "\"algorithm\":\"" << r.algorithm << "\","
       << "\"quantum\":" << r.quantum << ","
       << "\"avg_waiting_time\":" << r.avg_waiting_time << ","
       << "\"avg_turnaround_time\":" << r.avg_turnaround_time << ","
       << "\"avg_response_time\":" << r.avg_response_time << ","
       << "\"processes\":[";
    for (size_t i = 0; i < r.process_results.size(); ++i) {
        const auto& p = r.process_results[i];
        ss << "{"
           << "\"pid\":" << p.pid << ","
           << "\"name\":\"" << p.name << "\","
           << "\"arrival_time\":" << p.arrival_time << ","
           << "\"burst_time\":" << p.burst_time << ","
           << "\"priority\":" << p.priority << ","
           << "\"start_time\":" << p.start_time << ","
           << "\"completion_time\":" << p.completion_time << ","
           << "\"waiting_time\":" << p.waiting_time << ","
           << "\"turnaround_time\":" << p.turnaround_time << ","
           << "\"response_time\":" << p.response_time
           << "}";
        if (i + 1 < r.process_results.size()) ss << ",";
    }
    ss << "],\"gantt_chart\":[";
    for (size_t i = 0; i < r.gantt_chart.size(); ++i) {
        const auto& g = r.gantt_chart[i];
        ss << "{"
           << "\"pid\":" << g.pid << ","
           << "\"name\":\"" << g.name << "\","
           << "\"start_time\":" << g.start_time << ","
           << "\"end_time\":" << g.end_time
           << "}";
        if (i + 1 < r.gantt_chart.size()) ss << ",";
    }
    ss << "]}";
    return ss.str();
}

std::string SchedulerSimulator::run_all_simulations_json(std::vector<SimProcess> input_processes, int rr_quantum) {
    if (input_processes.empty()) input_processes = get_default_sample_processes();

    auto fcfs = run_fcfs(input_processes);
    auto sjf = run_sjf(input_processes);
    auto prio = run_priority(input_processes);
    auto rr = run_round_robin(input_processes, rr_quantum);

    std::ostringstream ss;
    ss << "{"
       << "\"fcfs\":" << result_to_json(fcfs) << ","
       << "\"sjf\":" << result_to_json(sjf) << ","
       << "\"priority\":" << result_to_json(prio) << ","
       << "\"round_robin\":" << result_to_json(rr)
       << "}";
    return ss.str();
}

} // namespace ares
