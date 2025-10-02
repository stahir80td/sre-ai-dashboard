import React, { useEffect, useState } from 'react';
import { Home, Server, Database, GitBranch, Brain, Cloud, BarChart3, Shield, Activity, Zap, ChevronRight } from 'lucide-react';

const ArchitecturePage = () => {
  const [animateFlow, setAnimateFlow] = useState(false);
  const [hoveredBox, setHoveredBox] = useState(null);

  useEffect(() => {
    setTimeout(() => setAnimateFlow(true), 500);
  }, []);

  const ComponentBox = ({ id, title, subtitle, icon: Icon, logo, metric, color = "border-slate-600" }) => (
    <div
      className={`relative bg-white/5 backdrop-blur-sm border ${hoveredBox === id ? 'border-cyan-400 scale-105' : color} rounded-lg p-4 transition-all duration-300 cursor-pointer`}
      onMouseEnter={() => setHoveredBox(id)}
      onMouseLeave={() => setHoveredBox(null)}
    >
      <div className="flex items-start justify-between mb-2">
        <Icon className={`w-5 h-5 ${color.replace('border', 'text')}`} />
        {logo && <img src={logo} alt="" className="w-5 h-5 opacity-60" />}
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-400">{subtitle}</p>
      {metric && hoveredBox === id && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs whitespace-nowrap">
          {metric}
        </div>
      )}
    </div>
  );

  const NumberedConnector = ({ number, active = false }) => (
    <div className="relative flex items-center">
      <div className="w-20 h-0.5 bg-slate-600">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <div className="container mx-auto px-6 py-4">
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur hover:bg-slate-700 rounded-lg transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Header */}
      <div className="container mx-auto px-6 pt-8 pb-4">
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-blue-500/20 rounded-full text-blue-400 text-xs font-semibold mb-4">
            PROPOSED ARCHITECTURE
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            AI-Powered SRE Architecture
          </h1>
          <p className="text-gray-400">Predictive incident prevention with 95.4% accuracy</p>
        </div>
      </div>

      {/* Main Architecture Diagram */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Pipeline Container */}
          <div className="relative bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
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

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
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
              <div key={metric.label} className={`${metric.bgColor} rounded-xl p-4 border ${metric.borderColor}`}>
                <div className="text-xs text-gray-400 mb-2">{metric.label}</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 line-through">{metric.before}</span>
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                  <span className="text-lg font-bold text-white">{metric.after}</span>
                </div>
                <div className={`text-xs font-semibold ${metric.changeColor}`}>
                  {metric.change}
                </div>
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <div className="mt-8 bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <h3 className="text-center text-sm font-semibold text-gray-400 mb-4">TECHNOLOGY STACK</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                'Kubernetes', 'Prometheus', 'Grafana', 'Apache Kafka', 'Apache Spark', 
                'Python', 'XGBoost', 'Flask API', 'React', 'WebSocket', 'Docker'
              ].map((tech) => (
                <div key={tech} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-gray-300 border border-slate-700">
                  {tech}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Section - Full Width */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            
            <div className="space-y-6 text-gray-300">
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-3">The Problem</h3>
                <p className="text-sm leading-relaxed">
                  Traditional monitoring systems are reactive—they alert teams after problems occur. In microservice architectures, 
                  a single service failure can cascade through the entire system, causing widespread outages. 
                  By the time engineers receive an alert, investigate, and fix the issue, significant 
                  time and revenue have already been lost. Current industry averages show 45-minute MTTRs and hundreds of daily alerts 
                  causing severe alert fatigue.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-xl p-6 border border-cyan-700/30">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">The AI Solution</h3>
                <p className="text-sm leading-relaxed mb-4">
                  This architecture introduces an intelligent layer that learns from system behavior patterns. By analyzing 40+ features 
                  in real-time—including CPU usage, memory patterns, latency trends, and service dependencies—the 
                  XGBoost model can predict incidents before they happen with 95.4% accuracy. The system continuously 
                  processes streaming metrics through Kafka and Spark, enabling real-time feature engineering and 
                  sub-100ms prediction responses.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">9,500+</div>
                    <div className="text-xs text-gray-400">Training Scenarios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">40+</div>
                    <div className="text-xs text-gray-400">Real-time Features</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400 mb-1">&lt;100ms</div>
                    <div className="text-xs text-gray-400">Prediction Latency</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-3">The Innovation: Cascade Risk Algorithm</h3>
                <p className="text-sm leading-relaxed mb-4">
                  The Cascade Risk Algorithm is designed to understand service dependencies and predict chain reactions. 
                  Unlike traditional threshold-based monitoring, it analyzes the relationship between services. 
                  When the database shows early stress signals, the algorithm calculates the probability of 
                  dependent service failures, enabling preventive action before cascade failures occur.
                </p>
                <div className="bg-slate-900/50 rounded-lg p-4 mt-4">
                  <code className="text-xs text-cyan-400">
                    // Cascade Risk Calculation<br/>
                    if (database.cpu &gt; 80 && database.errorRate &gt; 5) &#123;<br/>
                    &nbsp;&nbsp;risk = calculateCascadeProbability(dependentServices);<br/>
                    &nbsp;&nbsp;if (risk &gt; 0.7) triggerPreventiveAction();<br/>
                    &#125;
                  </code>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-xl p-6 border border-green-700/30">
                <h3 className="text-lg font-semibold text-green-400 mb-3">Expected Impact</h3>
                <p className="text-sm leading-relaxed mb-4">
                  Based on the model's performance metrics and testing with simulated chaos scenarios, this architecture 
                  is projected to deliver significant improvements in system reliability:
                </p>
                <ul className="text-sm space-y-2 ml-4">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span>68% reduction in MTTR through predictive alerts and automated responses</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span>85% fewer alerts by filtering noise and focusing on actionable predictions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span>Prevention of cascade failures that typically affect multiple services</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span>Potential for millions in saved revenue by preventing major incidents</span>
                  </li>
                </ul>
              </div>

              <div className="text-center mt-8">
                <p className="text-sm text-gray-500 italic">
                  "This project demonstrates how machine learning can transform reactive monitoring into predictive prevention, 
                  fundamentally changing how we approach system reliability."
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold rounded-lg hover:scale-105 transition-all"
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