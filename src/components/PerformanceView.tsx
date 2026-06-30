import React, { useEffect, useState, useMemo } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Clock, 
  RefreshCw, 
  Play, 
  Pause, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Terminal, 
  Sliders, 
  Search,
  Zap,
  HardDrive
} from 'lucide-react';
import { ApiService } from '../apiService';

interface SystemMetrics {
  cpuLoad: number;
  memoryUsagePercent: number;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
}

interface EndpointMetric {
  endpoint: string;
  count: number;
  averageDurationMs: number;
  errors: number;
}

interface RequestMetric {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  memoryUsageMb: number;
}

interface PerformanceData {
  totalRequests: number;
  averageDurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  errorRate: number;
  uptimeSeconds: number;
  systemMetrics: SystemMetrics;
  endpoints: EndpointMetric[];
  recentRequests: RequestMetric[];
}

export default function PerformanceView() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(3000); // ms
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Filters
  const [searchPath, setSearchPath] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [minLatency, setMinLatency] = useState<string>('');

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      const res = await ApiService.getPerformanceMetrics();
      setData(res);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("Failed to fetch performance metrics:", err);
      setError(err.message || 'Failed to retrieve real-time performance telemetry.');
    } finally {
      if (isManual) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(true);
  }, []);

  // Set up polling interval
  useEffect(() => {
    if (isPaused || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchMetrics(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isPaused, refreshInterval]);

  // Format uptime to string
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (!data?.recentRequests) return [];
    return data.recentRequests.filter(req => {
      const matchesSearch = req.path.toLowerCase().includes(searchPath.toLowerCase());
      const matchesMethod = methodFilter === 'ALL' || req.method === methodFilter;
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === '2XX' && req.statusCode >= 200 && req.statusCode < 300) ||
        (statusFilter === '3XX' && req.statusCode >= 300 && req.statusCode < 400) ||
        (statusFilter === '4XX' && req.statusCode >= 400 && req.statusCode < 500) ||
        (statusFilter === '5XX' && req.statusCode >= 500);
      
      const latencyNum = Number(minLatency);
      const matchesLatency = isNaN(latencyNum) || minLatency === '' || req.durationMs >= latencyNum;

      return matchesSearch && matchesMethod && matchesStatus && matchesLatency;
    });
  }, [data?.recentRequests, searchPath, methodFilter, statusFilter, minLatency]);

  // Custom SVG Chart points calculation
  const svgChartProps = useMemo(() => {
    if (!data?.recentRequests || data.recentRequests.length === 0) return null;
    
    // Take up to 40 items for the latency timeline, oldest to newest (left to right)
    const pointsData = [...data.recentRequests].slice(0, 40).reverse();
    if (pointsData.length < 2) return null;

    const padding = 40;
    const width = 800;
    const height = 180;

    const maxLatency = Math.max(...pointsData.map(p => p.durationMs), 5); // ensure min height is at least 5ms
    const minLatencyVal = Math.min(...pointsData.map(p => p.durationMs), 0);

    const xScale = (width - padding * 2) / (pointsData.length - 1);
    const yScale = (height - padding * 2) / (maxLatency - minLatencyVal || 1);

    const points = pointsData.map((p, index) => {
      const x = padding + index * xScale;
      const y = height - padding - (p.durationMs - minLatencyVal) * yScale;
      return { x, y, value: p.durationMs, label: `${p.method} ${p.path}`, status: p.statusCode, time: new Date(p.timestamp).toLocaleTimeString() };
    });

    // Generate SVG path string for line
    const linePath = points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, '');

    // Generate SVG path string for area fill
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
      : '';

    return { points, linePath, areaPath, width, height, maxLatency, minLatencyVal, padding };
  }, [data?.recentRequests]);

  return (
    <div className="space-y-6 animate-fadeIn" id="performance_view_container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-xl p-6 shadow-sm" id="perf_header_card">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">System Performance & Telemetry</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Real-time HTTP routing latencies, system loads, memory profiling, and microsecond ledger auditing.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0" id="perf_controls">
          {/* Refresh Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs" id="refresh_controls_panel">
            <button
              id="btn_play_pause"
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1.5 rounded-md transition-colors ${isPaused ? 'bg-amber-500 text-white' : 'bg-white text-slate-700 shadow-xs'}`}
              title={isPaused ? 'Resume monitoring' : 'Pause monitoring'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            
            <div className="h-4 w-[1px] bg-slate-200" />

            <div className="flex items-center gap-1 px-1.5 text-slate-600" id="refresh_rate_selector">
              <Sliders className="w-3 h-3 text-slate-400" />
              <span>Interval:</span>
              <select
                id="select_refresh_interval"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent border-none font-bold text-slate-800 focus:outline-hidden"
              >
                <option value={1000}>1s</option>
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
              </select>
            </div>
          </div>

          <button
            id="btn_refresh_metrics"
            onClick={() => fetchMetrics(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>

          <span className="text-[10px] text-slate-400 font-mono" id="last_refresh_timestamp">
            Refreshed: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3" id="perf_error_banner">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Telemetry Interruption</span>
            <p className="text-xs mt-1 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="perf_kpi_grid">
        {/* Metric 1: Avg Latency */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="perf_kpi_latency">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Latency</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800">
              {data ? `${data.averageDurationMs.toFixed(2)} ms` : '...'}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px]" id="percentile_details">
              <span className="text-slate-400 font-mono">P95: {data ? `${data.p95DurationMs.toFixed(1)}ms` : '...'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400 font-mono">P99: {data ? `${data.p99DurationMs.toFixed(1)}ms` : '...'}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="perf_kpi_throughput">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Throughput</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800">
              {data ? `${data.totalRequests} reqs` : '...'}
            </span>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1" id="active_conn_info">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Real-time monitoring active
            </p>
          </div>
        </div>

        {/* Metric 3: Error Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="perf_kpi_errors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Error Rate</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${data && data.errorRate > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {data && data.errorRate > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-extrabold ${data && data.errorRate > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {data ? `${data.errorRate.toFixed(2)}%` : '...'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1" id="err_rate_helper">
              Standard HTTP 4xx and 5xx rates
            </p>
          </div>
        </div>

        {/* Metric 4: Node Uptime */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="perf_kpi_uptime">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Server Uptime</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-slate-800 tracking-tight block truncate">
              {data ? formatUptime(data.uptimeSeconds) : '...'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1" id="engine_version_label">
              Running node engine environment
            </p>
          </div>
        </div>
      </div>

      {/* Latency Charts & System Profiler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="perf_main_analytics_section">
        {/* Custom SVG Latency Line Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between" id="perf_latency_timeline_card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Latency Response Timeline</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Microsecond performance profile of last 40 HTTP transactions (Left = Oldest, Right = Newest).</p>
            </div>
            <div className="flex items-center gap-3 text-xs" id="chart_legend">
              <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Latency (ms)
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[180px] bg-slate-50/50 border border-slate-100 rounded-lg p-2" id="svg_canvas_wrapper">
            {svgChartProps ? (
              <div className="w-full h-full relative">
                <svg
                  id="perf_svg_latency_chart"
                  viewBox={`0 0 ${svgChartProps.width} ${svgChartProps.height}`}
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                    const y = svgChartProps.padding + r * (svgChartProps.height - svgChartProps.padding * 2);
                    const val = svgChartProps.maxLatency - r * (svgChartProps.maxLatency - svgChartProps.minLatencyVal);
                    return (
                      <g key={i}>
                        <line
                          x1={svgChartProps.padding}
                          y1={y}
                          x2={svgChartProps.width - svgChartProps.padding}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="0.5"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={svgChartProps.padding - 8}
                          y={y + 3}
                          className="font-mono text-[9px] fill-slate-400 text-right"
                          textAnchor="end"
                        >
                          {val.toFixed(0)} ms
                        </text>
                      </g>
                    );
                  })}

                  {/* Area path */}
                  <path
                    d={svgChartProps.areaPath}
                    fill="url(#latencyGradient)"
                  />

                  {/* Line path */}
                  <path
                    d={svgChartProps.linePath}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {svgChartProps.points.map((pt, i) => {
                    const isSlow = pt.value > 50;
                    const isError = pt.status >= 400;
                    return (
                      <g key={i} className="group cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSlow || isError ? "4.5" : "3.5"}
                          className={`transition-all duration-150 ${
                            isError 
                              ? 'fill-rose-500 hover:r-6' 
                              : isSlow 
                              ? 'fill-amber-500 hover:r-6' 
                              : 'fill-indigo-600 hover:fill-indigo-400 hover:r-6'
                          }`}
                        />
                        {/* Tooltip on Hover */}
                        <title>
                          {`${pt.label}\nDuration: ${pt.value.toFixed(2)} ms\nStatus: ${pt.status}\nTime: ${pt.time}`}
                        </title>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 text-xs py-10" id="no_chart_data">
                <Zap className="w-8 h-8 text-slate-300 animate-bounce mb-2" />
                <span>Collecting transaction latency data...</span>
                <p className="text-[10px] text-slate-400 mt-1">Make actions or click Refresh to fetch live telemetry.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Memory & Resource Profiler */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between" id="perf_resource_profiler_card">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Hardware & Profiler telemetry</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">V8 virtual machine status metrics and active process footprint.</p>
          </div>

          <div className="space-y-5 my-4" id="resource_telemetry_bars">
            {/* Heap Usage */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  V8 Heap Memory Usage
                </span>
                <span className="font-mono text-slate-700">
                  {data ? `${data.systemMetrics.heapUsedMb} MB / ${data.systemMetrics.heapTotalMb} MB` : '...'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: data ? `${Math.min(data.systemMetrics.memoryUsagePercent, 100)}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>0 MB</span>
                <span>{data ? `${data.systemMetrics.memoryUsagePercent}% used` : '...'}</span>
                <span>Max VM Limit</span>
              </div>
            </div>

            {/* RSS Memory Footprint */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  Resident Set Size (RSS)
                </span>
                <span className="font-mono text-slate-700 font-bold">
                  {data ? `${data.systemMetrics.rssMb} MB` : '...'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">Total physical memory allocated for this container server process on Cloud Run.</p>
            </div>

            {/* Simulated Relative CPU Lag */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  Container CPU Usage
                </span>
                <span className="font-mono text-slate-700 font-bold">
                  {data ? `${data.systemMetrics.cpuLoad.toFixed(2)} %` : '...'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${data && data.systemMetrics.cpuLoad > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: data ? `${Math.min(data.systemMetrics.cpuLoad * 2, 100)}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-2.5 text-slate-500 text-xs" id="perf_node_diagnostic">
            <Terminal className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              Diagnostic tip: In-memory profiling stores the last 1000 requests. No database write stress detected.
            </span>
          </div>
        </div>
      </div>

      {/* Endpoint Leaderboard & Metrics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="perf_split_tables_section">
        {/* Left Side: Endpoint Latency Leaderboard */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between" id="perf_endpoint_leaderboard_card">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Router Endpoint Stats</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Most called routes sorted by execution frequencies.</p>
          </div>

          <div className="space-y-4 my-4 max-h-[300px] overflow-y-auto pr-1" id="endpoint_leaderboard_list">
            {data?.endpoints && data.endpoints.length > 0 ? (
              data.endpoints.map((ep, idx) => {
                const parts = ep.endpoint.split(' ');
                const method = parts[0] || 'GET';
                const path = parts[1] || '/';
                const isSlow = ep.averageDurationMs > 30;

                return (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0" id={`endpoint_stat_${idx}`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold font-mono shrink-0 ${
                          method === 'GET' 
                            ? 'bg-sky-100 text-sky-800' 
                            : method === 'POST' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {method}
                        </span>
                        <span className="font-mono text-slate-800 font-bold truncate" title={path}>{path}</span>
                      </div>
                      <div className="text-right font-mono text-slate-500 shrink-0">
                        <span className="text-slate-800 font-bold">{ep.count}</span> calls
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        Average duration: 
                        <span className={`font-mono font-bold ${isSlow ? 'text-amber-500' : 'text-slate-600'}`}>
                          {ep.averageDurationMs.toFixed(1)} ms
                        </span>
                      </span>
                      {ep.errors > 0 && (
                        <span className="text-rose-500 font-semibold font-mono bg-rose-50 px-1 rounded">
                          {ep.errors} errors
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-400 text-xs py-10 text-center" id="no_endpoints_telemetry">
                No endpoint statistics recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Request Profiler Log */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm" id="perf_request_log_card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Detailed Request Stream</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Filter and inspect individual API transactional telemetry logs in real time.</p>
            </div>
            
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2" id="request_log_filters">
              {/* Method select */}
              <select
                id="select_filter_method"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 focus:outline-hidden"
              >
                <option value="ALL">Method: ALL</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              {/* Status select */}
              <select
                id="select_filter_status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 focus:outline-hidden"
              >
                <option value="ALL">Status: ALL</option>
                <option value="2XX">2XX Success</option>
                <option value="3XX">3XX Redirect</option>
                <option value="4XX">4XX Client Error</option>
                <option value="5XX">5XX Server Error</option>
              </select>

              {/* Latency Threshold filter */}
              <input
                id="input_filter_min_latency"
                type="number"
                placeholder="Min ms"
                value={minLatency}
                onChange={(e) => setMinLatency(e.target.value)}
                className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Search box */}
          <div className="relative mb-4" id="log_search_wrapper">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="input_search_path"
              type="text"
              placeholder="Filter by route path (e.g., /api/accounts)..."
              value={searchPath}
              onChange={(e) => setSearchPath(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1" id="request_log_table_wrapper">
            <table className="w-full text-left border-collapse" id="request_log_table">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Timestamp</th>
                  <th className="px-4 py-2 font-mono">Method</th>
                  <th className="px-4 py-2">Path</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Latency</th>
                  <th className="px-4 py-2">Memory rss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs text-slate-600">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/40 transition-colors" id={`request_row_${req.id}`}>
                      <td className="px-4 py-2 text-slate-400">{new Date(req.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-2">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                          req.method === 'GET' 
                            ? 'bg-sky-100 text-sky-800' 
                            : req.method === 'POST' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.method}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-900 truncate max-w-[200px]" title={req.path}>
                        {req.path}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                          req.statusCode >= 500 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : req.statusCode >= 400 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {req.statusCode}
                        </span>
                      </td>
                      <td className={`px-4 py-2 font-bold ${req.durationMs > 50 ? 'text-amber-500' : 'text-slate-700'}`}>
                        {req.durationMs.toFixed(2)} ms
                      </td>
                      <td className="px-4 py-2 text-slate-400">{req.memoryUsageMb.toFixed(1)} MB</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-xs">
                      No request logs found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
