#include "deadlock_detector.h"
#include <sstream>
#include <set>
#include <iostream>
#include <algorithm>

namespace ares {

DeadlockDetector::DeadlockDetector() {}
DeadlockDetector::~DeadlockDetector() {}

BankerState DeadlockDetector::get_sample_banker_state(bool safe) {
    BankerState state;
    state.num_processes = 5;
    state.num_resources = 3;

    state.available = { 3, 3, 2 };

    state.allocation = {
        {0, 1, 0}, // P0
        {2, 0, 0}, // P1
        {3, 0, 2}, // P2
        {2, 1, 1}, // P3
        {0, 0, 2}  // P4
    };

    if (safe) {
        state.max = {
            {7, 5, 3}, // P0
            {3, 2, 2}, // P1
            {9, 0, 2}, // P2
            {2, 2, 2}, // P3
            {4, 3, 3}  // P4
        };
    } else {
        // Unsafe allocation causing potential deadlock
        state.max = {
            {8, 5, 5},
            {4, 3, 3},
            {9, 2, 4},
            {5, 3, 3},
            {6, 4, 4}
        };
        state.available = { 0, 0, 0 };
    }

    state.need.resize(state.num_processes, std::vector<int>(state.num_resources));
    for (int i = 0; i < state.num_processes; ++i) {
        for (int j = 0; j < state.num_resources; ++j) {
            state.need[i][j] = state.max[i][j] - state.allocation[i][j];
        }
    }

    return state;
}

static bool dfs_cycle(const std::string& u, const std::map<std::string, std::vector<std::string>>& adj,
                      std::map<std::string, int>& visited, std::vector<std::string>& path, std::vector<std::string>& cycle_nodes) {
    visited[u] = 1; // Visiting
    path.push_back(u);

    auto it = adj.find(u);
    if (it != adj.end()) {
        for (const auto& v : it->second) {
            if (visited[v] == 1) { // Cycle found
                cycle_nodes = path;
                return true;
            }
            if (visited[v] == 0) {
                if (dfs_cycle(v, adj, visited, path, cycle_nodes)) return true;
            }
        }
    }

    path.pop_back();
    visited[u] = 2; // Visited
    return false;
}

bool DeadlockDetector::detect_rag_cycles(const std::vector<RAGNode>& nodes, const std::vector<RAGEdge>& edges, std::vector<std::string>& cycle_nodes) {
    std::map<std::string, std::vector<std::string>> adj;
    for (const auto& e : edges) {
        adj[e.from_id].push_back(e.to_id);
    }

    std::map<std::string, int> visited;
    for (const auto& n : nodes) visited[n.id] = 0;

    for (const auto& n : nodes) {
        if (visited[n.id] == 0) {
            std::vector<std::string> path;
            if (dfs_cycle(n.id, adj, visited, path, cycle_nodes)) {
                return true;
            }
        }
    }
    return false;
}

bool DeadlockDetector::check_bankers_safety(const BankerState& state, std::vector<int>& safe_seq) {
    int n = state.num_processes;
    int m = state.num_resources;

    std::vector<int> work = state.available;
    std::vector<bool> finish(n, false);
    safe_seq.clear();

    int count = 0;
    while (count < n) {
        bool found = false;
        for (int p = 0; p < n; ++p) {
            if (!finish[p]) {
                bool can_allocate = true;
                for (int j = 0; j < m; ++j) {
                    if (state.need[p][j] > work[j]) {
                        can_allocate = false;
                        break;
                    }
                }

                if (can_allocate) {
                    for (int j = 0; j < m; ++j) {
                        work[j] += state.allocation[p][j];
                    }
                    safe_seq.push_back(p);
                    finish[p] = true;
                    found = true;
                    count++;
                }
            }
        }
        if (!found) {
            return false; // Unsafe state
        }
    }
    return true; // Safe state
}

std::string DeadlockDetector::evaluate_deadlock_status_json(bool inject_deadlock_sample) {
    DeadlockReport report;
    report.nodes = {
        {"P1", "PROCESS", 0}, {"P2", "PROCESS", 0}, {"P3", "PROCESS", 0},
        {"R1", "RESOURCE", 1}, {"R2", "RESOURCE", 1}, {"R3", "RESOURCE", 1}
    };

    if (!inject_deadlock_sample) {
        // Safe RAG without cycles
        report.edges = {
            {"R1", "P1", "ALLOCATED"},
            {"P1", "R2", "REQUESTED"},
            {"R2", "P2", "ALLOCATED"},
            {"P2", "R3", "REQUESTED"},
            {"R3", "P3", "ALLOCATED"}
        };
    } else {
        // Deadlocked RAG with cyclic dependency (P1 -> R2 -> P2 -> R3 -> P3 -> R1 -> P1)
        report.edges = {
            {"R1", "P1", "ALLOCATED"},
            {"P1", "R2", "REQUESTED"},
            {"R2", "P2", "ALLOCATED"},
            {"P2", "R3", "REQUESTED"},
            {"R3", "P3", "ALLOCATED"},
            {"P3", "R1", "REQUESTED"}
        };
    }

    report.has_deadlock = detect_rag_cycles(report.nodes, report.edges, report.deadlocked_nodes);

    BankerState banker = get_sample_banker_state(!inject_deadlock_sample);
    report.is_safe_state = check_bankers_safety(banker, report.safe_sequence);

    std::ostringstream ss;
    ss << "{"
       << "\"has_deadlock\":" << (report.has_deadlock ? "true" : "false") << ","
       << "\"is_safe_state\":" << (report.is_safe_state ? "true" : "false") << ","
       << "\"deadlocked_nodes\":[";
    for (size_t i = 0; i < report.deadlocked_nodes.size(); ++i) {
        ss << "\"" << report.deadlocked_nodes[i] << "\"";
        if (i + 1 < report.deadlocked_nodes.size()) ss << ",";
    }
    ss << "],\"safe_sequence\":[";
    for (size_t i = 0; i < report.safe_sequence.size(); ++i) {
        ss << report.safe_sequence[i];
        if (i + 1 < report.safe_sequence.size()) ss << ",";
    }
    ss << "],\"nodes\":[";
    for (size_t i = 0; i < report.nodes.size(); ++i) {
        const auto& n = report.nodes[i];
        ss << "{\"id\":\"" << n.id << "\",\"type\":\"" << n.type << "\",\"instances\":" << n.instances << "}";
        if (i + 1 < report.nodes.size()) ss << ",";
    }
    ss << "],\"edges\":[";
    for (size_t i = 0; i < report.edges.size(); ++i) {
        const auto& e = report.edges[i];
        ss << "{\"from\":\"" << e.from_id << "\",\"to\":\"" << e.to_id << "\",\"type\":\"" << e.edge_type << "\"}";
        if (i + 1 < report.edges.size()) ss << ",";
    }
    ss << "]}";
    return ss.str();
}

} // namespace ares
