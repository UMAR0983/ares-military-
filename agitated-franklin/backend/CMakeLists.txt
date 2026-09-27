cmake_minimum_required(VERSION 3.14)
project(ARES_Core_Engine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(src)

set(COMMON_SOURCES
    src/logger.cpp
    src/config_manager.cpp
    src/supabase_service.cpp
    src/attack_injector.cpp
    src/cluster_manager.cpp
    src/process_monitor.cpp
    src/cpu_monitor.cpp
    src/memory_monitor.cpp
    src/file_monitor.cpp
    src/scheduler_sim.cpp
    src/memory_sim.cpp
    src/deadlock_detector.cpp
    src/ipc_demo.cpp
    src/ws_server.cpp
)

# Main Executable
add_executable(ares_backend src/main.cpp ${COMMON_SOURCES})

# Unit Test Suite Executable
add_executable(ares_test_runner tests/test_runner.cpp ${COMMON_SOURCES})

if(WIN32)
    target_link_libraries(ares_backend PRIVATE ws2_32 psapi)
    target_link_libraries(ares_test_runner PRIVATE ws2_32 psapi)
else()
    target_link_libraries(ares_backend PRIVATE pthread)
    target_link_libraries(ares_test_runner PRIVATE pthread)
endif()
