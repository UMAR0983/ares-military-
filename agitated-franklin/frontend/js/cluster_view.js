/* =====================================================================
   ARES — Custom Monitored Cluster Builder & Manager
   ===================================================================== */

class ClusterView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    renderClusterBuilder(clusters) {
        if (!this.container) return;
        if (!clusters || !Array.isArray(clusters)) {
            clusters = [
                { cluster_code: "SEC-01-ISB", cluster_name: "Sector-1 (Islamabad Core)", ip_range: "192.168.10.0/24", sector_x: 340, sector_y: 150, priority: "HIGH", status: "ACTIVE" },
                { cluster_code: "SEC-02-LHR", cluster_name: "Sector-2 (Lahore Hub)", ip_range: "192.168.20.0/24", sector_x: 370, sector_y: 220, priority: "MEDIUM", status: "ACTIVE" },
                { cluster_code: "SEC-03-KHI", cluster_name: "Sector-3 (Karachi Coastal)", ip_range: "192.168.30.0/24", sector_x: 160, sector_y: 460, priority: "CRITICAL", status: "ACTIVE" },
                { cluster_code: "SEC-04-PEW", cluster_name: "Sector-4 (Peshawar Ridge)", ip_range: "192.168.40.0/24", sector_x: 290, sector_y: 120, priority: "MEDIUM", status: "ACTIVE" },
                { cluster_code: "SEC-05-UET", cluster_name: "Sector-5 (Quetta Outpost)", ip_range: "192.168.50.0/24", sector_x: 140, sector_y: 280, priority: "HIGH", status: "ACTIVE" }
            ];
        }

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 14px; width: 100%; height: 100%;">
                
                <!-- Left: Create Custom Cluster Form -->
                <div class="panel" style="padding: 16px;">
                    <div class="panel-header" style="margin: -16px -16px 14px -16px; padding: 10px 16px;">
                        <span>CREATE CUSTOM MONITORED CLUSTER</span>
                        <span class="admin-only" style="font-size: 0.75rem; color: var(--neon-yellow);">ADMIN BUILDER</span>
                    </div>

                    <form id="form-create-cluster" style="display: flex; flex-direction: column; gap: 10px;">
                        <div>
                            <label style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: bold;">CLUSTER CODE:</label>
                            <input type="text" id="cluster-code" placeholder="e.g. SEC-06-RAW" required 
                                   style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; padding: 8px; border-radius: 3px; font-family: var(--font-mono); margin-top: 3px;">
                        </div>

                        <div>
                            <label style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: bold;">CLUSTER NAME & LOCATION:</label>
                            <input type="text" id="cluster-name" placeholder="e.g. Sector-6 (Rawalpindi Garrison)" required 
                                   style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; padding: 8px; border-radius: 3px; font-family: var(--font-mono); margin-top: 3px;">
                        </div>

                        <div>
                            <label style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: bold;">NETWORK IP RANGE / SUBNET:</label>
                            <input type="text" id="cluster-ip" placeholder="10.0.60.0/24" required 
                                   style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; padding: 8px; border-radius: 3px; font-family: var(--font-mono); margin-top: 3px;">
                        </div>

                        <div style="display: flex; gap: 8px;">
                            <div style="flex: 1;">
                                <label style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: bold;">MAP X COORD:</label>
                                <input type="number" id="cluster-x" value="250" 
                                       style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; padding: 8px; border-radius: 3px; font-family: var(--font-mono); margin-top: 3px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: bold;">MAP Y COORD:</label>
                                <input type="number" id="cluster-y" value="250" 
                                       style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; padding: 8px; border-radius: 3px; font-family: var(--font-mono); margin-top: 3px;">
                            </div>
                        </div>

                        <div>
                            <label style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: bold;">PRIORITY LEVEL:</label>
                            <select id="cluster-priority" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; padding: 8px; border-radius: 3px; font-family: var(--font-mono); margin-top: 3px;">
                                <option value="HIGH">HIGH PRIORITY</option>
                                <option value="CRITICAL">CRITICAL PRIORITY</option>
                                <option value="MEDIUM">MEDIUM PRIORITY</option>
                            </select>
                        </div>

                        <button type="submit" class="btn-tactical" style="margin-top: 8px; padding: 10px;">
                            + REGISTER MONITORED CLUSTER
                        </button>
                    </form>
                </div>

                <!-- Right: Registered Clusters Grid -->
                <div class="panel" style="padding: 16px;">
                    <div class="panel-header" style="margin: -16px -16px 14px -16px; padding: 10px 16px;">
                        <span>REGISTERED MONITORED CLUSTERS</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">TOPOLOGY OVERVIEW</span>
                    </div>

                    <table class="ares-table">
                        <thead>
                            <tr>
                                <th>CODE</th>
                                <th>NAME & LOCATION</th>
                                <th>IP SUBNET</th>
                                <th>COORDS</th>
                                <th>PRIORITY</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clusters.map(c => `
                                <tr>
                                    <td><strong style="color: var(--neon-cyan);">${c.cluster_code}</strong></td>
                                    <td>${c.cluster_name}</td>
                                    <td><code style="color: var(--neon-green);">${c.ip_range}</code></td>
                                    <td>(${c.sector_x}, ${c.sector_y})</td>
                                    <td><span style="color: ${c.priority === 'CRITICAL' ? 'var(--neon-red)' : 'var(--neon-yellow)'}; font-weight: bold;">${c.priority}</span></td>
                                    <td><span style="color: var(--neon-green);">${c.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

            </div>
        `;

        this.container.innerHTML = html;
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('form-create-cluster');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const code = document.getElementById('cluster-code').value.trim();
                const name = document.getElementById('cluster-name').value.trim();
                const ip = document.getElementById('cluster-ip').value.trim();
                const x = parseFloat(document.getElementById('cluster-x').value);
                const y = parseFloat(document.getElementById('cluster-y').value);
                const priority = document.getElementById('cluster-priority').value;

                alert(`CUSTOM CLUSTER REGISTERED: ${name} (${code}) [${ip}] at coords (${x}, ${y}). Cluster active in telemetry topology.`);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aresClusterView = new ClusterView('cluster-tab-content');
});
