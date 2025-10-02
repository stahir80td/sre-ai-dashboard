import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, AlertTriangle, Server, Zap, Brain, AlertCircle, Play, Pause, RotateCcw, Route, CheckCircle, XCircle, ChevronRight, RefreshCw, Cpu } from 'lucide-react';

// API base URL - uses relative paths in production
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8080' : '';
const WS_URL = window.location.hostname === 'localhost' 
  ? 'ws://localhost:8080/ws'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

// Add custom scrollbar styles
const scrollbarStyles = `
  .event-timeline::-webkit-scrollbar {
    width: 6px;
  }
  .event-timeline::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  .event-timeline::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  .event-timeline::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

interface Service {
  name: string;
  cpu: number;
  memory: number;
  latency: number;
  availability: number;
  error_rate: number;
  throughput: number;
  status: 'healthy' | 'degraded' | 'down';
  dependencies: string[];
  active_chaos?: any;
}

interface Prediction {
  incident_probability: number;
  risk_level: string;
  confidence: number;
  predicted_incident_type: string;
  recommendation: string;
  model_version: string;
}

function Dashboard() {
  const [services, setServices] = useState<Record<string, Service>>({});
  const [selectedService, setSelectedService] = useState<string>('database');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [systemPrediction, setSystemPrediction] = useState<Prediction | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [chaosConfig, setChaosConfig] = useState({
    cpu_spike: false,
    memory_leak: false,
    network_latency: false,
    service_kill: false,
    duration: 30
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const servicesIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const predictionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);

  const addEventLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/services`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure received');
      }
      
      setServices(data);
      setBackendError(null);
      setIsConnecting(false);
      
    } catch (error: any) {
      console.error('Failed to fetch services:', error);
      setIsConnecting(false);
      
      if (error.message?.includes('Failed to fetch')) {
        setBackendError('Cannot connect to backend');
      } else {
        setBackendError(error.message || 'Failed to fetch services');
      }
    }
  }, []);

  const fetchPrediction = useCallback(async (serviceName: string) => {
    if (!serviceName) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/predict/${serviceName}`);
      
      if (!response.ok) throw new Error('Failed to fetch prediction');
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Failed to fetch prediction:', error);
    }
  }, []);

  const fetchSystemPrediction = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/predict`);
      
      if (!response.ok) throw new Error('Failed to fetch system prediction');
      const data = await response.json();
      setSystemPrediction(data);
    } catch (error) {
      console.error('Failed to fetch system prediction:', error);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    try {
      const websocket = new WebSocket(WS_URL);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        addEventLog('✅ WebSocket connected');
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setServices(prevServices => {
            // Check for status changes
            Object.entries(data).forEach(([name, service]: [string, any]) => {
              if (prevServices[name]) {
                if (service.status === 'down' && prevServices[name].status !== 'down') {
                  addEventLog(`❌ ${name} is DOWN!`);
                } else if (service.status === 'healthy' && prevServices[name].status === 'down') {
                  addEventLog(`✅ ${name} recovered`);
                } else if (service.status === 'degraded' && prevServices[name].status === 'healthy') {
                  addEventLog(`⚠️ ${name} degraded`);
                }
              }
            });
            return data;
          });
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        addEventLog('❌ WebSocket error');
      };

      websocket.onclose = () => {
        setWsConnected(false);
        addEventLog('⚠️ WebSocket disconnected');
        wsRef.current = null;
      };

      wsRef.current = websocket;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      addEventLog('❌ Failed to connect WebSocket');
    }
  }, [addEventLog]);

  // Initialize on mount
  useEffect(() => {
    // Inject styles
    const styleElement = document.createElement('style');
    styleElement.textContent = scrollbarStyles;
    document.head.appendChild(styleElement);
    
    // Initial fetch
    setIsConnecting(true);
    fetchServices();
    fetchSystemPrediction();
    
    // Start polling for services
    servicesIntervalRef.current = setInterval(() => {
      fetchServices();
    }, 2000);
    
    // Keep-alive ping every 10 seconds
    keepAliveRef.current = setInterval(() => {
      fetch(`${API_BASE}/api/health`).catch(() => {});
    }, 10000);
    
    // Cleanup
    return () => {
      document.head.removeChild(styleElement);
      if (servicesIntervalRef.current) clearInterval(servicesIntervalRef.current);
      if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current);
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Handle simulation state
  useEffect(() => {
    if (simulationRunning) {
      connectWebSocket();
      
      // Start polling predictions
      if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current);
      predictionIntervalRef.current = setInterval(() => {
        fetchPrediction(selectedService);
        fetchSystemPrediction();
      }, 2000);
    } else {
      // Stop WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
      
      // Stop prediction polling
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
        predictionIntervalRef.current = null;
      }
    }
  }, [simulationRunning, selectedService, connectWebSocket, fetchPrediction, fetchSystemPrediction]);

  const startSimulation = () => {
    setSimulationRunning(true);
    addEventLog('▶️ Simulation started');
  };

  const pauseSimulation = () => {
    setSimulationRunning(false);
    addEventLog('⏸️ Simulation paused');
  };

  const resetSimulation = async () => {
    try {
      pauseSimulation();
      const response = await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to reset');
      
      // Wait for backend to reset
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetchServices();
      await fetchSystemPrediction();
      setChaosConfig({
        cpu_spike: false,
        memory_leak: false,
        network_latency: false,
        service_kill: false,
        duration: 30
      });
      setEventLog([]);
      setPrediction(null);
      addEventLog('🔄 System reset to baseline');
    } catch (error) {
      console.error('Failed to reset:', error);
      addEventLog('❌ Failed to reset system');
    }
  };

  const injectMultipleChaos = async (targetService: string) => {
    const chaosTypes = [];
    if (chaosConfig.cpu_spike) chaosTypes.push('cpu_spike');
    if (chaosConfig.memory_leak) chaosTypes.push('memory_leak');
    if (chaosConfig.network_latency) chaosTypes.push('network_latency');
    if (chaosConfig.service_kill) chaosTypes.push('service_kill');

    if (chaosTypes.length === 0) {
      addEventLog('⚠️ No chaos types selected');
      return;
    }

    for (const chaosType of chaosTypes) {
      try {
        const response = await fetch(`${API_BASE}/api/chaos/inject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_service: targetService,
            chaos_type: chaosType,
            duration: chaosConfig.duration,
          }),
        });
        
        if (!response.ok) throw new Error(`Failed to inject ${chaosType}`);
        addEventLog(`🔥 Injected ${chaosType} on ${targetService}`);
        
        // Force refresh after injection
        setTimeout(() => {
          fetchServices();
          fetchPrediction(targetService);
          fetchSystemPrediction();
        }, 500);
        
      } catch (error) {
        console.error('Failed to inject chaos:', error);
        addEventLog(`❌ Failed to inject ${chaosType}`);
      }
    }
  };

  const getSystemHealth = () => {
    const serviceList = Object.values(services);
    if (serviceList.length === 0) return { status: 'Unknown', healthy: 0, total: 0, degraded: 0, down: 0 };
    
    const healthyCount = serviceList.filter(s => s.status === 'healthy').length;
    const degradedCount = serviceList.filter(s => s.status === 'degraded').length;
    const downCount = serviceList.filter(s => s.status === 'down').length;
    
    let status = 'Healthy';
    if (services['database']?.status === 'down' || downCount > 0) {
      status = 'Critical';
    } else if (degradedCount > serviceList.length / 2) {
      status = 'At Risk';
    } else if (degradedCount > 0) {
      status = 'Degraded';
    }
    
    return { status, healthy: healthyCount, total: serviceList.length, degraded: degradedCount, down: downCount };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 border-green-500 bg-green-900/20';
      case 'degraded': return 'text-yellow-400 border-yellow-500 bg-yellow-900/20';
      case 'down': return 'text-red-400 border-red-500 bg-red-900/20';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'down': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return null;
    }
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Header with Navigation */}
      <div className="mb-4 border-b border-slate-700 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold">AI-Powered SRE Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Navigation Button to Architecture Page */}
            <button
              onClick={() => window.location.href = '/architecture'}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Cpu className="w-5 h-5" />
              <span>View Architecture</span>
            </button>
            
            {/* WebSocket Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              wsConnected ? 'bg-green-900/50' : 'bg-slate-800'
            }`}>
              <Activity className={`w-4 h-4 ${wsConnected ? 'text-green-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-sm">{wsConnected ? 'Connected' : 'Not Connected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Banner */}
      <div className={`rounded-lg p-4 mb-4 border-2 ${
        systemHealth.status === 'Critical' ? 'bg-red-900/50 border-red-600' :
        systemHealth.status === 'At Risk' ? 'bg-orange-900/50 border-orange-600' :
        systemHealth.status === 'Degraded' ? 'bg-yellow-900/50 border-yellow-600' :
        systemHealth.status === 'Unknown' ? 'bg-slate-700/50 border-slate-600' :
        'bg-green-900/50 border-green-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {systemHealth.status === 'Critical' || systemHealth.status === 'At Risk' ? 
              <AlertTriangle className="w-6 h-6 text-orange-400" /> :
              systemHealth.status === 'Unknown' ?
              <AlertCircle className="w-6 h-6 text-slate-400" /> :
              <CheckCircle className="w-6 h-6 text-green-400" />
            }
            <div>
              <h2 className="text-xl font-bold">System Status: {systemHealth.status}</h2>
              <p className="text-sm opacity-75">
                {systemHealth.healthy} of {systemHealth.total} services healthy
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{systemHealth.healthy}</div>
              <div className="text-xs">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{systemHealth.degraded}</div>
              <div className="text-xs">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{systemHealth.down}</div>
              <div className="text-xs">Down</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {systemPrediction ? (systemPrediction.incident_probability * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-xs">System Risk</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Panel - Service Topology & Controls */}
        <div className="col-span-4 space-y-4">
          {/* Service Architecture */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Service Architecture</h3>
            <div className="relative h-64">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                {/* Connection lines */}
                <line x1="200" y1="50" x2="100" y2="120" stroke="currentColor" strokeWidth="2" className="text-slate-600" />
                <line x1="200" y1="50" x2="300" y2="120" stroke="currentColor" strokeWidth="2" className="text-slate-600" />
                <line x1="100" y1="150" x2="200" y2="220" stroke="currentColor" strokeWidth="2" className="text-slate-600" />
                <line x1="300" y1="150" x2="200" y2="220" stroke="currentColor" strokeWidth="2" className="text-slate-600" />
                
                {/* Animated data flow dots */}
                {simulationRunning && (
                  <>
                    <circle r="3" fill="cyan" className="opacity-60">
                      <animateMotion dur="2s" repeatCount="indefinite">
                        <mpath href="#path1" />
                      </animateMotion>
                    </circle>
                    <circle r="3" fill="cyan" className="opacity-60">
                      <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s">
                        <mpath href="#path2" />
                      </animateMotion>
                    </circle>
                  </>
                )}
                <path id="path1" d="M 200 50 L 100 120 L 200 220" fill="none" />
                <path id="path2" d="M 200 50 L 300 120 L 200 220" fill="none" />
              </svg>
              
              {/* Service Nodes */}
              <div 
                onClick={() => setSelectedService('api-gateway')}
                className={`absolute top-4 left-1/2 -translate-x-1/2 cursor-pointer border-2 rounded-lg px-3 py-2 transition-all hover:scale-105 ${getStatusColor(services['api-gateway']?.status || 'healthy')}`}
              >
                <div className="flex items-center space-x-2">
                  {getStatusIcon(services['api-gateway']?.status || 'healthy')}
                  <span className="text-sm font-medium">API Gateway</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedService('auth-service')}
                className={`absolute top-24 left-12 cursor-pointer border-2 rounded-lg px-3 py-2 transition-all hover:scale-105 ${getStatusColor(services['auth-service']?.status || 'healthy')}`}
              >
                <div className="flex items-center space-x-2">
                  {getStatusIcon(services['auth-service']?.status || 'healthy')}
                  <span className="text-sm font-medium">Auth Service</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedService('user-service')}
                className={`absolute top-24 right-12 cursor-pointer border-2 rounded-lg px-3 py-2 transition-all hover:scale-105 ${getStatusColor(services['user-service']?.status || 'healthy')}`}
              >
                <div className="flex items-center space-x-2">
                  {getStatusIcon(services['user-service']?.status || 'healthy')}
                  <span className="text-sm font-medium">User Service</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedService('database')}
                className={`absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer border-2 rounded-lg px-3 py-2 transition-all hover:scale-105 ${getStatusColor(services['database']?.status || 'healthy')}`}
              >
                <div className="flex items-center space-x-2">
                  {getStatusIcon(services['database']?.status || 'healthy')}
                  <span className="text-sm font-medium">Database</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chaos Engineering & Simulation Controls */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Chaos Engineering</h3>
            
            {/* Simulation Controls */}
            <div className="mb-4 p-3 bg-slate-700 rounded-lg">
              <div className="text-sm font-medium mb-2">Simulation Controls</div>
              <div className="grid grid-cols-2 gap-2">
                {!simulationRunning ? (
                  <button
                    onClick={startSimulation}
                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseSimulation}
                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                )}
                <button
                  onClick={resetSimulation}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Chaos Types */}
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-2">
                Select chaos types to inject (impacts should be visible in metrics)
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={chaosConfig.cpu_spike}
                    onChange={(e) => setChaosConfig(prev => ({ ...prev, cpu_spike: e.target.checked }))}
                    className="rounded cursor-pointer"
                  />
                  <span className="text-sm">CPU Spike (70-95%)</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={chaosConfig.memory_leak}
                    onChange={(e) => setChaosConfig(prev => ({ ...prev, memory_leak: e.target.checked }))}
                    className="rounded cursor-pointer"
                  />
                  <span className="text-sm">Memory Leak (+30-50%)</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={chaosConfig.network_latency}
                    onChange={(e) => setChaosConfig(prev => ({ ...prev, network_latency: e.target.checked }))}
                    className="rounded cursor-pointer"
                  />
                  <span className="text-sm">Network Latency (+500-2000ms)</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={chaosConfig.service_kill}
                    onChange={(e) => setChaosConfig(prev => ({ ...prev, service_kill: e.target.checked }))}
                    className="rounded cursor-pointer"
                  />
                  <span className="text-sm">Kill Service (Down)</span>
                </label>
              </div>
              <div>
                <label className="text-sm">Duration: {chaosConfig.duration}s</label>
                <input 
                  type="range" 
                  min="10" 
                  max="60" 
                  value={chaosConfig.duration}
                  onChange={(e) => setChaosConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full cursor-pointer"
                />
              </div>
              <button 
                onClick={() => injectMultipleChaos(selectedService)}
                disabled={!selectedService || Object.values(services).length === 0}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>Inject Chaos on {selectedService}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel - Service Metrics */}
        <div className="col-span-5">
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Service Metrics</h3>
            <div className="space-y-3">
              {isConnecting ? (
                <div className="text-center py-8 text-slate-400">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Connecting to backend...</p>
                </div>
              ) : backendError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                  <p className="text-red-400 mb-2">{backendError}</p>
                  <p className="text-sm text-slate-400 mb-4">
                    Make sure the backend is running
                  </p>
                  <button 
                    onClick={() => {
                      setBackendError(null);
                      setIsConnecting(true);
                      fetchServices();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Retry Connection
                  </button>
                </div>
              ) : Object.keys(services).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No services available</p>
                  <p className="text-xs mt-2">Services will appear once the backend is ready</p>
                  <button 
                    onClick={() => {
                      setIsConnecting(true);
                      fetchServices();
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Refresh Services
                  </button>
                </div>
              ) : (
                Object.entries(services).map(([name, service]) => (
                <div 
                  key={name}
                  onClick={() => {
                    setSelectedService(name);
                    fetchPrediction(name);
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedService === name ? 'ring-2 ring-blue-400' : ''
                  } ${getStatusColor(service.status)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{service.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      service.status === 'healthy' ? 'bg-green-900 text-green-300' :
                      service.status === 'degraded' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {service.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CPU</span>
                        <span className={service.cpu > 80 ? 'text-red-400' : ''}>{service.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                        <div className={`h-1.5 rounded-full transition-all ${
                          service.cpu > 80 ? 'bg-red-500' :
                          service.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`} style={{ width: `${Math.min(service.cpu, 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Memory</span>
                        <span className={service.memory > 80 ? 'text-red-400' : ''}>{service.memory.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                        <div className={`h-1.5 rounded-full transition-all ${
                          service.memory > 80 ? 'bg-red-500' :
                          service.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`} style={{ width: `${Math.min(service.memory, 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Latency</span>
                        <span className={service.latency > 500 ? 'text-red-400' : service.latency > 200 ? 'text-yellow-400' : ''}>{service.latency}ms</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Error Rate</span>
                        <span className={service.error_rate > 5 ? 'text-red-400' : service.error_rate > 2 ? 'text-yellow-400' : ''}>{service.error_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {service.active_chaos && (
                    <div className="mt-2 flex items-center space-x-2 text-orange-400 text-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                      <span>Active Chaos: {service.active_chaos.type}</span>
                    </div>
                  )}
                </div>
              )))}
            </div>
          </div>
        </div>

        {/* Right Panel - Predictions & Events */}
        <div className="col-span-3 space-y-4">
          {/* AI Prediction */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-400" />
              AI Prediction - {selectedService}
            </h3>
            {prediction ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${
                  prediction.risk_level === 'critical' ? 'bg-red-900/20 text-red-400' :
                  prediction.risk_level === 'high' ? 'bg-orange-900/20 text-orange-400' :
                  prediction.risk_level === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                  'bg-green-900/20 text-green-400'
                }`}>
                  <div className="text-2xl font-bold">
                    {(prediction.incident_probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm">Risk: {prediction.risk_level.toUpperCase()}</div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-sm text-slate-400 mb-1">Predicted Incident</div>
                  <div className="font-medium">{prediction.predicted_incident_type.replace(/_/g, ' ').toUpperCase()}</div>
                </div>

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                  <div className="text-sm font-medium mb-1">Recommendation</div>
                  <p className="text-sm">{prediction.recommendation}</p>
                </div>

                <div className="text-xs text-slate-400">
                  Model: {prediction.model_version} | Confidence: {(prediction.confidence * 100).toFixed(1)}%
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No prediction data available</p>
                <p className="text-xs mt-2">Start the simulation to see predictions</p>
              </div>
            )}
          </div>

          {/* Event Timeline */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Event Timeline</h3>
            <div 
              className="space-y-2 text-sm max-h-64 overflow-y-auto event-timeline"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.2)'
              }}>
              {eventLog.length === 0 ? (
                <div className="text-slate-400 text-center py-4">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No events yet...</p>
                  <p className="text-xs mt-1">Start the simulation to see events</p>
                </div>
              ) : (
                eventLog.map((event, idx) => (
                  <div key={idx} className="text-slate-300 hover:bg-slate-700/30 px-2 py-1 rounded transition-colors">
                    {event}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;