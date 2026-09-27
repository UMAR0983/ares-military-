#ifndef ARES_SCHEDULER_SIM_H
#define ARES_SCHEDULER_SIM_H

#include <vector>
#include <string>

namespace ares {

struct SimProcess {
    int pid;
    std::string name;
    int arrival_time;
    int burst_time;
    int priority; // Lower number = higher priority
    int remaining_time;

    // Output stats
    int start_time;
    int completion_time;
    int waiting_time;
    int turnaround_time;
    int response_time;
};

struct GanttSegment {
    int pid;
    std::string name;
    int start_time;
    int end_time;
};

struct SchedulingResult {
    std::string algorithm;
    int quantum;
    double avg_waiting_time;
    double avg_turnaround_time;
    double avg_response_time;
    std::vector<SimProcess> process_results;
    std::vector<GanttSegment> gantt_chart;
};

class SchedulerSimulator {
public:
    SchedulerSimulator();
    ~SchedulerSimulator();

    // Run First-Come First-Served
    SchedulingResult run_fcfs(std::vector<SimProcess> processes);

    // Run Shortest Job First (Non-preemptive)
    SchedulingResult run_sjf(std::vector<SimProcess> processes);

    // Run Priority Scheduling (Non-preemptive)
    SchedulingResult run_priority(std::vector<SimProcess> processes);

    // Run Round-Robin (Preemptive with Quantum)
    SchedulingResult run_round_robin(std::vector<SimProcess> processes, int quantum);

    // Run all and return JSON comparison report
    std::string run_all_simulations_json(std::vector<SimProcess> input_processes, int rr_quantum = 2);

    // Helper to generate default sample processes
    static std::vector<SimProcess> get_default_sample_processes();
};

} // namespace ares

#endif // ARES_SCHEDULER_SIM_H
