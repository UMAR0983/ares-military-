/* =====================================================================
   ARES — Interactive Pakistan Sector Map Component
   Fictional Sector Zones mapped onto major geographical nodes
   ===================================================================== */

class PakistanSectorMap {
    constructor(containerId, onSectorSelectCallback) {
        this.container = document.getElementById(containerId);
        this.onSelect = onSectorSelectCallback;
        this.sectors = [
            { id: 1, name: "Sector-1 (Islamabad Core)", cx: 340, cy: 150, color: "#00f3ff", cpu: 24, mem: 45, status: "NORMAL" },
            { id: 2, name: "Sector-2 (Lahore Hub)", cx: 370, cy: 220, color: "#00ff9d", cpu: 48, mem: 60, status: "NORMAL" },
            { id: 3, name: "Sector-3 (Karachi Coastal)", cx: 160, cy: 460, color: "#ffc800", cpu: 32, mem: 50, status: "NORMAL" },
            { id: 4, name: "Sector-4 (Peshawar Ridge)", cx: 290, cy: 120, color: "#b026ff", cpu: 15, mem: 30, status: "NORMAL" },
            { id: 5, name: "Sector-5 (Quetta Outpost)", cx: 140, cy: 280, color: "#ff0055", cpu: 65, mem: 75, status: "ELEVATED" }
        ];

        this.render();
    }

    render() {
        if (!this.container) return;

        // Public Domain SVG map outline of Pakistan + Sector Zone Nodes
        const svgContent = `
            <svg class="map-svg" viewBox="0 0 500 550" xmlns="http://www.w3.org/2000/svg">
                <!-- Grid background overlay -->
                <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 243, 255, 0.08)" stroke-width="1"/>
                    </pattern>
                </defs>
                <rect width="500" height="550" fill="url(#grid)" />

                <!-- Stylized Polygon Map Outline of Pakistan -->
                <path d="M 280,40 L 320,60 L 380,100 L 400,160 L 390,240 L 340,300 L 260,350 L 200,420 L 160,490 L 120,480 L 70,440 L 40,360 L 70,280 L 120,240 L 180,180 L 230,120 Z" 
                      fill="rgba(0, 243, 255, 0.04)" 
                      stroke="rgba(0, 243, 255, 0.4)" 
                      stroke-width="2" 
                      stroke-dasharray="6,3" />

                <!-- Tactical Grid Intersect Lines -->
                <line x1="250" y1="20" x2="250" y2="530" stroke="rgba(0,243,255,0.15)" stroke-width="1" stroke-dasharray="2,2"/>
                <line x1="20" y1="275" x2="480" y2="275" stroke="rgba(0,243,255,0.15)" stroke-width="1" stroke-dasharray="2,2"/>

                <!-- Connective Tactical Link Lines between Sectors -->
                <line x1="340" y1="150" x2="370" y2="220" stroke="rgba(0,243,255,0.3)" stroke-width="1.5"/>
                <line x1="370" y1="220" x2="160" y2="460" stroke="rgba(0,243,255,0.3)" stroke-width="1.5"/>
                <line x1="340" y1="150" x2="290" y2="120" stroke="rgba(0,243,255,0.3)" stroke-width="1.5"/>
                <line x1="290" y1="120" x2="140" y2="280" stroke="rgba(0,243,255,0.3)" stroke-width="1.5"/>
                <line x1="140" y1="280" x2="160" y2="460" stroke="rgba(0,243,255,0.3)" stroke-width="1.5"/>

                <!-- Sector Zone Marker Nodes -->
                ${this.sectors.map(s => `
                    <g class="sector-node" id="sector-node-${s.id}" data-id="${s.id}">
                        <!-- Animated Pulse Ring -->
                        <circle class="pulse-ring" cx="${s.cx}" cy="${s.cy}" r="12" fill="none" stroke="${this.getStatusColor(s.status)}" stroke-width="2"/>
                        <!-- Core Circle -->
                        <circle cx="${s.cx}" cy="${s.cy}" r="8" fill="${this.getStatusColor(s.status)}" stroke="#fff" stroke-width="1.5"/>
                        <!-- Text Label -->
                        <text x="${s.cx + 14}" y="${s.cy + 4}" fill="#fff" font-size="11" font-weight="bold" font-family="Consolas, monospace" letter-spacing="1">
                            ${s.name.split(' ')[0]}
                        </text>
                        <text x="${s.cx + 14}" y="${s.cy + 16}" fill="rgba(0,243,255,0.8)" font-size="9" font-family="Consolas, monospace">
                            LOAD: <tspan id="sector-load-${s.id}">${s.cpu}%</tspan>
                        </text>
                    </g>
                `).join('')}
            </svg>
        `;

        this.container.innerHTML = svgContent;
        this.bindEvents();
    }

    getStatusColor(status) {
        if (status === "CRITICAL") return "#ff0055";
        if (status === "ELEVATED") return "#ffc800";
        return "#00f3ff";
    }

    bindEvents() {
        this.sectors.forEach(s => {
            const el = document.getElementById(`sector-node-${s.id}`);
            if (el) {
                el.addEventListener('click', () => {
                    if (typeof this.onSelect === 'function') {
                        this.onSelect(s);
                    }
                });
            }
        });
    }

    updateSectorData(serverSectors) {
        if (!serverSectors || !Array.isArray(serverSectors)) return;

        serverSectors.forEach(ss => {
            const match = this.sectors.find(s => s.id === ss.sector_id);
            if (match) {
                match.cpu = Math.round(ss.cpu_load);
                match.mem = Math.round(ss.memory_load);
                match.status = ss.alert_status;

                const nodeEl = document.getElementById(`sector-node-${ss.sector_id}`);
                const loadText = document.getElementById(`sector-load-${ss.sector_id}`);

                if (loadText) {
                    loadText.textContent = `${match.cpu}%`;
                }

                if (nodeEl) {
                    const color = this.getStatusColor(match.status);
                    const circles = nodeEl.querySelectorAll('circle');
                    if (circles[0]) circles[0].setAttribute('stroke', color);
                    if (circles[1]) circles[1].setAttribute('fill', color);
                }
            }
        });
    }
}
