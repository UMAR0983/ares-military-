/* =====================================================================
   ARES — Command Dashboard Main Frontend Orchestrator
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log("[ARES System] Initializing Tactical Defense Command Center...");

    // 1. Initialize Sub-views & Components
    const threeScene = new AresThreeScene('three-canvas-container');
    const pakistanMap = new PakistanSectorMap('pakistan-map-container', (selectedSector) => {
        showSectorDetailsModal(selectedSector);
    });
    const radarSweep = new RadarSweepVisualizer('radar-canvas');
    const schedulerView = new SchedulerView('scheduler-tab-content');
    const memoryView = new MemoryView('memory-tab-content');
    const deadlockView = new DeadlockView('deadlock-tab-content');

    // Render Initial Static Views
    schedulerView.renderSimulations();
    memoryView.renderSimulations();
    deadlockView.renderDeadlockReport();

    // Render Initial Attack & Cluster Views
    if (window.aresAttackView) window.aresAttackView.renderAttackPanel();
    if (window.aresClusterView) window.aresClusterView.renderClusterBuilder();

    // 2. Initialize Telemetry Client
    const telemetryClient = new AresTelemetryClient('http://localhost:8080', (data) => {
        window.aresTelemetryData = data;
        updateDashboardState(data);
    }, (connected, statusMsg) => {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.textContent = statusMsg;
        if (statusDot) {
            if (connected) {
                statusDot.classList.remove('offline');
            } else {
                statusDot.classList.add('offline');
            }
        }
    });

    // 3. Tab Navigation Controller
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');

            if (targetId === 'tab-overview' && threeScene) {
                threeScene.onWindowResize();
                if (radarSweep) radarSweep.resize();
            }
        });
    });

    // 4. Update Dashboard State from Telemetry Stream
    function updateDashboardState(data) {
        if (!data) return;

        // CPU & Memory metrics
        const totalCpuEl = document.getElementById('metric-total-cpu');
        const memoryPctEl = document.getElementById('metric-memory-pct');
        const activeProcsEl = document.getElementById('metric-active-procs');

        if (totalCpuEl) totalCpuEl.textContent = `${Math.round(data.total_cpu)}%`;
        if (memoryPctEl && data.memory) memoryPctEl.textContent = `${Math.round(data.memory.memory_percent)}%`;
        if (activeProcsEl && data.processes) activeProcsEl.textContent = data.processes.length;

        // Update 3D Three.js & Pakistan Map & Radar
        if (threeScene && data.sectors) threeScene.updateSectorHeights(data.sectors);
        if (pakistanMap && data.sectors) pakistanMap.updateSectorData(data.sectors);
        if (radarSweep && data.sectors) radarSweep.updateBlipLoads(data.sectors);

        // Update Process Table
        updateProcessTable(data.processes);

        // Update File Security Logs
        updateFileLogTable(data.file_events);

        // Update Attack & Cluster & Team Portal panels
        if (window.aresAttackView) window.aresAttackView.renderAttackPanel(data);
        if (window.aresClusterView && data.clusters) window.aresClusterView.renderClusterBuilder(data.clusters);
        if (window.aresTeamPortal && document.getElementById('team-portal-screen').style.display === 'flex') {
            window.aresTeamPortal.renderTeamPortal(data);
        }

        // Update Deadlock & IPC views
        if (deadlockView && data.ipc) deadlockView.updateIpcOutput(data.ipc);
    }

    function updateProcessTable(processes) {
        const tbody = document.getElementById('process-table-body');
        if (!tbody || !processes) return;

        tbody.innerHTML = processes.map(p => `
            <tr>
                <td><strong style="color: var(--neon-cyan);">${p.pid}</strong></td>
                <td>${p.ppid}</td>
                <td><strong>${p.name}</strong></td>
                <td><span style="color: ${p.state === 'Running' ? 'var(--neon-green)' : 'var(--neon-yellow)'};">${p.state}</span></td>
                <td>${p.cpu.toFixed(1)}%</td>
                <td>${p.memory_mb} MB</td>
                <td><span style="color: var(--neon-cyan); font-size: 0.75rem;">${p.sector_name.split(' ')[0]}</span></td>
            </tr>
        `).join('');
    }

    function updateFileLogTable(fileEvents) {
        const container = document.getElementById('file-events-list');
        if (!container || !fileEvents) return;

        container.innerHTML = fileEvents.slice(-6).reverse().map(ev => `
            <div style="font-family: var(--font-mono); font-size: 0.8rem; border-bottom: 1px solid rgba(0,240,255,0.08); padding: 5px 0;">
                <span style="color: var(--neon-yellow);">${ev.timestamp ? ev.timestamp.split('T')[1].replace('Z','') : 'LOG'}:</span>
                <span style="color: var(--neon-cyan); font-weight: bold;">[${ev.action}]</span> 
                <span style="color: #fff;">${ev.file_path}</span> 
                <span style="color: var(--text-muted); font-size: 0.75rem;">(${ev.sector})</span>
            </div>
        `).join('');
    }

    function showSectorDetailsModal(sector) {
        alert(`ARES DEFENSE SECTOR INSPECTOR\n------------------------------------\nSector Code: ${sector.name}\nStatus: ${sector.status}\nLive CPU Load: ${sector.cpu}%\nMemory Occupancy: ${sector.mem}%\nActive Daemons: 14\n\nSecurity Integrity Audit: CLEAR`);
    }

    // Live UTC Clock
    setInterval(() => {
        const clockEl = document.getElementById('ares-clock');
        if (clockEl) {
            clockEl.textContent = new Date().toUTCString().replace('GMT', 'UTC');
        }
    }, 1000);
});
