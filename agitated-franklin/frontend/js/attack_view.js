/* =====================================================================
   ARES — Attack Injection Engine & Incident Report Generator View
   ===================================================================== */

class AttackView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    renderAttackPanel(telemetryData) {
        if (!this.container) return;

        const attacks = (telemetryData && telemetryData.active_attacks) ? telemetryData.active_attacks : [];
        const reports = (telemetryData && telemetryData.incident_reports) ? telemetryData.incident_reports : [];
        const clusters = (telemetryData && telemetryData.clusters) ? telemetryData.clusters : [];

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: 100%; height: 100%;">
                
                <!-- Left Column: Attack Injection Controls -->
                <div class="panel" style="padding: 16px;">
                    <div class="panel-header" style="margin: -16px -16px 14px -16px; padding: 10px 16px;">
                        <span>ATTACK & ANOMALY INJECTION ENGINE</span>
                        <span class="admin-only" style="font-size: 0.75rem; color: var(--neon-yellow);">CLASSIFIED ADMIN CONTROLS</span>
                    </div>

                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">
                        Launch simulated cyber/OS attacks against monitored clusters to trigger live incident responses and auto-generate official Security Incident Reports.
                    </p>

                    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                        <label style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: bold;">SELECT ATTACK VECTOR:</label>
                        <select id="select-attack-vector" style="background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; padding: 10px; border-radius: 3px; font-family: var(--font-mono);">
                            <option value="SYN_FLOOD_ATTACK">SYN Flood Packet Exhaustion Attack</option>
                            <option value="DEADLOCK_LOCKUP">Resource Allocation Graph (RAG) Deadlock Lockup</option>
                            <option value="CPU_EXHAUSTION">Daemon Thread CPU Exhaustion Spike</option>
                            <option value="PAGE_RAM_POISONING">Virtual Memory Page Frame Corruption</option>
                            <option value="RACE_CONDITION_EXPLOIT">Shared Memory Race Condition Exploit</option>
                        </select>

                        <label style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: bold;">TARGET MONITORED CLUSTER:</label>
                        <select id="select-target-cluster" style="background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; padding: 10px; border-radius: 3px; font-family: var(--font-mono);">
                            ${clusters.map(c => `<option value="${c.cluster_code}">${c.cluster_name} (${c.cluster_code})</option>`).join('')}
                        </select>
                    </div>

                    <button class="btn-tactical danger" id="btn-trigger-attack-injection" style="width: 100%; padding: 12px; font-size: 0.9rem;">
                        ⚡ LAUNCH SIMULATED ATTACK INJECTION
                    </button>

                    <h4 style="color: var(--neon-cyan); margin-top: 18px; margin-bottom: 8px;">ACTIVE THREAT INJECTIONS</h4>
                    <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-cyan); border-radius: 4px; padding: 8px; max-height: 180px; overflow-y: auto;">
                        ${attacks.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.8rem;">No active threat injections. System operating normally.</div>' : ''}
                        ${attacks.map(a => `
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,240,255,0.08); padding: 6px 0; font-family: var(--font-mono); font-size: 0.8rem;">
                                <div>
                                    <span style="color: var(--neon-red); font-weight: bold;">[${a.attack_id}]</span> 
                                    <span style="color: #fff;">${a.attack_type}</span> ➔ 
                                    <span style="color: var(--neon-cyan);">${a.target_cluster}</span>
                                </div>
                                <div>
                                    <button class="btn-tactical" onclick="window.aresAttackView.mitigate('${a.attack_id}')" style="padding: 3px 8px; font-size: 0.7rem;">MITIGATE</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Right Column: Formal Security Incident Reports -->
                <div class="panel" style="padding: 16px;">
                    <div class="panel-header" style="margin: -16px -16px 14px -16px; padding: 10px 16px;">
                        <span>FORMAL SECURITY INCIDENT & OS AUDIT REPORTS</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">TEAM DISPATCH ARCHIVE</span>
                    </div>

                    <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-cyan); border-radius: 4px; padding: 10px; max-height: 400px; overflow-y: auto;">
                        ${reports.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.8rem;">No incident reports generated yet. Inject an attack to generate a report.</div>' : ''}
                        ${reports.map(r => `
                            <div style="background: rgba(0, 240, 255, 0.04); border: 1px solid var(--border-cyan); border-radius: 4px; padding: 12px; margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 6px;">
                                    <strong style="color: var(--neon-cyan);">${r.report_id}</strong>
                                    <span style="color: var(--neon-yellow); font-size: 0.75rem;">DISPATCHED TO: ${r.dispatched_team_id}</span>
                                </div>
                                <div style="font-size: 0.8rem; color: #fff; margin-bottom: 6px;">
                                    <strong>Target Cluster:</strong> ${r.target_cluster} | 
                                    <strong>CPU Peak:</strong> ${r.cpu_snapshot.toFixed(1)}% | 
                                    <strong>RAM Peak:</strong> ${r.memory_snapshot.toFixed(1)}%
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 3px;">
                                    <strong>Executive Summary:</strong> ${r.summary}
                                </div>
                                <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--neon-green);">
                                    <strong>Recommended Mitigation Protocol:</strong><br>
                                    <pre style="font-family: var(--font-mono); white-space: pre-wrap; margin-top: 4px; color: var(--neon-green);">${r.mitigation_steps}</pre>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

            </div>
        `;

        this.container.innerHTML = html;
        this.bindEvents();
    }

    bindEvents() {
        const injectBtn = document.getElementById('btn-trigger-attack-injection');
        if (injectBtn) {
            injectBtn.addEventListener('click', async () => {
                const vector = document.getElementById('select-attack-vector').value;
                const target = document.getElementById('select-target-cluster')
                             ? document.getElementById('select-target-cluster').value
                             : 'SEC-01-ISB';

                const SUPABASE_URL = 'https://nbxafhihdrmyxpihasjd.supabase.co';
                const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieGFmaGloZHJteXhwaWhhc2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTI1MjAsImV4cCI6MjEwNjA2ODUyMH0.9GKb-FrYfppq2SQYh6oljPryHTJyl73onadBseiD9rA';
                const attackCode = `ATK-${Date.now()}`;
                const reportCode = `RPT-${Date.now()}`;
                const now = new Date().toISOString();

                const headers = {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                };

                const attackPayload = {
                    attack_code: attackCode,
                    target_cluster_code: target,
                    severity: 'CRITICAL',
                    injected_by: sessionStorage.getItem('ARES_ACTIVE_USER') || 'ADMIN',
                    injected_at: now,
                    status: 'ACTIVE',
                    payload: { attack_type: vector }
                };

                const reportPayload = {
                    report_code: reportCode,
                    attack_id: attackCode,
                    target_cluster_code: target,
                    summary: `${vector} detected on cluster ${target}. Immediate response required.`,
                    dispatched_team_id: 'TEAM-01',
                    cpu_snapshot: Math.random() * 40 + 60,
                    memory_snapshot: Math.random() * 30 + 50,
                    generated_at: now,
                    status: 'OPEN'
                };

                try {
                    await fetch(`${SUPABASE_URL}/rest/v1/attack_logs`, {
                        method: 'POST', headers, body: JSON.stringify(attackPayload)
                    });
                    await fetch(`${SUPABASE_URL}/rest/v1/incident_reports`, {
                        method: 'POST', headers, body: JSON.stringify(reportPayload)
                    });
                    alert(`✅ ATTACK INJECTED & LOGGED TO SUPABASE!\n\nAttack Code: ${attackCode}\nReport: ${reportCode}\nVector: ${vector}\nTarget: ${target}\n\nCheck Supabase → attack_logs & incident_reports`);
                } catch (e) {
                    alert(`ATTACK INJECTED (local only):\n${vector} against ${target}\nSupabase error: ${e.message}`);
                }
            });
        }
    }

    mitigate(attackId) {
        alert(`THREAT MITIGATED: Security team resolved attack ${attackId}. Cluster operating normally.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aresAttackView = new AttackView('attack-tab-content');
});
