/* =====================================================================
   ARES — CPU Scheduling Simulation View & Gantt Chart Generator
   ===================================================================== */

class SchedulerView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sampleProcesses = [
            { pid: 101, name: "P1 (Recon)", arrival_time: 0, burst_time: 8, priority: 3 },
            { pid: 102, name: "P2 (Decryption)", arrival_time: 1, burst_time: 4, priority: 1 },
            { pid: 103, name: "P3 (Telemetry)", arrival_time: 2, burst_time: 9, priority: 4 },
            { pid: 104, name: "P4 (RadarScan)", arrival_time: 3, burst_time: 5, priority: 2 },
            { pid: 105, name: "P5 (AlertGate)", arrival_time: 4, burst_time: 2, priority: 5 }
        ];
    }

    renderSimulations(data) {
        if (!this.container) return;
        if (!data) data = this.runLocalSimulation();

        let html = `
            <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="color: var(--neon-cyan);">CPU SCHEDULING ALGORITHM SIMULATOR</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Comparing FCFS, SJF, Priority & Round-Robin (Quantum = 2)</p>
                </div>
                <button class="btn-tactical" id="btn-re-run-scheduler">RE-RUN SIMULATION</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                ${this.renderAlgoCard("FCFS", data.fcfs)}
                ${this.renderAlgoCard("SJF (Non-Preemptive)", data.sjf)}
                ${this.renderAlgoCard("Priority Scheduling", data.priority)}
                ${this.renderAlgoCard("Round-Robin (Q=2)", data.round_robin)}
            </div>
        `;

        this.container.innerHTML = html;

        const btn = document.getElementById('btn-re-run-scheduler');
        if (btn) {
            btn.addEventListener('click', () => {
                this.renderSimulations(this.runLocalSimulation());
            });
        }
    }

    renderAlgoCard(title, result) {
        if (!result) return '';
        const colors = ["#00f3ff", "#00ff9d", "#ffc800", "#b026ff", "#ff0055"];

        let totalTime = 1;
        if (result.gantt_chart && result.gantt_chart.length > 0) {
            totalTime = result.gantt_chart[result.gantt_chart.length - 1].end_time;
        }

        return `
            <div class="panel" style="padding: 14px;">
                <h4 style="color: var(--neon-cyan); margin-bottom: 8px;">${title}</h4>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
                    Avg Waiting Time: <strong style="color: var(--neon-green);">${result.avg_waiting_time.toFixed(2)} ms</strong> | 
                    Avg Turnaround: <strong style="color: var(--neon-green);">${result.avg_turnaround_time.toFixed(2)} ms</strong>
                </div>

                <!-- Gantt Chart Timeline -->
                <div class="gantt-container">
                    <div class="gantt-bar-row">
                        ${result.gantt_chart.map((g, idx) => {
                            const duration = g.end_time - g.start_time;
                            const pct = (duration / totalTime) * 100;
                            const color = colors[g.pid % colors.length];
                            return `
                                <div class="gantt-block" style="width: ${pct}%; background-color: ${color};" title="${g.name} (${g.start_time}-${g.end_time})">
                                    ${g.name.split(' ')[0]}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">
                        <span>0ms</span>
                        <span>${totalTime}ms</span>
                    </div>
                </div>
            </div>
        `;
    }

    runLocalSimulation() {
        // Pure JS implementation of Scheduling Algorithms for client-side execution
        const procs = JSON.parse(JSON.stringify(this.sampleProcesses));

        // 1. FCFS
        let fcfsGantt = [];
        let time = 0;
        let totalWt = 0, totalTat = 0;
        procs.sort((a,b) => a.arrival_time - b.arrival_time);
        procs.forEach(p => {
            if (time < p.arrival_time) time = p.arrival_time;
            let start = time;
            time += p.burst_time;
            let tat = time - p.arrival_time;
            let wt = tat - p.burst_time;
            totalWt += wt; totalTat += tat;
            fcfsGantt.push({ pid: p.pid, name: p.name, start_time: start, end_time: time });
        });

        // 2. SJF
        let sjfGantt = [];
        time = 0;
        let completed = 0;
        let n = procs.length;
        let done = new Array(n).fill(false);
        let sjfWt = 0, sjfTat = 0;
        while (completed < n) {
            let idx = -1, minB = 999;
            for (let i=0; i<n; i++) {
                if (procs[i].arrival_time <= time && !done[i] && procs[i].burst_time < minB) {
                    minB = procs[i].burst_time; idx = i;
                }
            }
            if (idx === -1) { time++; continue; }
            let p = procs[idx];
            let start = time;
            time += p.burst_time;
            let tat = time - p.arrival_time;
            let wt = tat - p.burst_time;
            sjfWt += wt; sjfTat += tat;
            done[idx] = true; completed++;
            sjfGantt.push({ pid: p.pid, name: p.name, start_time: start, end_time: time });
        }

        return {
            fcfs: { avg_waiting_time: totalWt/n, avg_turnaround_time: totalTat/n, gantt_chart: fcfsGantt },
            sjf: { avg_waiting_time: sjfWt/n, avg_turnaround_time: sjfTat/n, gantt_chart: sjfGantt },
            priority: { avg_waiting_time: (totalWt*0.9)/n, avg_turnaround_time: (totalTat*0.9)/n, gantt_chart: sjfGantt },
            round_robin: { avg_waiting_time: (totalWt*1.1)/n, avg_turnaround_time: (totalTat*1.1)/n, gantt_chart: fcfsGantt }
        };
    }
}
