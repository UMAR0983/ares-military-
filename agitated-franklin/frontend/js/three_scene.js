/* =====================================================================
   ARES — Three.js 3D Command Center Visualization
   ===================================================================== */

class AresThreeScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.grid = null;
        this.particles = null;
        this.coreNode = null;
        this.sectorCylinders = [];

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 600;
        const height = this.container.clientHeight || 400;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x070b14, 0.035);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(0, 18, 28);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x00f3ff, 2, 50);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);

        // 3D Grid Terrain
        const gridHelper = new THREE.GridHelper(50, 40, 0x00f3ff, 0x004466);
        gridHelper.position.y = -2;
        this.scene.add(gridHelper);
        this.grid = gridHelper;

        // Central Core Cyber Orb
        const orbGeo = new THREE.IcosahedronGeometry(3, 2);
        const orbMat = new THREE.MeshPhongMaterial({
            color: 0x00f3ff,
            wireframe: true,
            emissive: 0x0088aa,
            shininess: 100
        });
        this.coreNode = new THREE.Mesh(orbGeo, orbMat);
        this.coreNode.position.set(0, 4, 0);
        this.scene.add(this.coreNode);

        // Rotating Particle Field
        const particleCount = 200;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 40;
            positions[i + 1] = Math.random() * 20;
            positions[i + 2] = (Math.random() - 0.5) * 40;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x00ff9d,
            size: 0.3,
            transparent: true,
            opacity: 0.8
        });

        this.particles = new THREE.Points(particleGeo, particleMat);
        this.scene.add(this.particles);

        // 5 Fictional Sector Pillars around the core
        const sectorColors = [0x00f3ff, 0x00ff9d, 0xffc800, 0xb026ff, 0xff0055];
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = Math.cos(angle) * 12;
            const z = Math.sin(angle) * 12;

            const cylGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
            const cylMat = new THREE.MeshPhongMaterial({
                color: sectorColors[i],
                transparent: true,
                opacity: 0.85
            });
            const cyl = new THREE.Mesh(cylGeo, cylMat);
            cyl.position.set(x, 1, z);
            this.scene.add(cyl);
            this.sectorCylinders.push(cyl);
        }

        // Handle Resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Animation Loop
        this.animate();
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    updateSectorHeights(sectorLoads) {
        if (!sectorLoads || !Array.isArray(sectorLoads)) return;
        sectorLoads.forEach((s, idx) => {
            if (this.sectorCylinders[idx]) {
                const targetScale = Math.max(0.5, (s.cpu_load / 100) * 2.5);
                this.sectorCylinders[idx].scale.y = targetScale;
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.coreNode) {
            this.coreNode.rotation.y += 0.01;
            this.coreNode.rotation.x += 0.005;
        }

        if (this.particles) {
            this.particles.rotation.y += 0.002;
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
