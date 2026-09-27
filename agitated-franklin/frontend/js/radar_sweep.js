/* =====================================================================
   ARES — HTML5 Canvas Tactical Radar Sweep Visualizer
   ===================================================================== */

class RadarSweepVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.angle = 0;
        this.blips = [
            { x: 0.2, y: -0.4, label: "SEC-01 (ISB)", color: "#00f3ff", opacity: 1.0 },
            { x: 0.4, y: 0.3, label: "SEC-02 (LHR)", color: "#00ff9d", opacity: 0.8 },
            { x: -0.5, y: 0.6, label: "SEC-03 (KHI)", color: "#ffc800", opacity: 0.9 },
            { x: -0.3, y: -0.5, label: "SEC-04 (PEW)", color: "#b026ff", opacity: 0.7 },
            { x: -0.6, y: -0.1, label: "SEC-05 (UET)", color: "#ff0055", opacity: 1.0 }
        ];

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        this.width = this.canvas.width = this.canvas.parentElement.clientWidth || 300;
        this.height = this.canvas.height = this.canvas.parentElement.clientHeight || 300;
        this.radius = Math.min(this.width, this.height) * 0.42;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const ctx = this.ctx;
        const cx = this.centerX;
        const cy = this.centerY;
        const r = this.radius;

        // Clear canvas with faint trail fade
        ctx.fillStyle = 'rgba(5, 8, 14, 0.25)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw Radar Range Rings
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;

        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, (r / 3) * i, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw Crosshairs
        ctx.beginPath();
        ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
        ctx.stroke();

        // Draw Sweeping Beam
        this.angle += 0.025;
        if (this.angle > Math.PI * 2) this.angle = 0;

        const sweepX = cx + Math.cos(this.angle) * r;
        const sweepY = cy + Math.sin(this.angle) * r;

        const gradient = ctx.createConicGradient(this.angle - Math.PI / 4, cx, cy);
        gradient.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
        gradient.addColorStop(0.1, 'rgba(0, 240, 255, 0.05)');
        gradient.addColorStop(0.2, 'transparent');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Beam Leading Edge Line
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sweepX, sweepY);
        ctx.stroke();

        // Draw Blips (Sector Zone Targets)
        this.blips.forEach(b => {
            const bx = cx + b.x * r;
            const by = cy + b.y * r;

            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(bx, by, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Consolas, monospace';
            ctx.fillText(b.label, bx + 8, by + 4);
        });
    }

    updateBlipLoads(sectorLoads) {
        if (!sectorLoads || !Array.isArray(sectorLoads)) return;
        sectorLoads.forEach((s, idx) => {
            if (this.blips[idx]) {
                if (s.alert_status === 'CRITICAL') this.blips[idx].color = '#ff0055';
                else if (s.alert_status === 'ELEVATED') this.blips[idx].color = '#ffaa00';
                else this.blips[idx].color = '#00ff88';
            }
        });
    }
}
