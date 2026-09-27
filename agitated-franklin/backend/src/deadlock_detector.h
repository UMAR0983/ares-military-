#ifndef ARES_DEADLOCK_DETECTOR_H
#define ARES_DEADLOCK_DETECTOR_H

#include <vector>
#include <string>
#include <map>

namespace ares {

struct RAGNode {
    std::string id; // e.g. "P1", "P2", "R1", "R2"
    std::string type; // "PROCESS" or "RESOURCE"
    int instances; // For resources
};

struct RAGEdge {
    std::string from_id;
    std::string to_id;
    std::string edge_type; // "ALLOCATED" (Resource -> Process) or "REQUESTED" (Process -> Resource)
};

struct BankerState {
    int num_processes;
    int num_resources;
    std::vector<int> available;
    std::vector<std::vector<int>> max;
    std::vector<std::vector<int>> allocation;
    std::vector<std::vector<int>> need;
};

struct DeadlockReport {
    bool has_deadlock;
    std::vector<std::string> deadlocked_nodes;
    bool is_safe_state;
    std::vector<int> safe_sequence;
    std::vector<RAGNode> nodes;
    std::vector<RAGEdge> edges;
};

class DeadlockDetector {
public:
    DeadlockDetector();
    ~DeadlockDetector();

    // Check RAG for cycles using Depth-First Search
    bool detect_rag_cycles(const std::vector<RAGNode>& nodes, const std::vector<RAGEdge>& edges, std::vector<std::string>& cycle_nodes);

    // Run Banker's Algorithm for deadlock avoidance safety check
    bool check_bankers_safety(const BankerState& state, std::vector<int>& safe_seq);

    // Generate comprehensive Deadlock Analysis JSON
    std::string evaluate_deadlock_status_json(bool inject_deadlock_sample = false);

    static BankerState get_sample_banker_state(bool safe);
};

} // namespace ares

#endif // ARES_DEADLOCK_DETECTOR_H
