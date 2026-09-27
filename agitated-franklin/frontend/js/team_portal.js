/* =====================================================================
   ARES — Dedicated Tactical Response Team Portal & Control Unit
   ===================================================================== */

class AresTeamPortal {
    constructor() {
        this.activeIncident = null;
        this.mitigationsApplied = {
            syn_cookies: false,
            thread_preemption: false,
            page_flush: false,
            rate_limiting: false
        };
        this.assembledUnits = [];

        this.bindEvents();
    }

    renderTeamPortal(telemetryData) {
        const portal = document.getElementById('team-portal-screen');
        if (!portal) return;

        const reports = (telemetryData && telemetryData.incident_reports) ? telemetryData.incident_reports : [];
        const activeAttacks = (telemetryData && telemetryData.active_attacks) ? telemetryData.active_attacks : [];

        if (reports.length > 0 && !this.activeIncident) {
            this.activeIncident = reports[reports.length - 1];
        }

        let html = `
            <!-- Team Portal Top Bar -->
            <div style="background: rgba(8, 13, 22, 0.98); border-bottom: 1px solid var(--neon-green); padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 38px; height: 38px;">
                        <img src="assets/ares_markhor_logo.svg" style="width: 100%; height: 100%;">
                    </div>
                    <div>
                        <h2 style="color: var(--neon-green); font-size: 1.2rem; letter-spacing: 2px;">ARES TACTICAL RESPONSE TEAM PORTAL</h2>
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">INCIDENT MONITORING & DISPATCH CONSOLE</div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--neon-green);">
                        OFFICER DISPATCHED: <strong style="color: #fff;">${sessionStorage.getItem('ARES_TEAM_MEMBER') || 'TEAM-01'}</strong>
                    </div>
                    <button class="btn-tactical" id="btn-return-hq" style="border-color: var(--neon-cyan);">
                        RETURN TO SPLASH / HQ
                    </button>
                </div>
            </div>

            <!-- Team Operations Main Body -->
            <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; padding: 16px; overflow: hidden; background: var(--bg-dark);">
                
                <!-- Column 1: Live Threat Monitoring Stream -->
                <div class="panel">
                    <div class="panel-header" style="border-color: var(--neon-green);">
                        <span>1. INCOMING THREAT REPORTS</span>
                        <span style="font-size: 0.75rem; color: var(--neon-yellow);">LIVE SURVEILLANCE</span>
                    </div>
                    <div class="panel-body">
                        ${reports.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.85rem;">No active threat reports received. All clusters nominal.</div>' : ''}
                        ${reports.map(r => `
                            <div style="background: rgba(0, 255, 136, 0.05); border: 1px solid ${r.report_id === (this.activeIncident ? this.activeIncident.report_id : '') ? 'var(--neon-green)' : 'var(--border-cyan)'}; padding: 12px; border-radius: 4px; margin-bottom: 10px; cursor: pointer;"
                                 onclick="window.aresTeamPortal.selectIncident('${r.report_id}')">
                                <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 4px;">
                                    <strong style="color: var(--neon-cyan);">${r.report_id}</strong>
                                    <span style="color: var(--neon-red); font-weight: bold;">[${r.target_cluster}]</span>
                                </div>
                                <div style="font-size: 0.8rem; color: #fff; margin-bottom: 4px;">${r.summary}</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">Generated: ${r.generated_at}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Column 2: Control Unit Mitigation Settings -->
                <div class="panel">
                    <div class="panel-header" style="border-color: var(--neon-green);">
                        <span>2. CONTROL UNIT MITIGATION CONFIGURATOR</span>
                        <span style="font-size: 0.75rem; color: var(--neon-cyan);">CLUSTER SHIELDS</span>
                    </div>
                    <div class="panel-body" style="display: flex; flex-direction: column; gap: 12px;">
                        <p style="font-size: 0.8rem; color: var(--text-muted);">
                            Configure kernel shields and mitigation parameters for cluster <strong style="color: var(--neon-cyan);">${this.activeIncident ? this.activeIncident.target_cluster : 'SEC-01-ISB'}</strong>:
                        </p>

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; border: 1px solid var(--border-cyan); font-family: var(--font-mono); font-size: 0.8rem;">
                                <span>TCP SYN COOKIE KERNEL SHIELD</span>
                                <input type="checkbox" id="chk-syn-cookies" ${this.mitigationsApplied.syn_cookies ? 'checked' : ''} onchange="window.aresTeamPortal.toggleMitigation('syn_cookies')">
                            </label>

                            <label style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; border: 1px solid var(--border-cyan); font-family: var(--font-mono); font-size: 0.8rem;">
                                <span>RAG THREAD PREEMPTION SHIELD</span>
                                <input type="checkbox" id="chk-thread-preempt" ${this.mitigationsApplied.thread_preemption ? 'checked' : ''} onchange="window.aresTeamPortal.toggleMitigation('thread_preemption')">
                            </label>

                            <label style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; border: 1px solid var(--border-cyan); font-family: var(--font-mono); font-size: 0.8rem;">
                                <span>VIRTUAL MEMORY PAGE FLUSH</span>
                                <input type="checkbox" id="chk-page-flush" ${this.mitigationsApplied.page_flush ? 'checked' : ''} onchange="window.aresTeamPortal.toggleMitigation('page_flush')">
                            </label>

                            <label style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; border: 1px solid var(--border-cyan); font-family: var(--font-mono); font-size: 0.8rem;">
                                <span>SUBNET RATE LIMITING INGRESS</span>
                                <input type="checkbox" id="chk-rate-limit" ${this.mitigationsApplied.rate_limiting ? 'checked' : ''} onchange="window.aresTeamPortal.toggleMitigation('rate_limiting')">
                            </label>
                        </div>

                        <div style="margin-top: 10px; font-weight: bold; color: var(--neon-cyan); font-size: 0.85rem;">Assemble Tactical Units:</div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <button class="btn-tactical" onclick="window.aresTeamPortal.assembleUnit('Alpha Cyber Defense')" style="font-size: 0.75rem; padding: 6px 10px;">+ Alpha Cyber</button>
                            <button class="btn-tactical" onclick="window.aresTeamPortal.assembleUnit('Bravo OS Recovery')" style="font-size: 0.75rem; padding: 6px 10px;">+ Bravo OS</button>
                            <button class="btn-tactical" onclick="window.aresTeamPortal.assembleUnit('Gamma Network Shield')" style="font-size: 0.75rem; padding: 6px 10px;">+ Gamma Shield</button>
                        </div>

                        <div style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--neon-green); margin-top: 6px;">
                            Assembled Units: <strong>${this.assembledUnits.join(', ') || 'None'}</strong>
                        </div>
                    </div>
                </div>

                <!-- Column 3: Direct HQ Status Report Dispatcher -->
                <div class="panel">
                    <div class="panel-header" style="border-color: var(--neon-green);">
                        <span>3. DIRECT HQ REPORT DISPATCHER</span>
                        <span style="font-size: 0.75rem; color: var(--neon-green);">TRANSMIT TO HEADQUARTERS</span>
                    </div>
                    <div class="panel-body" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
                                Transmit formal threat mitigation status report directly back to Headquarters Admin Console & Supabase database:
                            </p>

                            <textarea id="txt-hq-notes" rows="6" placeholder="Enter tactical officer notes & cluster resolution status..." 
                                      style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; padding: 10px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem; margin-bottom: 12px;"></textarea>
                        </div>

                        <button class="btn-tactical" id="btn-dispatch-hq-report" style="width: 100%; padding: 14px; font-size: 0.95rem; background: linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,240,255,0.3)); border-color: var(--neon-green);">
                            📡 DISPATCH RESOLUTION REPORT TO HEADQUARTERS
                        </button>
                    </div>
                </div>

            </div>
        `;

        portal.innerHTML = html;
        this.bindEvents();
    }

    selectIncident(reportId) {
        alert(`INCIDENT SELECTED: ${reportId}. Control Unit mitigation settings loaded.`);
    }

    toggleMitigation(key) {
        this.mitigationsApplied[key] = !this.mitigationsApplied[key];
        console.log("[ARES Control Unit] Toggled Mitigation:", key, this.mitigationsApplied[key]);
    }

    assembleUnit(unitName) {
        if (!this.assembledUnits.includes(unitName)) {
            this.assembledUnits.push(unitName);
            alert(`TACTICAL UNIT ASSEMBLED: ${unitName} ready for cluster deployment.`);
            if (window.aresTelemetryData) this.renderTeamPortal(window.aresTelemetryData);
        }
    }

    bindEvents() {
        const returnBtn = document.getElementById('btn-return-hq');
        const dispatchBtn = document.getElementById('btn-dispatch-hq-report');

        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                const teamPortal = document.getElementById('team-portal-screen');
                const splash = document.getElementById('splash-screen');
                if (teamPortal) teamPortal.style.display = 'none';
                if (splash) splash.classList.remove('unlocked');
            });
        }

        if (dispatchBtn) {
            dispatchBtn.addEventListener('click', async () => {
                const notes = document.getElementById('txt-hq-notes').value.trim();
                const reportCode = this.activeIncident ? this.activeIncident.report_id : `RPT-${Date.now()}`;
                const teamId = sessionStorage.getItem('ARES_ACTIVE_USER') || 'TEAM-01';

                const SUPABASE_URL = 'https://nbxafhihdrmyxpihasjd.supabase.co';
                const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieGFmaGloZHJteXhwaWhhc2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTI1MjAsImV4cCI6MjEwNjA2ODUyMH0.9GKb-FrYfppq2SQYh6oljPryHTJyl73onadBseiD9rA';

                const headers = {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                };

                const alertPayload = {
                    severity: 'INFO',
                    source_module: 'TEAM_PORTAL',
                    message: `[${teamId}] HQ DISPATCH: ${reportCode} — ${notes || 'Threat mitigated. Cluster secure.'}`,
                    sector_id: this.activeIncident ? this.activeIncident.target_cluster : 'SEC-01-ISB',
                    resolved: true,
                    payload: {
                        mitigations: this.mitigationsApplied,
                        assembled_units: this.assembledUnits,
                        officer_notes: notes
                    }
                };

                try {
                    await fetch(`${SUPABASE_URL}/rest/v1/alert_logs`, {
                        method: 'POST', headers, body: JSON.stringify(alertPayload)
                    });
                    alert(`✅ REPORT DISPATCHED TO SUPABASE!\n\nIncident: ${reportCode}\nTeam: ${teamId}\nMitigations Applied\nUnits: ${this.assembledUnits.join(', ') || 'Alpha Cyber'}\n\nCheck Supabase → alert_logs table.`);
                } catch (e) {
                    alert(`DISPATCH SENT (local only)\nSupabase error: ${e.message}`);
                }

                this.activeIncident = null;
                this.assembledUnits = [];
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aresTeamPortal = new AresTeamPortal();
});
