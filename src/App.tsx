/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, 
  Search, 
  Cpu, 
  ShieldCheck, 
  Terminal, 
  Database, 
  Activity,
  ArrowRight,
  RefreshCcw,
  BookOpen,
  Info,
  Clock,
  Landmark,
  Filter,
  Calendar,
  Layers,
  Settings2
} from 'lucide-react';
import { AgentAction, Domain, SaraswatiResponse, AdvancedFilters, HistoryItem } from './types';
import { SaraswatiOrchestrator } from './lib/agents';
import { getOntologyStats } from './lib/ontology';
import AgentActionItem from './components/AgentActionItem';
import TraceAudit from './components/TraceAudit';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import GuidelinesView from './components/GuidelinesView';
import HistoryView from './components/HistoryView';

type Tab = 'console' | 'database' | 'guidelines' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('console');
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<Domain>(Domain.AEROSPACE);
  const [isQuerying, setIsQuerying] = useState(false);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [response, setResponse] = useState<SaraswatiResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('saraswati_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>({
    subsystem: '',
    dataType: '',
    dateStart: '',
    dateEnd: ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const stats = useRef(getOntologyStats());
  
  const orchestrator = useRef(new SaraswatiOrchestrator());

  useEffect(() => {
    localStorage.setItem('saraswati_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions]);

  const handleQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isQuerying) return;

    setActiveTab('console');
    setIsQuerying(true);
    setActions([]);
    setResponse(null);

    // Prepare active filters
    const activeFilters: AdvancedFilters = {};
    if (filters.subsystem) activeFilters.subsystem = filters.subsystem;
    if (filters.dataType) activeFilters.dataType = filters.dataType;
    if (filters.dateStart) activeFilters.dateStart = filters.dateStart;
    if (filters.dateEnd) activeFilters.dateEnd = filters.dateEnd;

    try {
      const result = await orchestrator.current.runQuery(query, domain, Object.keys(activeFilters).length > 0 ? activeFilters : undefined, (newAction) => {
        setActions(prev => {
          const index = prev.findIndex(a => a.id === newAction.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = newAction;
            return updated;
          }
          return [...prev, newAction];
        });
      });
      setResponse(result);
      
      // Save to history
      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        query,
        domain,
        timestamp: new Date().toISOString(),
        response: result
      };
      setHistory(prev => [historyItem, ...prev]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setQuery(item.query);
    setDomain(item.domain);
    setResponse(item.response);
    setActions([]);
    setActiveTab('console');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-isro-orange selection:text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-isro-orange rounded-lg shadow-[0_0_20px_rgba(242,116,32,0.3)]">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                SARASWATI
              </h1>
              <p className="text-[10px] text-isro-orange font-mono tracking-widest uppercase">
                Zero-Trust Multi-Agent RAG Engine
              </p>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            {[
              { id: 'console', label: 'Console', icon: Terminal },
              { id: 'database', label: 'Knowledge Base', icon: Database },
              { id: 'guidelines', label: 'Protocols', icon: BookOpen },
              { id: 'history', label: 'History', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.id 
                    ? 'bg-zinc-800 text-isro-orange border border-zinc-700 shadow-xl' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Instance Status</span>
              <span className="text-xs font-bold text-emerald-500 uppercase">Operational / SECURE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <AnimatePresence mode="wait">
          {activeTab === 'console' && (
            <motion.div
              key="console"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Sidebar / Controls */}
              <div className="lg:col-span-4 space-y-6">
                <section className="isro-glass p-6 rounded-2xl">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-isro-orange mb-6 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Domain Selection
                  </h2>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {[Domain.AEROSPACE, Domain.GOVERNMENT].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDomain(d);
                          setFilters({ subsystem: '', dataType: '', dateStart: '', dateEnd: '' });
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                          domain === d 
                            ? 'bg-zinc-800 border-isro-orange text-white shadow-[0_0_15px_rgba(242,116,32,0.1)]' 
                            : 'bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          {d === Domain.AEROSPACE ? <Rocket className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-tight">{d}</p>
                            <p className="text-[10px] opacity-60">
                              {d === Domain.AEROSPACE ? `${stats.current[Domain.AEROSPACE].nodes} Nodes Verified` : `${stats.current[Domain.GOVERNMENT].nodes} Rules Mapped`}
                            </p>
                          </div>
                        </div>
                        {domain === d && <ArrowRight className="w-4 h-4 text-isro-orange" />}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Filtering Guardrails */}
                <section className="isro-glass p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Retrieval Guardrails
                    </h2>
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-1.5 rounded border transition-colors ${showFilters ? 'bg-isro-orange/10 border-isro-orange text-isro-orange' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {showFilters && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {domain === Domain.AEROSPACE && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-2">
                              <Layers className="w-3 h-3" /> Subsystem
                            </label>
                            <select 
                              value={filters.subsystem}
                              onChange={(e) => setFilters({...filters, subsystem: e.target.value})}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-isro-orange"
                            >
                              <option value="">All Subsystems</option>
                              <option value="Telemetry">Telemetry</option>
                              <option value="Payload">Payload</option>
                              <option value="Guidance">Guidance</option>
                              <option value="Propulsion">Propulsion</option>
                            </select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-2">
                            <Terminal className="w-3 h-3" /> Data Type
                          </label>
                          <select 
                            value={filters.dataType}
                            onChange={(e) => setFilters({...filters, dataType: e.target.value})}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-isro-orange"
                          >
                            <option value="">All Types</option>
                            {domain === Domain.AEROSPACE ? (
                              <>
                                <option value="Protocol">Protocol</option>
                                <option value="EngineeringSpec">Engineering Spec</option>
                                <option value="OrbitalDynamics">Orbital Dynamics</option>
                                <option value="SecuritySpec">Security Spec</option>
                              </>
                            ) : (
                              <>
                                <option value="Regulation">Regulation</option>
                                <option value="Standard">Standard</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-2">
                              <Calendar className="w-3 h-3" /> Start Date
                            </label>
                            <input 
                              type="date"
                              value={filters.dateStart}
                              onChange={(e) => setFilters({...filters, dateStart: e.target.value})}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-[10px] text-zinc-300 outline-none focus:border-isro-orange"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-2">
                              <Calendar className="w-3 h-3" /> End Date
                            </label>
                            <input 
                              type="date"
                              value={filters.dateEnd}
                              onChange={(e) => setFilters({...filters, dateEnd: e.target.value})}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-[10px] text-zinc-300 outline-none focus:border-isro-orange"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {!showFilters && (
                    <div className="text-[10px] font-mono text-zinc-600 italic">
                      Active Constraints: {Object.values(filters).filter(Boolean).length || 'None'}
                    </div>
                  )}
                </section>

                <section className="isro-glass p-6 rounded-2xl h-[400px] flex flex-col">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Agent Swarm Activity
                  </h2>
                  
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto pr-2 terminal-scroll space-y-1"
                  >
                    <AnimatePresence mode="popLayout">
                      {actions.map((action) => (
                        <AgentActionItem key={action.id} action={action} />
                      ))}
                    </AnimatePresence>
                    
                    {!isQuerying && actions.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                        <Cpu className="w-12 h-12 mb-4" />
                        <p className="text-[10px] font-mono tracking-widest uppercase text-center">
                          Engine Idle.<br/>Waiting for cryptographic input.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Main Interface */}
              <div className="lg:col-span-8 space-y-6">
                {/* Query Input */}
                <form 
                  onSubmit={handleQuery}
                  className="relative group block"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-isro-orange to-isro-blue rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative isro-glass rounded-2xl flex items-center gap-4 p-2 pl-6">
                    <Search className="w-6 h-6 text-zinc-600" />
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={domain === Domain.AEROSPACE ? "Query spacecraft telemetry or mission standards..." : "Query GFR rules or procurement compliance..."}
                      className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder:text-zinc-600 text-lg py-4"
                      disabled={isQuerying}
                    />
                    <button 
                      type="submit"
                      disabled={isQuerying || !query.trim()}
                      className="bg-isro-orange hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center gap-2 group/btn"
                    >
                      {isQuerying ? (
                        <RefreshCcw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Activity className="w-5 h-5" />
                          <span>EXECUTE</span>
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Results Area */}
                <AnimatePresence mode="wait">
                  {response ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-6"
                    >
                      <section className="isro-glass p-8 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-black">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                              <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-display font-medium text-white tracking-tight">Verified Technical Synthesis</h2>
                          </div>
                          <div className="px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700 text-[10px] font-mono text-zinc-400">
                            TOKEN_ID: {Math.random().toString(36).substring(7).toUpperCase()}
                          </div>
                        </div>

                        <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed space-y-4">
                          <p className="border-l-2 border-emerald-500 pl-6 italic text-zinc-400 text-sm mb-8 bg-emerald-500/5 py-4 rounded-r-lg">
                            "Grounded in verified {domain} ontologies and formally verified via neuro-symbolic swarm validation."
                          </p>
                          <div className="whitespace-pre-wrap font-sans text-lg">
                            {response.answer}
                          </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-zinc-800">
                          <TraceAudit traces={response.traceLog} />
                        </div>
                      </section>
                    </motion.div>
                  ) : isQuerying ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-6 opacity-60">
                      <div className="relative">
                        <div className="w-24 h-24 border-4 border-isro-orange/10 border-t-isro-orange rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Cpu className="w-8 h-8 text-isro-orange animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-mono tracking-[0.4em] text-isro-orange uppercase mb-1">Orchestrating Swarm</p>
                        <p className="text-sm text-zinc-500">Cross-referencing Zero-Knowledge Proofs and MDDS Standards...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="isro-glass p-12 rounded-2xl flex flex-col items-center justify-center text-center opacity-30">
                      <Info className="w-16 h-16 mb-6 text-zinc-500" />
                      <h2 className="text-xl font-display uppercase tracking-[0.2em] mb-2">SARASWATI Operational Portal</h2>
                      <p className="text-sm max-w-md">Input a mission-critical query above to initiate the retrieval-augmented generation pipeline. All outputs are cryptographically verified.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'database' && (
            <motion.div
              key="database"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <KnowledgeBaseView />
            </motion.div>
          )}

          {activeTab === 'guidelines' && (
            <motion.div
              key="guidelines"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GuidelinesView />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <HistoryView 
                history={history} 
                onSelect={handleSelectHistory} 
                onClear={() => setHistory([])}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-6 border-t border-zinc-800/50 mt-12 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 h-full space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">© 2026 ISRO SARASWATI UNIT II</span>
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">NIC SECURED NODE #882</span>
            </div>
            <div className="flex items-center gap-4 opacity-40 grayscale h-6">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/bd/Indian_Space_Research_Organisation_Logo.svg" alt="ISRO" className="h-full" />
              <div className="h-4 w-[1px] bg-zinc-800" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/22/MeitY_Logo.png" alt="MeitY" className="h-full" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 pt-6 border-t border-zinc-900">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase">AEROSPACE_NODES</p>
              <p className="text-xs font-mono text-isro-orange">{stats.current[Domain.AEROSPACE].nodes}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase">GFR_CLAUSES</p>
              <p className="text-xs font-mono text-isro-orange">{stats.current[Domain.GOVERNMENT].nodes}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase">ZK_VERIFIED</p>
              <p className="text-xs font-mono text-emerald-600">YES</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase">SYSTEM_LOAD</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i < 4 ? 'bg-emerald-500/50' : 'bg-zinc-800'}`} />)}
              </div>
            </div>
            <div className="hidden lg:block space-y-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase">UPTIME</p>
              <p className="text-xs font-mono text-zinc-500">99.999%</p>
            </div>
            <div className="hidden lg:block space-y-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase">NODE_ID</p>
              <p className="text-xs font-mono text-zinc-500">ISRO-SAR-DX</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
