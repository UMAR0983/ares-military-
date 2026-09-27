/* =====================================================================
   ARES — Deadlock Detector & Resource Allocation Graph (RAG) View
   ===================================================================== */

class DeadlockView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    renderDeadlockReport(deadlockData) {
        if (!this.container) return;
        if (!deadlockData) deadlockData = this.getDefaultSampleData(false);

        const hasDeadlock = deadlockData.has_deadlock;
        const isSafe = deadlockData.is_safe_state;

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; height: 100%;">
                
                <!-- Left Column: Status & Banker's Safety -->
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div class="panel" style="padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="color: var(--neon-cyan);">DEADLOCK DETECTION STATUS</h3>
                            <button class="btn-tactical ${hasDeadlock ? '' : 'danger'}" id="btn-toggle-deadlock-inject">
                                ${hasDeadlock ? 'RESOLVE DEADLOCK' : 'INJECT DEADLOCK SCENARIO'}
                            </button>
                        </div>

                        <div style="display: flex; gap: 12px; margin-bottom: 14px;">
                            <div class="metric-card" style="flex: 1; border-color: ${hasDeadlock ? 'var(--neon-red)' : 'var(--neon-green)'};">
                                <div class="val" style="color: ${hasDeadlock ? 'var(--neon-red)' : 'var(--neon-green)'};">
                                    ${hasDeadlock ? 'DETECTED' : 'CLEAR'}
                                </div>
                                <div class="label">RAG Cycle Status</div>
                            </div>
                            <div class="metric-card" style="flex: 1; border-color: ${isSafe ? 'var(--neon-green)' : 'var(--neon-yellow)'};">
                                <div class="val" style="color: ${isSafe ? 'var(--neon-green)' : 'var(--neon-yellow)'};">
                                    ${isSafe ? 'SAFE' : 'UNSAFE'}
                                </div>
                                <div class="label">Banker's Safety State</div>
                            </div>
                        </div>

                        <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 4px; border: 1px solid var(--border-cyan);">
                            <div style="font-weight: bold; color: var(--neon-cyan); margin-bottom: 4px;">Banker's Safe Execution Sequence:</div>
                            <div style="font-family: var(--font-mono); color: var(--neon-green); font-size: 1.1rem;">
                                ${isSafe && deadlockData.safe_sequence ? deadlockData.safe_sequence.map(p => `P${p}`).join(' ➔ ') : '<span style="color: var(--neon-red);">No Safe Sequence Available (Unsafe State)</span>'}
                            </div>
                        </div>
                    </div>

                    <!-- IPC & Race Condition Panel -->
                    <div class="panel" style="padding: 16px; flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="color: var(--neon-cyan);">IPC & THREAD SYNCHRONIZATION DEMO</h3>
                            <button class="btn-tactical" id="btn-toggle-mutex">TOGGLE MUTEX LOCK</button>
                        </div>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
                            Demonstrates 10 concurrent threads updating shared memory segment <code style="color: var(--neon-cyan);">/ares_shm_telemetry</code>.
                        </p>
                        <div id="ipc-race-output" style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85rem; border: 1px solid var(--border-cyan);">
                            Loading IPC telemetry data...
                        </div>
                    </div>
                </div>

                <!-- Right Column: Interactive Resource Allocation Graph (RAG) -->
                <div class="panel">
                    <div class="panel-header">
                        <span>RESOURCE ALLOCATION GRAPH (RAG)</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">Processes (Circles) ↔ Resources (Squares)</span>
                    </div>
                    <div class="panel-body" style="display: flex; align-items: center; justify-content: center; position: relative;">
                        <svg id="rag-svg" width="100%" height="100%" viewBox="0 0 450 350" xmlns="http://www.w3.org/2000/svg">
                            ${this.renderRagSvg(deadlockData)}
                        </svg>
                    </div>
                </div>

            </div>
        `;

        this.container.innerHTML = html;
        this.bindEvents(deadlockData);
    }

    renderRagSvg(data) {
        const hasDeadlock = data.has_deadlock;
        const edgeColor = hasDeadlock ? '#ff0055' : '#00f3ff';

        return `
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="${edgeColor}" />
                </marker>
            </defs>

            <!-- Connections -->
            <line x1="80" y1="100" x2="220" y2="100" stroke="${edgeColor}" stroke-width="2" marker-end="url(#arrow)"/>
            <line x1="220" y1="100" x2="220" y2="220" stroke="${edgeColor}" stroke-width="2" marker-end="url(#arrow)"/>
            <line x1="220" y1="220" x2="360" y2="220" stroke="${edgeColor}" stroke-width="2" marker-end="url(#arrow)"/>
            ${hasDeadlock ? `<line x1="360" y1="220" x2="80" y2="100" stroke="#ff0055" stroke-width="3" stroke-dasharray="5,5" marker-end="url(#arrow)"/>` : ''}

            <!-- Nodes -->
            <!-- P1 -->
            <circle cx="80" cy="100" r="24" fill="rgba(0, 243, 255, 0.15)" stroke="#00f3ff" stroke-width="2"/>
            <text x="80" y="105" text-anchor="middle" fill="#fff" font-weight="bold" font-family="Consolas">P1</text>

            <!-- R1 -->
            <rect x="196" y="76" width="48" height="48" fill="rgba(0, 255, 157, 0.15)" stroke="#00ff9d" stroke-width="2" rx="4"/>
            <text x="220" y="105" text-anchor="middle" fill="#fff" font-weight="bold" font-family="Consolas">R1</text>

            <!-- P2 -->
            <circle cx="220" cy="220" r="24" fill="rgba(0, 243, 255, 0.15)" stroke="#00f3ff" stroke-width="2"/>
            <text x="220" y="225" text-anchor="middle" fill="#fff" font-weight="bold" font-family="Consolas">P2</text>

            <!-- R2 -->
            <rect x="336" y="196" width="48" height="48" fill="rgba(0, 255, 157, 0.15)" stroke="#00ff9d" stroke-width="2" rx="4"/>
            <text x="360" y="225" text-anchor="middle" fill="#fff" font-weight="bold" font-family="Consolas">R2</text>
        `;
    }

    bindEvents(currentData) {
        const toggleBtn = document.getElementById('btn-toggle-deadlock-inject');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const newData = this.getDefaultSampleData(!currentData.has_deadlock);
                this.renderDeadlockReport(newData);
            });
        }
    }

    updateIpcOutput(ipcData) {
        const el = document.getElementById('ipc-race-output');
        if (!el || !ipcData) return;
        const res = ipcData.race_test_result || {};
        el.innerHTML = `
            <div>Mutex Protection: <strong style="color: ${res.mutex_enabled ? 'var(--neon-green)' : 'var(--neon-red)'};">${res.mutex_enabled ? 'ENABLED (SAFE)' : 'DISABLED (UNSAFE)'}</strong></div>
            <div>Expected Iterations: <strong>${res.expected_count || 10000}</strong> | Actual Counter: <strong style="color: ${res.status === 'SAFE' ? 'var(--neon-green)' : 'var(--neon-red)'};">${res.actual_count || 10000}</strong></div>
            <div>Execution Speed: <strong>${res.execution_time_ms ? res.execution_time_ms.toFixed(2) : 10.5} ms</strong></div>
            <div>Race Condition Status: <span style="color: ${res.status === 'SAFE' ? 'var(--neon-green)' : 'var(--neon-red)'}; font-weight: bold;">${res.status || 'SAFE'}</span></div>
        `;
    }

    getDefaultSampleData(deadlocked) {
        return {
            has_deadlock: deadlocked,
            is_safe_state: !deadlocked,
            safe_sequence: deadlocked ? [] : [1, 3, 4, 0, 2]
        };
    }
}
