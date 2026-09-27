#include "cluster_manager.h"
#include "logger.h"
#include <sstream>

namespace ares {

ClusterManager::ClusterManager() {
    // Initialize default clusters
    clusters_ = {
        { "SEC-01-ISB", "Sector-1 (Islamabad Core)", "192.168.10.0/24", 340.0, 150.0, "HIGH", "ACTIVE" },
        { "SEC-02-LHR", "Sector-2 (Lahore Hub)", "192.168.20.0/24", 370.0, 220.0, "MEDIUM", "ACTIVE" },
        { "SEC-03-KHI", "Sector-3 (Karachi Coastal)", "192.168.30.0/24", 160.0, 460.0, "CRITICAL", "ACTIVE" },
        { "SEC-04-PEW", "Sector-4 (Peshawar Ridge)", "192.168.40.0/24", 290.0, 120.0, "MEDIUM", "ACTIVE" },
        { "SEC-05-UET", "Sector-5 (Quetta Outpost)", "192.168.50.0/24", 140.0, 280.0, "HIGH", "ACTIVE" }
    };
}

ClusterManager::~ClusterManager() {}

bool ClusterManager::add_cluster(const CustomCluster& cluster) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& c : clusters_) {
        if (c.cluster_code == cluster.cluster_code) {
            c = cluster; // Update existing
            Logger::info("ClusterManager", "Updated custom cluster: " + cluster.cluster_name);
            return true;
        }
    }
    clusters_.push_back(cluster);
    Logger::info("ClusterManager", "Added new custom cluster: " + cluster.cluster_name);
    return true;
}

std::vector<CustomCluster> ClusterManager::get_all_clusters() {
    std::lock_guard<std::mutex> lock(mutex_);
    return clusters_;
}

std::string ClusterManager::get_clusters_json() {
    std::lock_guard<std::mutex> lock(mutex_);
    std::ostringstream ss;
    ss << "[";
    for (size_t i = 0; i < clusters_.size(); ++i) {
        const auto& c = clusters_[i];
        ss << "{"
           << "\"cluster_code\":\"" << c.cluster_code << "\","
           << "\"cluster_name\":\"" << c.cluster_name << "\","
           << "\"ip_range\":\"" << c.ip_range << "\","
           << "\"sector_x\":" << c.sector_x << ","
           << "\"sector_y\":" << c.sector_y << ","
           << "\"priority\":\"" << c.priority << "\","
           << "\"status\":\"" << c.status << "\""
           << "}";
        if (i + 1 < clusters_.size()) ss << ",";
    }
    ss << "]";
    return ss.str();
}

} // namespace ares
