# ARES — Advanced Reconnaissance and Event Security System
> **Academic OS-Concepts & System Telemetry Framework**

ARES is a Linux system-monitoring and OS-concepts simulation framework. It treats system resources (processes, threads, memory, files) as "operational assets" and visualizes their state on a themed command dashboard, including a 3D Three.js grid canvas and a stylized map of Pakistan divided into fictional Sector Zones for visual flair.

---

## 🏛 System Architecture (4 Layers)

```
Layer 1: Reconnaissance Unit (Monitoring)
   ├── Process Tracker (/proc & WinAPI EnumProcesses)
   ├── CPU Monitor (Global & multi-core %)
   ├── Memory Monitor (RAM & Swap occupancy)
   └── File Activity Monitor (inotify / std::filesystem directory watcher)

Layer 2: Tactical Analysis Unit
   ├── CPU Scheduling Simulator (FCFS, SJF non-preemptive, Priority, Round-Robin)
   ├── Memory Allocation Analyzer (FIFO, LRU, Optimal page replacement)
   ├── Deadlock Detection Module (Resource Allocation Graph & Banker's Safety)
   └── IPC & Synchronization Engine (Pipes, Shared Memory, Race Condition toggle)

Layer 3: Command Coordination Unit
   ├── Thread Scheduler (Multi-threaded C++ engine)
   ├── Synchronization Controller (mutex / condition_variable)
   └── Built-in WebSocket & HTTP Server

Layer 4: Visualization Command Center
   ├── 3D Cyber Command Center (Three.js particle & grid canvas)
   ├── Interactive Pakistan Sector-Zone Map (fictional sector nodes: Islamabad, Lahore, Karachi, Peshawar, Quetta)
   ├── Real-time process hierarchy tree & telemetry cards
   └── Supabase Cloud Database Audit Log integration
```

---

## 🚀 Quick Start Guide

### 1. Backend C++ Core Build & Run
Prerequisites: C++17 compatible compiler (GCC, Clang, or MSVC) and CMake (3.14+).

```bash
cd backend
cmake -B build -S .
cmake --build build --config Release
```

Launch the executable:
- **Windows**: `build\Release\ares_backend.exe`
- **Linux / macOS**: `./build/ares_backend`

The C++ backend will start listening on `http://localhost:8080/api/telemetry`.

### 2. Frontend Command Dashboard
Open `frontend/index.html` in any modern web browser (Google Chrome, Firefox, Microsoft Edge, Safari).

*Note: The frontend includes auto-fallback simulation mode so all 3D Three.js visualizations, Pakistan Sector Map pulses, Gantt charts, Page Replacement grids, RAG graphs, and Mutex toggles function seamlessly out-of-the-box even if the C++ backend is offline.*

### 3. Supabase Cloud Database Integration
1. Open your [Supabase Dashboard](https://supabase.com).
2. Execute the DDL SQL script located at `database/schema.sql` in your Supabase SQL Editor.
3. Open the **SUPABASE AUDIT LOGS** tab in the ARES Web Dashboard and enter your Project URL and Anon API key to enable cloud audit logging.

---

## 🗺 Pakistan Sector Map Overlay Note
The Pakistan map in the dashboard uses **fictional "Sector Zones"** (Sector-1 Islamabad, Sector-2 Lahore, Sector-3 Karachi, Sector-4 Peshawar, Sector-5 Quetta) mapped onto major cities for visual telemetry demonstration — it does **not** represent real military installations or classified locations. Each sector is a visual label tied to a monitored process/resource cluster in the simulation.
