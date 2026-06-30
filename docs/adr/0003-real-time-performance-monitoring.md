# ADR 0003: Real-Time Performance Telemetry & Monitoring

## Status
Accepted

## Context
DinarFlow processes high-frequency payment requests where high-latency bottlenecks represent an operational threat. Compliance officers and DevOps engineers need real-time system health data, latency p95/p99 spikes, memory footprint, and route request streams to maintain high availability.

## Decision
We implemented a dedicated **Performance Telemetry and VM Monitor** layer:

```
 [ Incoming Request ]
         │
         ▼
 ┌─────────────────────────┐
 │ Performance Middleware  │ ──► Captures process.hrtime() start
 └─────────────────────────┘
         │
         ▼
 [ Business Logic Handler ]
         │
         ▼
 ┌─────────────────────────┐
 │  Res.on('finish') Hook  │ ──► Calculates durationMs
 └─────────────────────────┘     Reads process.memoryUsage()
         │
         ▼
 ┌─────────────────────────┐
 │ Telemetry Ring Buffer   │ ──► Records RequestMetric (max 1000 items)
 └─────────────────────────┘
```

### 1. Zero-Dependency HRTime Profiler
We utilize `process.hrtime()` inside a custom global middleware on the Express server to calculate transactional latency at the nanosecond scale, converted to milliseconds (`durationMs`).

### 2. V8 Virtual Machine Hooks
The monitoring endpoint gathers V8 heap memory statistics (`process.memoryUsage()`), including:
- **heapUsed**: Memory actively occupied by JavaScript structures.
- **heapTotal**: Total virtual machine reservation.
- **rss (Resident Set Size)**: Physical memory footprint of the container.

### 3. Metric Aggregations & Buffering
- **Percentile Tracking**: The server dynamically calculates the **P95 and P99 latency** metrics upon query.
- **Route Leaderboard**: A hashmap tracks hit counters, average latencies, and error totals grouped by HTTP route patterns.
- **Log Buffer**: Stores the last 1,000 HTTP requests in a high-speed, thread-safe memory array, eliminating database query overhead.

## Consequences
- **Minimal Overhead**: Metric collection runs in-memory, avoiding blocking CPU loops or file writes.
- **Proactive Maintenance**: Operations teams can identify route leaks or slowing queries immediately from the **Performance Monitor** panel in the UI.
