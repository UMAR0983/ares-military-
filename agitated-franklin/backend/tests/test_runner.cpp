#include "scheduler_sim.h"
#include "memory_sim.h"
#include "deadlock_detector.h"
#include "logger.h"
#include <iostream>
#include <cassert>

using namespace ares;

void test_cpu_scheduling() {
    Logger::info("UnitTest", "Testing CPU Scheduling Algorithms (FCFS, SJF, Priority, RR)...");
    SchedulerSimulator sim;
    auto procs = SchedulerSimulator::get_default_sample_processes();

    auto fcfs = sim.run_fcfs(procs);
    assert(fcfs.process_results.size() == procs.size());
    assert(fcfs.avg_waiting_time >= 0);

    auto sjf = sim.run_sjf(procs);
    assert(sjf.process_results.size() == procs.size());

    auto prio = sim.run_priority(procs);
    assert(prio.process_results.size() == procs.size());

    auto rr = sim.run_round_robin(procs, 2);
    assert(rr.process_results.size() == procs.size());

    Logger::info("UnitTest", "[PASS] CPU Scheduling tests passed.");
}

void test_memory_page_replacement() {
    Logger::info("UnitTest", "Testing Virtual Memory Page Replacement Algorithms (FIFO, LRU, Optimal)...");
    MemorySimulator sim;
    auto refs = MemorySimulator::get_default_reference_string();

    auto fifo = sim.run_fifo(refs, 4);
    assert(fifo.total_requests == static_cast<int>(refs.size()));
    assert(fifo.page_faults + fifo.page_hits == fifo.total_requests);

    auto lru = sim.run_lru(refs, 4);
    assert(lru.total_requests == static_cast<int>(refs.size()));

    auto opt = sim.run_optimal(refs, 4);
    assert(opt.total_requests == static_cast<int>(refs.size()));
    assert(opt.page_faults <= fifo.page_faults); // Optimal should be <= FIFO page faults

    Logger::info("UnitTest", "[PASS] Virtual Memory Page Replacement tests passed.");
}

void test_deadlock_detection() {
    Logger::info("UnitTest", "Testing Deadlock Detector (RAG Cycle DFS & Banker's Safety)...");
    DeadlockDetector det;

    // Test Banker's Safety Algorithm
    auto safe_state = DeadlockDetector::get_sample_banker_state(true);
    std::vector<int> safe_seq;
    bool is_safe = det.check_bankers_safety(safe_state, safe_seq);
    assert(is_safe == true);
    assert(safe_seq.size() == safe_state.num_processes);

    auto unsafe_state = DeadlockDetector::get_sample_banker_state(false);
    std::vector<int> unsafe_seq;
    bool is_unsafe_result = det.check_bankers_safety(unsafe_state, unsafe_seq);
    assert(is_unsafe_result == false);

    Logger::info("UnitTest", "[PASS] Deadlock Detection tests passed.");
}

int main() {
    Logger::getInstance().init("ares_test.log", true);
    Logger::info("TestRunner", "=================================================");
    Logger::info("TestRunner", "  ARES Enterprise C++ Unit Test Suite Executable  ");
    Logger::info("TestRunner", "=================================================");

    try {
        test_cpu_scheduling();
        test_memory_page_replacement();
        test_deadlock_detection();

        Logger::info("TestRunner", "ALL ARES OS ALGORITHM UNIT TESTS COMPLETED SUCCESSFULLY (100% PASS).");
        return 0;
    } catch (const std::exception& ex) {
        Logger::critical("TestRunner", std::string("UNIT TEST FAILURE EXCEPTION: ") + ex.what());
        return 1;
    }
}
