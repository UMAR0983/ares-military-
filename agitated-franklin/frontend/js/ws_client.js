/* =====================================================================
   ARES — Telemetry Data Client & WebSocket / Polling Connection Manager
   ===================================================================== */

class AresTelemetryClient {
    constructor(serverUrl = 'http://localhost:8080', onDataCallback, onStatusCallback) {
        this.serverUrl = serverUrl;
        this.onData = onDataCallback;
        this.onStatus = onStatusCallback;
        this.isConnected = false;
        this.pollInterval = null;
        this.simulatedMode = false;

        this.connect();
    }

    connect() {
        this.fetchTelemetry();
        this.pollInterval = setInterval(() => this.fetchTelemetry(), 2000);
    }

    async fetchTelemetry() {
        try {
            const response = await fetch(`${this.serverUrl}/api/telemetry`, {
                signal: AbortSignal.timeout(1500)
            });
            if (response.ok) {
                const data = await response.json();
                this.setConnected(true, "C++ CORE ONLINE");
                this.simulatedMode = false;
                if (typeof this.onData === 'function') this.onData(data);
                return;
            }
        } catch (err) {
            // Backend offline - smooth fallback simulation mode
            this.setConnected(false, "SIMULATION MODE (Backend Offline)");
            this.simulatedMode = true;
            const simData = this.generateSimulatedTelemetry();
            if (typeof this.onData === 'function') this.onData(simData);
        }
    }

    setConnected(status, message) {
        this.isConnected = status;
        if (typeof this.onStatus === 'function') {
            this.onStatus(status, message);
        }
    }

    async runSchedulerSimulation() {
        try {
            const res = await fetch(`${this.serverUrl}/api/scheduler`);
            if (res.ok) return await res.json();
        } catch (e) {}
        return null;
    }

    async runMemorySimulation() {
        try {
            const res = await fetch(`${this.serverUrl}/api/memory_sim`);
            if (res.ok) return await res.json();
        } catch (e) {}
        return null;
    }

    async toggleMutex() {
        try {
            const res = await fetch(`${this.serverUrl}/api/toggle_mutex`);
            if (res.ok) return await res.json();
        } catch (e) {}
        return null;
    }

    generateSimulatedTelemetry() {
        const now = new Date().toISOString();
        const baseCpu = 20 + Math.floor(Math.random() * 35);
        return {
            timestamp: now,
            total_cpu: baseCpu,
            memory: {
                total_gb: 16.0,
                used_gb: 7.2,
                free_gb: 8.8,
                memory_percent: 45.0 + (Math.random() * 5),
                swap_total_gb: 4.0,
                swap_used_gb: 0.8
            },
            sectors: [
                { sector_id: 1, sector_name: "Sector-1 (Islamabad)", cpu_load: baseCpu + 5, memory_load: 42, process_count: 14, alert_status: "NORMAL" },
                { sector_id: 2, sector_name: "Sector-2 (Lahore)", cpu_load: baseCpu + 15, memory_load: 65, process_count: 18, alert_status: "NORMAL" },
                { sector_id: 3, sector_name: "Sector-3 (Karachi)", cpu_load: baseCpu - 8, memory_load: 50, process_count: 22, alert_status: "NORMAL" },
                { sector_id: 4, sector_name: "Sector-4 (Peshawar)", cpu_load: 15, memory_load: 30, process_count: 9, alert_status: "NORMAL" },
                { sector_id: 5, sector_name: "Sector-5 (Quetta)", cpu_load: 78, memory_load: 82, process_count: 12, alert_status: "CRITICAL" }
            ],
            processes: [
                { pid: 1042, ppid: 1, name: "ares_recon", state: "Running", cpu: 14.2, memory_mb: 180, memory_percent: 1.1, sector_id: 1, sector_name: "Sector-1 (Islamabad)" },
                { pid: 1088, ppid: 1042, name: "radar_poller", state: "Running", cpu: 8.5, memory_mb: 95, memory_percent: 0.6, sector_id: 2, sector_name: "Sector-2 (Lahore)" },
                { pid: 1104, ppid: 1042, name: "deadlock_guard", state: "Sleeping", cpu: 0.8, memory_mb: 64, memory_percent: 0.4, sector_id: 3, sector_name: "Sector-3 (Karachi)" },
                { pid: 1190, ppid: 1042, name: "ipc_shm_listener", state: "Running", cpu: 4.1, memory_mb: 112, memory_percent: 0.7, sector_id: 4, sector_name: "Sector-4 (Peshawar)" },
                { pid: 1250, ppid: 1042, name: "crypto_vault_worker", state: "Running", cpu: 34.5, memory_mb: 420, memory_percent: 2.6, sector_id: 5, sector_name: "Sector-5 (Quetta)" }
            ],
            file_events: [
                { file_path: "security_vault.key", action: "MODIFY", timestamp: now, sector: "Sector-1 (Islamabad)", file_size: 4096 },
                { file_path: "telemetry_buffer.tmp", action: "CREATE", timestamp: now, sector: "Sector-2 (Lahore)", file_size: 16384 }
            ],
            deadlock: {
                has_deadlock: false,
                is_safe_state: true,
                deadlocked_nodes: [],
                safe_sequence: [1, 3, 4, 0, 2],
                nodes: [
                    { id: "P1", type: "PROCESS", instances: 0 },
                    { id: "P2", type: "PROCESS", instances: 0 },
                    { id: "P3", type: "PROCESS", instances: 0 },
                    { id: "R1", type: "RESOURCE", instances: 1 },
                    { id: "R2", type: "RESOURCE", instances: 1 },
                    { id: "R3", type: "RESOURCE", instances: 1 }
                ],
                edges: [
                    { from: "R1", to: "P1", type: "ALLOCATED" },
                    { from: "P1", to: "R2", type: "REQUESTED" },
                    { from: "R2", to: "P2", type: "ALLOCATED" },
                    { from: "P2", to: "R3", type: "REQUESTED" },
                    { from: "R3", to: "P3", type: "ALLOCATED" }
                ]
            },
            ipc: {
                named_pipe: { pipe_name: "/tmp/ares_cmd_pipe", status: "ACTIVE_LISTENING", messages_processed: 1482 },
                shared_memory: { shm_segment: "/ares_shm_telemetry", allocated_bytes: 65536, mutex_protected: true },
                race_test_result: { mutex_enabled: true, expected_count: 50000, actual_count: 50000, execution_time_ms: 12.4, status: "SAFE" }
            }
        };
    }
}
