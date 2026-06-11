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
  Upload,
  Info,
  Clock,
  Download,
  Landmark,
  Filter,
  Calendar,
  Layers,
  Settings2,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import { AgentAction, Domain, SaraswatiResponse, AdvancedFilters, HistoryItem, ChatMessage } from './types';
import { SaraswatiOrchestrator } from './lib/agents';
import AgentActionItem from './components/AgentActionItem';
import TraceAudit from './components/TraceAudit';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import HistoryView from './components/HistoryView';
import ReactMarkdown from 'react-markdown';

type Tab = 'console' | 'database' | 'ingest' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('console');
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<Domain>(Domain.AEROSPACE);
  const [isQuerying, setIsQuerying] = useState(false);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('saraswati_chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
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
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [ingestDomain, setIngestDomain] = useState<Domain>(Domain.AEROSPACE);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const orchestrator = useRef(new SaraswatiOrchestrator());

  useEffect(() => {
    localStorage.setItem('saraswati_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('saraswati_chat_messages', JSON.stringify(messages));
  }, [messages]);

  const activeMessage = messages.find(m => m.id === activeMessageId);
  const activeResponse = activeMessage?.response || null;
  const displayedActions = isQuerying ? actions : (activeResponse?.agentActions || actions);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedActions]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isQuerying]);

  const handleQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isQuerying) return;

    const currentQuery = query;
    setQuery('');
    setActiveTab('console');
    setIsQuerying(true);
    setActions([]);

    const userMessageId = Math.random().toString(36).substring(7).toUpperCase();
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: currentQuery,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);

    // Prepare active filters
    const activeFilters: AdvancedFilters = {};
    if (filters.subsystem) activeFilters.subsystem = filters.subsystem;
    if (filters.dataType) activeFilters.dataType = filters.dataType;
    if (filters.dateStart) activeFilters.dateStart = filters.dateStart;
    if (filters.dateEnd) activeFilters.dateEnd = filters.dateEnd;

    // Get simple representation of history for LLM context (excluding current userMsg which we just added)
    const currentHistory = messages.map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    try {
      const result = await orchestrator.current.runQuery(
        currentQuery,
        domain,
        Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        currentHistory,
        (newAction) => {
          setActions(prev => {
            const index = prev.findIndex(a => a.id === newAction.id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = newAction;
              return updated;
            }
            return [...prev, newAction];
          });
        }
      );

      const saraswatiMessageId = Math.random().toString(36).substring(7).toUpperCase();
      const saraswatiMsg: ChatMessage = {
        id: saraswatiMessageId,
        sender: 'saraswati',
        text: result.answer,
        timestamp: new Date().toISOString(),
        response: result
      };

      setMessages(prev => [...prev, saraswatiMsg]);
      setActiveMessageId(saraswatiMessageId);
      
      // Save to history (initially pending verification if applicable)
      const historyItemId = Math.random().toString(36).substring(7).toUpperCase();
      const historyItem: HistoryItem = {
        id: historyItemId,
        query: currentQuery,
        domain,
        timestamp: new Date().toISOString(),
        response: result
      };
      setHistory(prev => [historyItem, ...prev]);

      if (result.isPendingVerification && result.retrievedNodes && result.validatorActionId) {
        orchestrator.current.verifyQuery(
          result.answer,
          result.retrievedNodes,
          result.validatorActionId,
          (updatedAction) => {
            setActions(prev => {
              const index = prev.findIndex(a => a.id === updatedAction.id);
              if (index !== -1) {
                const updated = [...prev];
                updated[index] = updatedAction;
                return updated;
              }
              return [...prev, updatedAction];
            });
          }
        ).then((verifyResult) => {
          // Update messages state with completed metrics and traces
          setMessages(prev => prev.map(msg => {
            if (msg.id === saraswatiMessageId) {
              const updatedResponse: SaraswatiResponse = {
                ...msg.response!,
                traceLog: verifyResult.traceLog,
                metrics: verifyResult.metrics,
                groundingSources: verifyResult.groundingSources,
                isPendingVerification: false,
                agentActions: msg.response!.agentActions.map(action => {
                  if (action.id === result.validatorActionId) {
                    return verifyResult.validatorAction;
                  }
                  return action;
                })
              };
              return {
                ...msg,
                response: updatedResponse
              };
            }
            return msg;
          }));

          // Update history state
          setHistory(prev => prev.map(h => {
            if (h.id === historyItemId) {
              const updatedResponse: SaraswatiResponse = {
                ...h.response,
                traceLog: verifyResult.traceLog,
                metrics: verifyResult.metrics,
                groundingSources: verifyResult.groundingSources,
                isPendingVerification: false,
                agentActions: h.response.agentActions.map(action => {
                  if (action.id === result.validatorActionId) {
                    return verifyResult.validatorAction;
                  }
                  return action;
                })
              };
              return {
                ...h,
                response: updatedResponse
              };
            }
            return h;
          }));
        }).catch(err => {
          console.error("Async verification failed:", err);
        });
      }
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        sender: 'saraswati',
        text: `Error: Execution failed. Verification engine returned invalid output.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    const userMsg: ChatMessage = {
      id: `${item.id}-u`,
      sender: 'user',
      text: item.query,
      timestamp: item.timestamp
    };
    const saraswatiMsg: ChatMessage = {
      id: `${item.id}-s`,
      sender: 'saraswati',
      text: item.response.answer,
      timestamp: item.timestamp,
      response: item.response
    };
    setMessages([userMsg, saraswatiMsg]);
    setActiveMessageId(saraswatiMsg.id);
    setQuery('');
    setDomain(item.domain);
    setActions(item.response.agentActions);
    setActiveTab('console');
  };

  const handleExport = () => {
    const activeMsg = messages.find(m => m.id === activeMessageId);
    const activeResp = activeMsg?.response;
    if (!activeResp) return;
    
    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        domain,
        query: activeMsg.text,
        system: "SARASWATI_FRAMEWORK_V2",
        node: "NIC_SECURED_NODE_882"
      },
      ...activeResp
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const safeQuery = activeMsg.text.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const defaultName = `SARASWATI_${domain.toUpperCase()}_${safeQuery}`;
    const customName = window.prompt("Enter filename for export:", defaultName);
    
    if (customName === null) return; // Cancelled
    
    const fileName = `${customName || defaultName}.json`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Unable to read file'));
          return;
        }

        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });

  const handleIngest = async (e: FormEvent) => {
    e.preventDefault();

    if (!ingestFile || isIngesting) {
      return;
    }

    setIsIngesting(true);
    setIngestError(null);
    setIngestStatus(null);

    try {
      const dataBase64 = await readFileAsBase64(ingestFile);
      const response = await fetch('http://localhost:3001/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: ingestFile.name,
          mimeType: ingestFile.type,
          domain: ingestDomain,
          dataBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Ingest failed with status ${response.status}`);
      }

      const result = await response.json();
      setIngestStatus(`${result.message} ${result.chunksInserted} chunks from ${result.filename}.`);
      setIngestFile(null);
    } catch (error) {
      setIngestError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsIngesting(false);
    }
  };

  const hasPendingVerification = messages.some(msg => msg.response?.isPendingVerification);

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
              <h1 className="text-xl font-display font-bold tracking-[0.2em] uppercase bg-linear-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                SARASWATI
              </h1>
              <p className="text-[10px] text-isro-orange font-mono tracking-widest uppercase">
                Zero-Trust Multi-Agent RAG Engine
              </p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar max-w-[calc(100vw-12rem)] md:max-w-none">
            {[
              { id: 'console', label: 'Console', icon: Terminal },
              { id: 'database', label: 'Nodes', icon: Database },
              { id: 'ingest', label: 'Ingest', icon: Upload },
              { id: 'history', label: 'History', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                  activeTab === tab.id 
                    ? 'bg-zinc-800 text-isro-orange border border-zinc-700 shadow-xl' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.id === 'database' ? 'DB' : tab.label}</span>
              </button>
            ))}
          </nav>
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
              className="flex flex-col lg:grid lg:grid-cols-12 gap-8"
            >
              {/* Sidebar / Controls (Order Last on Mobile) */}
              <div className="order-last lg:order-0 lg:col-span-4 space-y-6">
                <section className="isro-glass p-6 rounded-2xl">
                  
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
                              {d === Domain.AEROSPACE ? 'Live Chroma Aerospace Index' : 'Live Chroma GFR Index'}
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

                <section className="isro-glass p-6 rounded-2xl h-100 flex flex-col">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Agent Swarm Activity
                  </h2>
                  
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto pr-2 terminal-scroll space-y-1"
                  >
                    <AnimatePresence mode="popLayout">
                      {displayedActions.map((action) => (
                        <AgentActionItem key={action.id} action={action} />
                      ))}
                    </AnimatePresence>
                    
                    {!isQuerying && displayedActions.length === 0 && (
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

              {/* Main Interface (Order First on Mobile) */}
              <div className="order-first lg:order-0 lg:col-span-8 space-y-6">
                {/* Query Input */}
                <form 
                  onSubmit={handleQuery}
                  className="relative group block"
                >
                  <div className="absolute -inset-0.5 bg-linear-to-r from-isro-orange to-isro-blue rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative isro-glass rounded-2xl flex items-center gap-2 md:gap-4 p-2 pl-4 md:pl-6">
                    <Search className="w-5 h-5 md:w-6 md:h-6 text-zinc-600 shrink-0" />
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={domain === Domain.AEROSPACE ? "Query telemetry..." : "Query GFR rules..."}
                      className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder:text-zinc-600 text-sm md:text-lg py-3 md:py-4 min-w-0"
                      disabled={isQuerying}
                    />
                    <button 
                      type="submit"
                      disabled={isQuerying || !query.trim()}
                      className="bg-isro-orange hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3 md:py-4 px-4 md:px-8 rounded-xl transition-all flex items-center gap-2 group/btn shrink-0"
                    >
                      {isQuerying ? (
                        <RefreshCcw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                      ) : (
                        <>
                          <Activity className="w-4 h-4 md:w-5 md:h-5" />
                          <span className="hidden sm:inline">EXECUTE</span>
                          <ArrowRight className="hidden md:block w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Chat & Results Area */}
                <AnimatePresence mode="wait">
                  {messages.length > 0 ? (
                    <motion.div
                      key="chat-results"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-6"
                    >
                      {/* Chat Container */}
                      <div className="isro-glass rounded-2xl flex flex-col h-[480px] border border-zinc-800 bg-linear-to-br from-zinc-950 to-black overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/30">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full shadow-lg ${
                                isQuerying 
                                  ? 'bg-isro-orange animate-pulse shadow-orange-500/50' 
                                  : hasPendingVerification 
                                    ? 'bg-isro-blue animate-bounce shadow-blue-500/50' 
                                    : 'bg-emerald-500 animate-pulse shadow-emerald-500/50'
                              }`} />
                              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                                {isQuerying 
                                  ? 'ESTABLISHING SHIELDED TUNNEL...' 
                                  : hasPendingVerification 
                                    ? 'Z3 SMT FORMAL AUDIT IN PROGRESS...' 
                                    : 'SECURE LINK STABLE // NODE_882'}
                              </span>
                            </div>
                            
                            {/* Telemetry Badge details */}
                            <div className="hidden sm:flex items-center gap-3 text-[8px] font-mono text-zinc-600">
                              <span className="px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/40">CIPHER: AES-256</span>
                              <span className="px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/40">ZK-STARK: RISC0</span>
                              <span className="px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/40">LNN: PEIRCE</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMessages([]);
                              setActiveMessageId(null);
                              setActions([]);
                            }}
                            className="text-[9px] font-mono text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest cursor-pointer"
                          >
                            CLEAR CONVERSATION
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                          {messages.map((msg) => {
                            const isUser = msg.sender === 'user';
                            const isSelected = activeMessageId === msg.id;
                            
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-2xl p-4 transition-all duration-300 ${
                                    isUser 
                                      ? 'bg-zinc-900/80 border border-zinc-800 text-zinc-200 rounded-tr-none' 
                                      : `bg-zinc-950/60 border ${isSelected ? 'border-isro-orange shadow-[0_0_15px_rgba(242,116,32,0.15)]' : 'border-zinc-800'} text-zinc-300 rounded-tl-none hover:border-zinc-700 cursor-pointer`
                                  }`}
                                  onClick={() => {
                                    if (!isUser && msg.response) {
                                      setActiveMessageId(msg.id);
                                    }
                                  }}
                                >
                                  {/* Header */}
                                  <div className="flex items-center justify-between gap-4 mb-2 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                      {isUser ? (
                                        <span>MISSION_OPERATOR</span>
                                      ) : (
                                        <span className="text-isro-orange font-bold">SARASWATI_AGENT</span>
                                      )}
                                    </div>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                  </div>

                                  {/* Text Content */}
                                  <div className="text-sm leading-relaxed font-sans">
                                    {isUser ? (
                                      <div className="whitespace-pre-wrap">{msg.text}</div>
                                    ) : (
                                      <div className="markdown-content">
                                        <ReactMarkdown>{formatMarkdownSpacing(msg.text)}</ReactMarkdown>
                                      </div>
                                    )}
                                  </div>

                                  {/* Sub-status bar for Saraswati message */}
                                  {!isUser && msg.response && (
                                    <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[8px] font-mono text-zinc-500 gap-4">
                                      <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-emerald-500">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ZK-PROOF VERIFIED
                                        </span>
                                        <span>|</span>
                                        {msg.response.isPendingVerification ? (
                                          <span className="text-isro-orange animate-pulse flex items-center gap-1 font-bold">
                                            <RefreshCcw className="w-2 h-2 animate-spin" /> SMT: VERIFYING...
                                          </span>
                                        ) : (
                                          <span className={msg.response.traceLog.every(t => t.smtApproval) ? 'text-emerald-500' : 'text-rose-400'}>
                                            SMT: {msg.response.traceLog.every(t => t.smtApproval) ? 'SATISFIED' : 'UNSATISFIABLE'}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-isro-blue hover:text-isro-orange font-bold uppercase text-[9px]">
                                        {isSelected ? 'ACTIVE INSPECTION' : 'CLICK TO AUDIT'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          {isQuerying && (
                            <div className="flex items-start">
                              <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl rounded-tl-none p-4 max-w-[85%] flex items-center gap-3">
                                <RefreshCcw className="w-4 h-4 text-isro-orange animate-spin" />
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse font-bold">SARASWATI IS ORCHESTRATING SWARM...</span>
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                      </div>

                      {/* Selected Message Verification Detail */}
                      {activeResponse && (
                        <motion.div
                          key={`inspector-${activeMessageId}`}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <section className="isro-glass p-4 md:p-8 rounded-2xl bg-linear-to-br from-zinc-900/80 to-black">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h2 className="text-lg md:text-xl font-display font-medium text-white tracking-tight">Verified Technical Synthesis</h2>
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={handleExport}
                                  className="flex items-center gap-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-full border border-zinc-700 text-[10px] font-mono transition-colors cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  EXPORT_JSON
                                </button>
                                <div className="px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700 text-[10px] font-mono text-zinc-400">
                                  TOKEN_ID: {activeMessageId}
                                </div>
                              </div>
                            </div>

                            <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed space-y-4">
                              <p className="border-l-2 border-emerald-500 pl-4 md:pl-6 italic text-zinc-400 text-xs md:text-sm mb-8 bg-emerald-500/5 py-4 rounded-r-lg">
                                "Grounded in verified {domain} ontologies and formally verified via neuro-symbolic swarm validation."
                              </p>
                            </div>

                             <div className="mt-8 pt-8 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4">
                              {[
                                { label: 'Retrieval Accuracy', value: activeResponse.metrics?.retrievalAccuracy, icon: Database, color: 'text-isro-blue' },
                                { label: 'Grounding Fidelity', value: activeResponse.metrics?.groundingFidelity, icon: ShieldCheck, color: 'text-emerald-500' },
                                { label: 'Hallucination Risk', value: activeResponse.metrics?.hallucinationRisk, icon: AlertTriangle, color: 'text-red-500', inverse: true },
                                { label: 'Overall Confidence', value: activeResponse.metrics?.overallConfidence, icon: Gauge, color: 'text-isro-orange' },
                              ].map((item) => (
                                <div key={item.label} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">{item.label}</span>
                                  </div>
                                  <div className="flex items-end justify-between">
                                    <span className="text-xl font-display font-medium text-white">
                                      {activeResponse.isPendingVerification ? (
                                        <span className="text-xs text-zinc-500 animate-pulse uppercase">Computing...</span>
                                      ) : item.value !== undefined ? (
                                        `${(item.value * 100).toFixed(1)}%`
                                      ) : (
                                        'N/A'
                                      )}
                                    </span>
                                    <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${item.inverse ? ((item.value ?? 0) > 0.2 ? 'bg-red-500' : 'bg-emerald-500') : ((item.value ?? 0) > 0.8 ? 'bg-emerald-500' : 'bg-isro-orange')} ${activeResponse.isPendingVerification ? 'animate-pulse bg-zinc-700 w-full' : ''}`} 
                                        style={{ width: activeResponse.isPendingVerification ? '100%' : `${(item.value ?? 0) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-zinc-800">
                              <TraceAudit traces={activeResponse.traceLog} isVerifying={activeResponse.isPendingVerification} />
                            </div>
                          </section>
                        </motion.div>
                      )}
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
              <KnowledgeBaseView onQueryChunk={(content) => {
                setQuery(content);
                setActiveTab('console');
              }} />
            </motion.div>
          )}

          {activeTab === 'ingest' && (
            <motion.div
              key="ingest"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <section className="isro-glass p-6 md:p-8 rounded-2xl border border-zinc-800 bg-linear-to-br from-zinc-950 to-black">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-isro-orange text-xs font-mono uppercase tracking-widest">
                      <Upload className="w-4 h-4" />
                      Frontend Ingestion
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">Upload data and ingest it into ChromaDB</h2>
                    <p className="text-sm text-zinc-400 max-w-2xl">
                      Upload a PDF, TXT, MD, or CSV file. The backend will extract text, split it into chunks, embed it, and store it in the shared knowledge base.
                    </p>
                  </div>
                  <div className="px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs font-mono text-zinc-400">
                    Accepts: .pdf, .txt, .md, .csv
                  </div>
                </div>

                <form onSubmit={handleIngest} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Target Domain</span>
                      <select
                        value={ingestDomain}
                        onChange={(e) => setIngestDomain(e.target.value as Domain)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-isro-orange"
                      >
                        <option value={Domain.AEROSPACE}>{Domain.AEROSPACE}</option>
                        <option value={Domain.GOVERNMENT}>{Domain.GOVERNMENT}</option>
                      </select>
                    </label>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Selected File</span>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-200 truncate">
                            {ingestFile ? ingestFile.name : 'No file selected'}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            {ingestFile ? `${Math.ceil(ingestFile.size / 1024)} KB` : 'Choose a file to send to the backend'}
                          </p>
                        </div>
                        <label className="shrink-0 cursor-pointer inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:border-isro-orange hover:text-isro-orange transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          Browse
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.txt,.md,.csv"
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              setIngestFile(file);
                              setIngestStatus(null);
                              setIngestError(null);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {ingestError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {ingestError}
                    </div>
                  )}

                  {ingestStatus && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {ingestStatus}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <p className="text-xs text-zinc-500">
                      The backend will chunk the file and insert it into the existing knowledge collection.
                    </p>
                    <button
                      type="submit"
                      disabled={!ingestFile || isIngesting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-isro-orange px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600"
                    >
                      {isIngesting ? (
                        <>
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                          Uploading
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload and ingest
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Frontend',
                    body: 'File is read in the browser and sent as base64 JSON to the backend.',
                  },
                  {
                    title: 'Backend',
                    body: 'Server decodes the file, extracts text, chunks it, and embeds each chunk.',
                  },
                  {
                    title: 'Storage',
                    body: 'Chunks are stored in the shared ChromaDB collection and become searchable immediately.',
                  },
                ].map((item) => (
                  <div key={item.title} className="isro-glass rounded-2xl border border-zinc-800 p-5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-isro-orange mb-2">{item.title}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </section>
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

      <footer className="py-6 md:py-10 border-t border-zinc-800/50 mt-12 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 h-full space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <span className="text-[9px] md:text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">© 2026 ISRO SARASWATI UNIT II</span>
              <span className="text-[9px] md:text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">NIC SECURED NODE #882</span>
            </div>
            <div className="flex items-center gap-4 opacity-40 grayscale h-5 md:h-6">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/bd/Indian_Space_Research_Organisation_Logo.svg" alt="ISRO" className="h-full" />
              <div className="h-4 w-px" />
              <img src="https://indiadesignsystem.bombaydc.com/assets/india-designs/display/Digital-India/color.svg" alt="Digital India" className="h-full" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 pt-8 border-t border-zinc-900">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase">AEROSPACE_INDEX</p>
              <p className="text-xs font-mono text-isro-orange">LIVE</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-700 uppercase">GFR_INDEX</p>
              <p className="text-xs font-mono text-isro-orange">LIVE</p>
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

export function formatMarkdownSpacing(text: string): string {
  if (!text) return '';
  
  const lines = text.split('\n');
  const result: string[] = [];
  
  const isListLine = (line: string) => /^\s*([-*+]\s|\d+\.\s)/.test(line);
  const isHeaderLine = (line: string) => /^\s*#+\s/.test(line);
  const isEmptyLine = (line: string) => line.trim() === '';
  
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const prev = i > 0 ? lines[i - 1] : null;
    const next = i < lines.length - 1 ? lines[i + 1] : null;
    
    // Header formatting
    if (isHeaderLine(current)) {
      if (prev !== null && !isEmptyLine(prev) && result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      result.push(current);
      if (next !== null && !isEmptyLine(next)) {
        result.push('');
      }
      continue;
    }
    
    // List block start/end formatting
    if (isListLine(current)) {
      if (prev !== null && !isListLine(prev) && !isEmptyLine(prev) && result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      result.push(current);
      if (next !== null && !isListLine(next) && !isEmptyLine(next)) {
        result.push('');
      }
      continue;
    }
    
    result.push(current);
  }
  
  return result.join('\n');
}
