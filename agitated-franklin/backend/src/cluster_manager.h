#ifndef ARES_CLUSTER_MANAGER_H
#define ARES_CLUSTER_MANAGER_H

#include <string>
#include <vector>
#include <mutex>

namespace ares {

struct CustomCluster {
    std::string cluster_code; // e.g. "SEC-01-ISB"
    std::string cluster_name;
    std::string ip_range;
    double sector_x;
    double sector_y;
    std::string priority; // "HIGH", "CRITICAL", "MEDIUM"
    std::string status;   // "ACTIVE", "DEGRADED", "UNDER_ATTACK"
};

class ClusterManager {
private:
    std::vector<CustomCluster> clusters_;
    std::mutex mutex_;

public:
    ClusterManager();
    ~ClusterManager();

    // Add or update custom cluster
    bool add_cluster(const CustomCluster& cluster);

    // Get all registered clusters
    std::vector<CustomCluster> get_all_clusters();

    // JSON export
    std::string get_clusters_json();
};

} // namespace ares

#endif // ARES_CLUSTER_MANAGER_H
