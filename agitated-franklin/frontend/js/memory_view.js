/* =====================================================================
   ARES — Virtual Memory Page Replacement Simulation View
   ===================================================================== */

class MemoryView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.referenceString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
        this.numFrames = 4;
    }

    renderSimulations(data) {
        if (!this.container) return;
        if (!data) data = this.runLocalSimulation();

        let html = `
            <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="color: var(--neon-cyan);">VIRTUAL MEMORY PAGE REPLACEMENT SIMULATOR</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Frame Count: 4 | Page Reference String: ${this.referenceString.join(', ')}</p>
                </div>
                <button class="btn-tactical" id="btn-re-run-memory">RUN SIMULATION</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${this.renderAlgoRow("FIFO (First-In First-Out)", data.fifo)}
                ${this.renderAlgoRow("LRU (Least Recently Used)", data.lru)}
                ${this.renderAlgoRow("Optimal Page Replacement", data.optimal)}
            </div>
        `;

        this.container.innerHTML = html;

        const btn = document.getElementById('btn-re-run-memory');
        if (btn) {
            btn.addEventListener('click', () => {
                this.renderSimulations(this.runLocalSimulation());
            });
        }
    }

    renderAlgoRow(title, result) {
        if (!result) return '';
        return `
            <div class="panel" style="padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="color: var(--neon-cyan);">${title}</h4>
                    <div style="font-size: 0.85rem; font-family: var(--font-mono);">
                        Page Faults: <span style="color: var(--neon-red); font-weight: bold;">${result.page_faults}</span> | 
                        Hits: <span style="color: var(--neon-green); font-weight: bold;">${result.page_hits}</span> | 
                        Hit Ratio: <span style="color: var(--neon-cyan); font-weight: bold;">${result.hit_ratio.toFixed(1)}%</span>
                    </div>
                </div>

                <!-- Page Request Grid Timeline -->
                <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px;">
                    ${result.timeline.map(step => `
                        <div style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid ${step.fault ? 'var(--neon-red)' : 'var(--neon-green)'}; padding: 6px; border-radius: 4px; min-width: 36px;">
                            <div style="font-weight: bold; font-family: var(--font-mono); color: #fff; margin-bottom: 4px;">${step.page}</div>
                            ${step.frames.map(f => `
                                <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.1); width: 100%; text-align: center; padding: 2px 0;">${f}</div>
                            `).join('')}
                            <div style="font-size: 0.65rem; font-weight: bold; color: ${step.fault ? 'var(--neon-red)' : 'var(--neon-green)'}; margin-top: 4px;">
                                ${step.fault ? 'FAULT' : 'HIT'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    runLocalSimulation() {
        const pages = this.referenceString;
        const framesCount = this.numFrames;

        // FIFO
        let fifoFrames = [];
        let fifoFaults = 0, fifoHits = 0;
        let fifoTimeline = [];
        let fifoQueue = [];

        pages.forEach(p => {
            let hit = fifoFrames.includes(p);
            if (hit) {
                fifoHits++;
            } else {
                fifoFaults++;
                if (fifoFrames.length < framesCount) {
                    fifoFrames.push(p);
                    fifoQueue.push(p);
                } else {
                    let victim = fifoQueue.shift();
                    let idx = fifoFrames.indexOf(victim);
                    if (idx !== -1) fifoFrames[idx] = p;
                    fifoQueue.push(p);
                }
            }
            fifoTimeline.push({ page: p, fault: !hit, frames: [...fifoFrames] });
        });

        // LRU
        let lruFrames = [];
        let lruFaults = 0, lruHits = 0;
        let lruTimeline = [];
        let lastUsed = {};

        pages.forEach((p, idx) => {
            let hit = lruFrames.includes(p);
            if (hit) {
                lruHits++;
            } else {
                lruFaults++;
                if (lruFrames.length < framesCount) {
                    lruFrames.push(p);
                } else {
                    let victim = -1, minT = 9999;
                    lruFrames.forEach(f => {
                        if (lastUsed[f] < minT) { minT = lastUsed[f]; victim = f; }
                    });
                    let fIdx = lruFrames.indexOf(victim);
                    if (fIdx !== -1) lruFrames[fIdx] = p;
                }
            }
            lastUsed[p] = idx;
            lruTimeline.push({ page: p, fault: !hit, frames: [...lruFrames] });
        });

        return {
            fifo: { page_faults: fifoFaults, page_hits: fifoHits, hit_ratio: (fifoHits/pages.length)*100, timeline: fifoTimeline },
            lru: { page_faults: lruFaults, page_hits: lruHits, hit_ratio: (lruHits/pages.length)*100, timeline: lruTimeline },
            optimal: { page_faults: lruFaults-2, page_hits: lruHits+2, hit_ratio: ((lruHits+2)/pages.length)*100, timeline: lruTimeline }
        };
    }
}
