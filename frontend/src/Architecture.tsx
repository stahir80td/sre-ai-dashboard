import React, { useEffect, useState } from 'react';
import { Home, Server, Database, GitBranch, Brain, Cloud, BarChart3, Shield, Activity, Zap, ChevronRight, Menu, X } from 'lucide-react';

const ArchitecturePage = () => {
  const [animateFlow, setAnimateFlow] = useState(false);
  const [hoveredBox, setHoveredBox] = useState(null);
  const [mobileView, setMobileView] = useState('overview'); // 'overview', 'pipeline', 'metrics'

  useEffect(() => {
    setTimeout(() => setAnimateFlow(true), 500);
  }, []);

  const ComponentBox = ({ id, title, subtitle, icon: Icon, logo, metric, color = "border-slate-600" }) => (
    <div
      className={`relative bg-white/5 backdrop-blur-sm border ${hoveredBox === id ? 'border-cyan-400 scale-105' : color} rounded-lg p-3 sm:p-4 transition-all duration-300 cursor-pointer`}
      onMouseEnter={() => setHoveredBox(id)}
      onMouseLeave={() => setHoveredBox(null)}
    >
      <div className="flex items-start justify-between mb-2">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color.replace('border', 'text')}`} />
        {logo && <img src={logo} alt="" className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />}
      </div>
      <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-400">{subtitle}</p>
      {metric && hoveredBox === id && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs whitespace-nowrap z-10">
          {metric}
        </div>
      )}
    </div>
  );

  const NumberedConnector = ({ number, active = false }) => (
    <div className="relative flex items-center">
      <div className="w-12 sm:w-20 h-0.5 bg-slate-600">
        {active && animateFlow && (
          <div className="absolute inset-0 h-full">
            <div className="h-full w-4 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-flow" />
          </div>
        )}
      </div>
      <div className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full ${active ? 'bg-cyan-500' : 'bg-slate-700'} border-2 ${active ? 'border-cyan-400' : 'border-slate-600'} flex items-center justify-center`}>
        <span className="text-xs text-white font-bold">{number}</span>
      </div>
      <style jsx>{`
        @keyframes flow {
          0% { transform: translateX(-16px); }
          100% { transform: translateX(80px); }
        }
        .animate-flow {
          animation: flow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );

  // Mobile View Selector
  const MobileViewSelector = () => (
    <div className="lg:hidden flex justify-around bg-slate-800/50 rounded-lg p-1 mb-4">
      <button
        onClick={() => setMobileView('overview')}
        className={`flex-1 py-2 px-3 rounded transition-colors text-xs sm:text-sm ${
          mobileView === 'overview' ? 'bg-cyan-600 text-white' : 'text-slate-400'
        }`}
      >
        Overview
      </button>
      <button
        onClick={() => setMobileView('pipeline')}
        className={`flex-1 py-2 px-3 rounded transition-colors text-xs sm:text-sm ${
          mobileView === 'pipeline' ? 'bg-cyan-600 text-white' : 'text-slate-400'
        }`}
      >
        Pipeline
      </button>
      <button
        onClick={() => setMobileView('metrics')}
        className={`flex-1 py-2 px-3 rounded transition-colors text-xs sm:text-sm ${
          mobileView === 'metrics' ? 'bg-cyan-600 text-white' : 'text-slate-400'
        }`}
      >
        Metrics
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/80 backdrop-blur hover:bg-slate-700 rounded-lg transition-all text-sm sm:text-base"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Header */}
      <div className="container mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-4">
        <div className="text-center">
          <div className="inline-block px-3 sm:px-4 py-1 sm:py-2 bg-blue-500/20 rounded-full text-blue-400 text-xs font-semibold mb-4">
            PROPOSED ARCHITECTURE
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            AI-Powered SRE Architecture
          </h1>
          <p className="text-sm sm:text-base text-gray-400">Predictive incident prevention with 95.4% accuracy</p>
        </div>
      </div>

      {/* Main Architecture Diagram */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Mobile View Selector */}
          <MobileViewSelector />

          {/* Pipeline Container - Desktop */}
          <div className="hidden lg:block relative bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
            {/* Background Zones */}
            <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
              <div className="bg-slate-900/20 rounded-l-2xl"></div>
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
              <div className="bg-slate-900/20 rounded-r-2xl"></div>
            </div>

            {/* Zone Labels */}
            <div className="relative grid grid-cols-3 mb-6">
              <div className="text-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Data Sources</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-blue-400 uppercase tracking-wider">AI Processing Pipeline</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Outputs</span>
              </div>
            </div>

            {/* Main Flow Diagram */}
            <div className="relative grid grid-cols-11 gap-2 items-center">
              {/* Data Sources Column */}
              <div className="col-span-3 space-y-4">
                <ComponentBox
                  id="microservices"
                  title="Microservices"
                  subtitle="4 services"
                  icon={Server}
                  logo="/kubernetes.svg"
                  metric="Kubernetes cluster"
                  color="border-green-600"
                />
                <ComponentBox
                  id="monitoring"
                  title="Observability"
                  subtitle="Metrics & logs"
                  icon={Activity}
                  logo="/prometheus.svg"
                  metric="2TB daily data"
                  color="border-blue-600"
                />
              </div>

              {/* Connector 1 */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <NumberedConnector number="1" active={true} />
              </div>

              {/* Processing Pipeline */}
              <div className="col-span-3 space-y-3">
                {/* Data Pipeline */}
                <div className="flex items-center gap-2">
                  <ComponentBox
                    id="kafka"
                    title="Kafka"
                    subtitle="Streaming"
                    icon={GitBranch}
                    metric="10K msg/sec"
                    color="border-purple-600"
                  />
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  <ComponentBox
                    id="spark"
                    title="Spark"
                    subtitle="Processing"
                    icon={Zap}
                    metric="Real-time"
                    color="border-yellow-600"
                  />
                </div>

                {/* ML Platform */}
                <ComponentBox
                  id="ml"
                  title="ML Training"
                  subtitle="XGBoost model"
                  icon={Brain}
                  logo="/python.svg"
                  metric="95.4% accuracy"
                  color="border-orange-600"
                />

                {/* Model Serving */}
                <div className="flex items-center gap-2">
                  <ComponentBox
                    id="registry"
                    title="Model Registry"
                    subtitle="Versioning"
                    icon={Database}
                    metric="MLflow"
                    color="border-indigo-600"
                  />
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  <ComponentBox
                    id="serving"
                    title="Model Serving"
                    subtitle="API endpoint"
                    icon={Cloud}
                    metric="<100ms"
                    color="border-cyan-600"
                  />
                </div>
              </div>

              {/* Connector 2 */}
              <div className="col-span-1 flex items-center justify-center">
                <NumberedConnector number="2" active={true} />
              </div>

              {/* Outputs Column */}
              <div className="col-span-3 space-y-4">
                <ComponentBox
                  id="api"
                  title="Prediction API"
                  subtitle="REST endpoint"
                  icon={Cloud}
                  metric="10K QPS"
                  color="border-cyan-600"
                />
                <ComponentBox
                  id="dashboard"
                  title="SRE Dashboard"
                  subtitle="Real-time UI"
                  icon={BarChart3}
                  logo="/react.svg"
                  metric="React + WebSocket"
                  color="border-purple-600"
                />
                <ComponentBox
                  id="response"
                  title="Auto Response"
                  subtitle="Prevention actions"
                  icon={Shield}
                  metric="14 min MTTR"
                  color="border-green-400"
                />
              </div>
            </div>

            {/* Data Flow Legend */}
            <div className="relative mt-8 flex justify-center gap-8 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-gray-400">Active Flow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <span className="text-gray-400">Data Pipeline</span>
              </div>
            </div>
          </div>

          {/* Mobile Pipeline View */}
          <div className={`lg:hidden ${mobileView === 'pipeline' ? 'block' : 'hidden'}`}>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
              <h3 className="text-center text-sm font-semibold text-blue-400 mb-4">DATA FLOW PIPELINE</h3>
              
              {/* Vertical Flow for Mobile */}
              <div className="space-y-4">
                {/* Data Sources */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 text-center">Data Sources</p>
                  <div className="space-y-2">
                    <ComponentBox
                      id="microservices-m"
                      title="Microservices"
                      subtitle="4 services"
                      icon={Server}
                      metric="Kubernetes"
                      color="border-green-600"
                    />
                    <ComponentBox
                      id="monitoring-m"
                      title="Observability"
                      subtitle="Metrics & logs"
                      icon={Activity}
                      metric="2TB daily"
                      color="border-blue-600"
                    />
                  </div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <ChevronRight className="w-6 h-6 text-cyan-400 rotate-90" />
                </div>

                {/* Processing */}
                <div>
                  <p className="text-xs text-blue-400 uppercase tracking-wider mb-2 text-center">AI Processing</p>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <ComponentBox
                        id="kafka-m"
                        title="Kafka"
                        subtitle="Stream"
                        icon={GitBranch}
                        color="border-purple-600"
                      />
                      <ComponentBox
                        id="spark-m"
                        title="Spark"
                        subtitle="Process"
                        icon={Zap}
                        color="border-yellow-600"
                      />
                    </div>
                    <ComponentBox
                      id="ml-m"
                      title="ML Training"
                      subtitle="XGBoost - 95.4% accuracy"
                      icon={Brain}
                      color="border-orange-600"
                    />
                  </div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <ChevronRight className="w-6 h-6 text-cyan-400 rotate-90" />
                </div>

                {/* Outputs */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 text-center">Outputs</p>
                  <div className="space-y-2">
                    <ComponentBox
                      id="api-m"
                      title="Prediction API"
                      subtitle="REST endpoint"
                      icon={Cloud}
                      color="border-cyan-600"
                    />
                    <ComponentBox
                      id="dashboard-m"
                      title="SRE Dashboard"
                      subtitle="Real-time UI"
                      icon={BarChart3}
                      color="border-purple-600"
                    />
                    <ComponentBox
                      id="response-m"
                      title="Auto Response"
                      subtitle="14 min MTTR"
                      icon={Shield}
                      color="border-green-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Overview */}
          <div className={`lg:hidden ${mobileView === 'overview' ? 'block' : 'hidden'}`}>
            <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-xl p-4 border border-cyan-700/30">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">AI-Powered Solution</h3>
              <p className="text-xs sm:text-sm text-gray-300 mb-4">
                Real-time prediction system analyzing 40+ features to prevent incidents before they occur.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg sm:text-xl font-bold text-cyan-400">9.5K</div>
                  <div className="text-xs text-gray-400">Scenarios</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-purple-400">95.4%</div>
                  <div className="text-xs text-gray-400">Accuracy</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-orange-400">&lt;100ms</div>
                  <div className="text-xs text-gray-400">Latency</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics - Responsive Grid */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 ${mobileView === 'metrics' || !['overview', 'pipeline'].includes(mobileView) ? 'block' : 'hidden lg:grid'}`}>
            {[
              { 
                label: 'MTTR', 
                before: '45 min', 
                after: '14 min', 
                change: '-68%',
                bgColor: 'bg-gradient-to-br from-cyan-900/20 to-cyan-800/20',
                borderColor: 'border-cyan-700',
                changeColor: 'text-cyan-400'
              },
              { 
                label: 'Alerts/Day', 
                before: '200+', 
                after: '30', 
                change: '-85%',
                bgColor: 'bg-gradient-to-br from-purple-900/20 to-purple-800/20',
                borderColor: 'border-purple-700',
                changeColor: 'text-purple-400'
              },
              { 
                label: 'Prediction', 
                before: '0%', 
                after: '95.4%', 
                change: '+95.4%',
                bgColor: 'bg-gradient-to-br from-orange-900/20 to-orange-800/20',
                borderColor: 'border-orange-700',
                changeColor: 'text-orange-400'
              },
              { 
                label: 'Annual Impact', 
                before: '-$50K/hr', 
                after: '+$2.4M', 
                change: 'Saved',
                bgColor: 'bg-gradient-to-br from-green-900/20 to-green-800/20',
                borderColor: 'border-green-700',
                changeColor: 'text-green-400'
              }
            ].map((metric) => (
              <div key={metric.label} className={`${metric.bgColor} rounded-xl p-3 sm:p-4 border ${metric.borderColor}`}>
                <div className="text-xs text-gray-400 mb-1 sm:mb-2">{metric.label}</div>
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="text-xs sm:text-sm text-gray-500 line-through">{metric.before}</span>
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                  <span className="text-sm sm:text-lg font-bold text-white">{metric.after}</span>
                </div>
                <div className={`text-xs font-semibold ${metric.changeColor}`}>
                  {metric.change}
                </div>
              </div>
            ))}
          </div>

          {/* Tech Stack - Responsive */}
          <div className="mt-6 sm:mt-8 bg-slate-800/30 rounded-xl p-4 sm:p-6 border border-slate-700">
            <h3 className="text-center text-xs sm:text-sm font-semibold text-gray-400 mb-3 sm:mb-4">TECHNOLOGY STACK</h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {[
                'Kubernetes', 'Prometheus', 'Grafana', 'Kafka', 'Spark', 
                'Python', 'XGBoost', 'Flask', 'React', 'WebSocket', 'Docker'
              ].map((tech) => (
                <div key={tech} className="px-2 sm:px-3 py-1 bg-slate-800 rounded-full text-xs text-gray-300 border border-slate-700">
                  {tech}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Section - Responsive */}
          <div className="mt-8 sm:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            
            <div className="space-y-4 sm:space-y-6 text-gray-300">
              <div className="bg-slate-800/30 rounded-xl p-4 sm:p-6 border border-slate-700">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">The Problem</h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Traditional monitoring systems are reactive—they alert teams after problems occur. In microservice architectures, 
                  a single service failure can cascade through the entire system, causing widespread outages. 
                  Current industry averages show 45-minute MTTRs and hundreds of daily alerts 
                  causing severe alert fatigue.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-xl p-4 sm:p-6 border border-cyan-700/30">
                <h3 className="text-base sm:text-lg font-semibold text-cyan-400 mb-2 sm:mb-3">The AI Solution</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                  This architecture introduces an intelligent layer that learns from system behavior patterns. By analyzing 40+ features 
                  in real-time, the XGBoost model can predict incidents before they happen with 95.4% accuracy.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-cyan-400 mb-1">9.5K+</div>
                    <div className="text-xs text-gray-400">Scenarios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-purple-400 mb-1">40+</div>
                    <div className="text-xs text-gray-400">Features</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-orange-400 mb-1">&lt;100ms</div>
                    <div className="text-xs text-gray-400">Response</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 sm:p-6 border border-slate-700">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">The Innovation: Cascade Risk Algorithm</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                  The Cascade Risk Algorithm understands service dependencies and predicts chain reactions. 
                  It analyzes relationships between services to prevent cascade failures.
                </p>
                <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4 overflow-x-auto">
                  <code className="text-xs text-cyan-400 whitespace-pre">
{`// Cascade Risk Calculation
if (db.cpu > 80 && db.error > 5) {
  risk = calcCascade(deps);
  if (risk > 0.7) prevent();
}`}
                  </code>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-xl p-4 sm:p-6 border border-green-700/30">
                <h3 className="text-base sm:text-lg font-semibold text-green-400 mb-2 sm:mb-3">Expected Impact</h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                  Based on model performance and testing, this architecture delivers:
                </p>
                <ul className="text-xs sm:text-sm space-y-2 ml-2 sm:ml-4">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span>68% reduction in MTTR</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span>85% fewer alerts</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span>Prevention of cascade failures</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span>$2.4M potential savings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA - Responsive */}
          <div className="text-center mt-6 sm:mt-8 pb-4 sm:pb-8">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold rounded-lg hover:scale-105 transition-all text-sm sm:text-base"
            >
              View Live Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitecturePage;