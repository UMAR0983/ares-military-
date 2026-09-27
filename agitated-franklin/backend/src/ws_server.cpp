#include "ws_server.h"
#include "logger.h"
#include <iostream>
#include <sstream>
#include <cstring>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
typedef int socklen_t;
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#define SOCKET int
#define INVALID_SOCKET -1
#define SOCKET_ERROR -1
#define closesocket close
#endif

namespace ares {

WsServer::WsServer(int port) : port_(port), running_(false) {}

WsServer::~WsServer() {
    stop();
}

void WsServer::start() {
    if (running_) return;
    running_ = true;
    server_thread_ = std::thread(&WsServer::run_server_loop, this);
}

void WsServer::stop() {
    if (!running_) return;
    running_ = false;
    if (server_thread_.joinable()) {
        server_thread_.join();
    }
}

std::string WsServer::build_full_telemetry_json(bool inject_deadlock) {
    std::ostringstream ss;
    ss << "{"
       << "\"timestamp\":\"" << get_current_timestamp() << "\","
       << "\"total_cpu\":" << cpu_mon_.get_total_cpu_load() << ","
       << "\"memory\":" << mem_mon_.get_memory_json() << ","
       << "\"sectors\":" << cpu_mon_.get_sector_loads_json() << ","
       << "\"clusters\":" << cluster_mgr_.get_clusters_json() << ","
       << "\"active_attacks\":" << attack_inj_.get_active_attacks_json() << ","
       << "\"incident_reports\":" << attack_inj_.get_incident_reports_json() << ","
       << "\"processes\":" << proc_mon_.get_processes_json() << ","
       << "\"file_events\":" << file_mon_.get_file_events_json() << ","
       << "\"deadlock\":" << deadlock_det_.evaluate_deadlock_status_json(inject_deadlock) << ","
       << "\"ipc\":" << ipc_demo_.get_ipc_status_json()
       << "}";
    return ss.str();
}

std::string WsServer::handle_http_request(const std::string& request_str) {
    std::istringstream stream(request_str);
    std::string method, path;
    stream >> method >> path;

    std::string response_body;
    std::string content_type = "application/json";
    int status_code = 200;

    if (path == "/api/telemetry" || path == "/") {
        response_body = build_full_telemetry_json(false);
    } else if (path == "/api/telemetry/deadlock") {
        response_body = build_full_telemetry_json(true);
    } else if (path == "/api/attack/inject") {
        auto atk = attack_inj_.inject_attack("SYN_FLOOD_ATTACK", "SEC-01-ISB", "ADMIN_COMMANDER");
        response_body = "{\"success\":true,\"attack_id\":\"" + atk.attack_id + "\"}";
    } else if (path == "/api/attack/mitigate") {
        response_body = "{\"success\":true,\"message\":\"Threat mitigated successfully.\"}";
    } else if (path == "/api/clusters") {
        response_body = cluster_mgr_.get_clusters_json();
    } else if (path == "/api/scheduler") {
        response_body = scheduler_sim_.run_all_simulations_json({});
    } else if (path == "/api/memory_sim") {
        response_body = memory_sim_.run_all_simulations_json({});
    } else if (path == "/api/deadlock") {
        response_body = deadlock_det_.evaluate_deadlock_status_json(false);
    } else if (path == "/api/toggle_mutex") {
        bool current = ipc_demo_.is_mutex_enabled();
        ipc_demo_.set_mutex_enabled(!current);
        response_body = "{\"success\":true,\"mutex_enabled\":" + std::string(!current ? "true" : "false") + "}";
    } else {
        status_code = 404;
        response_body = "{\"error\":\"Not Found\"}";
    }

    std::ostringstream http_res;
    http_res << "HTTP/1.1 " << status_code << " OK\r\n"
             << "Content-Type: " << content_type << "\r\n"
             << "Access-Control-Allow-Origin: *\r\n"
             << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
             << "Access-Control-Allow-Headers: Content-Type\r\n"
             << "Content-Length: " << response_body.size() << "\r\n"
             << "Connection: close\r\n\r\n"
             << response_body;

    return http_res.str();
}

void WsServer::run_server_loop() {
#ifdef _WIN32
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
#endif

    SOCKET listen_sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listen_sock == INVALID_SOCKET) {
        Logger::error("WsServer", "Failed to create server socket.");
        return;
    }

    int opt = 1;
    setsockopt(listen_sock, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port_);

    if (bind(listen_sock, (sockaddr*)&addr, sizeof(addr)) == SOCKET_ERROR) {
        Logger::error("WsServer", "Bind failed on port " + std::to_string(port_));
        closesocket(listen_sock);
        return;
    }

    if (listen(listen_sock, SOMAXCONN) == SOCKET_ERROR) {
        Logger::error("WsServer", "Listen failed.");
        closesocket(listen_sock);
        return;
    }

    Logger::info("WsServer", "HTTP/WebSocket Telemetry Server listening on port " + std::to_string(port_));

    while (running_) {
        fd_set readfds;
        FD_ZERO(&readfds);
        FD_SET(listen_sock, &readfds);

        timeval tv;
        tv.tv_sec = 0;
        tv.tv_usec = 500000;

        int activity = select((int)listen_sock + 1, &readfds, NULL, NULL, &tv);
        if (activity > 0 && FD_ISSET(listen_sock, &readfds)) {
            sockaddr_in client_addr{};
            socklen_t client_len = sizeof(client_addr);
            SOCKET client_sock = accept(listen_sock, (sockaddr*)&client_addr, &client_len);
            if (client_sock != INVALID_SOCKET) {
                char buffer[4096];
                int bytes_received = recv(client_sock, buffer, sizeof(buffer) - 1, 0);
                if (bytes_received > 0) {
                    buffer[bytes_received] = '\0';
                    std::string req(buffer);
                    std::string response = handle_http_request(req);
                    send(client_sock, response.c_str(), (int)response.size(), 0);
                }
                closesocket(client_sock);
            }
        }
    }

    closesocket(listen_sock);
#ifdef _WIN32
    WSACleanup();
#endif
}

} // namespace ares
