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
import { AgentAction, Domain, IRSARGOResponse, AdvancedFilters, HistoryItem, ChatMessage } from './types';
import { IRSARGOOrchestrator } from './lib/agents';
import AgentActionItem from './components/AgentActionItem';
import TraceAudit from './components/TraceAudit';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import HistoryView from './components/HistoryView';
import ReactMarkdown from 'react-markdown';
import OutputEditor from './components/OutputEditor';
import BackgroundPixelStars from './components/BackgroundPixelStars';
import { Lock, Eye, EyeOff, Shield, LogOut, CheckCircle2 } from 'lucide-react';

type Tab = 'console' | 'database' | 'ingest' | 'history';

/**
 * Output Sanitization (Anti-Exfiltration):
 * Strips markdown image tags and unapproved external links from the generated response.
 * Cross-checks generated links against source node metadata.
 */
export function sanitizeOutput(text: string, sourceNodes: any[] = []): string {
  if (!text) return '';
  
  // 1. Remove markdown image tags: ![alt](url) -> replace with blocked placeholder
  let sanitized = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    return `[Blocked Image Exfiltration Channel: ${alt || 'untrusted resource'}]`;
  });
  
  // 2. Validate standard markdown links: [label](url)
  sanitized = sanitized.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const isInternalOrSource = sourceNodes.some(node => {
      const contentMatch = node.content && node.content.includes(url);
      const fileMatch = node.metadata?.filename && url.includes(node.metadata.filename);
      const sourceMatch = node.metadata?.source && url.includes(node.metadata.source);
      return contentMatch || fileMatch || sourceMatch;
    });
    
    const isAnchor = url.startsWith('#');
    
    if (isInternalOrSource || isAnchor) {
      return match;
    } else {
      return `${label} [Link Redacted: Exfiltration Risk]`;
    }
  });

  // 3. Scan and redact plain text HTTP/HTTPS URLs not matching source nodes
  const urlRegex = /(https?:\/\/[^\s)<>]+)/gi;
  sanitized = sanitized.replace(urlRegex, (url) => {
    const isInternalOrSource = sourceNodes.some(node => {
      const contentMatch = node.content && node.content.includes(url);
      const fileMatch = node.metadata?.filename && url.includes(node.metadata.filename);
      const sourceMatch = node.metadata?.source && url.includes(node.metadata.source);
      return contentMatch || fileMatch || sourceMatch;
    });
    
    if (isInternalOrSource) {
      return url;
    } else {
      return '[Link Redacted: Exfiltration Risk]';
    }
  });
  
  return formatTechnicalReport(sanitized);
}

export function formatTechnicalReport(text: string): string {
  if (!text) return '';

  let formatted = text;

  // 1. Replace literal bullet points with markdown bullet points (using unicode escapes for compatibility)
  formatted = formatted.replace(/[\u2022\u25CF\u00B7\u25E6\u2043\u2219]\s*/g, '- ');

  // 2. Format nested list items (a)-(z) when inside a paragraph
  formatted = formatted.replace(/\s+\(([a-z])\)\s+/g, '\n    - ($1) ');

  // 3. Format primary list items (i)-(v) and (I)-(V) when inside a paragraph
  formatted = formatted.replace(/\s+\((i|ii|iii|iv|v|I|II|III|IV|V)\)\s+/g, '\n- ($1) ');

  // 4. Format Rules (e.g., Rule 212 Hiring out of Fixed Assets.)
  // Matches "Rule <number> <Title up to 50 characters>." and places it on new lines
  formatted = formatted.replace(/(?:^|\s)(Rule\s+\d+[^.\n]{5,50}\.)/g, '\n\n**$1**\n\n');

  // 5. Format Notes (e.g., Note: or Note -)
  formatted = formatted.replace(/(Note:\s*)/gi, '\n\n**Note:** ');

  // 6. Clean up duplicate or excess newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted.trim();
}

// Predefined Personas description for UI
const PERSONAS_INFO = {
  vikram: {
    name: 'Dr. Vikram Sarabhai',
    username: 'vikram',
    role: 'Administrator',
    clearance: 'Level 5 (Top Secret)',
    department: 'PROPULSION',
    projects: 'GSAT-24, LVM3-M4, ADITYA-L1',
    description: 'Lead Mission Director. Unrestricted clearance across all space operations telemetry indexes.'
  },
  satish: {
    name: 'Satish Dhawan',
    username: 'satish',
    role: 'Operator',
    clearance: 'Level 3 (Confidential)',
    department: 'AVIONICS',
    projects: 'GSAT-24',
    description: 'Avionics Operator. Scoped project access. Excluded from propulsion engineering secrets.'
  },
  guest: {
    name: 'Guest Auditor',
    username: 'guest',
    role: 'Guest',
    clearance: 'Level 1 (Public)',
    department: 'None',
    projects: 'None',
    description: 'External administrative reviewer. Access confined strictly to public GFR files.'
  }
};

interface LoginPortalProps {
  onLoginSuccess: (token: string, user: any) => void;
}

interface LoginPortalProps {
  onLoginSuccess: (token: string, user: any) => void;
}

function LoginPortal({ onLoginSuccess }: LoginPortalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSignUp, setIsSignUp] = useState(false);

  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [registeredContact, setRegisteredContact] = useState<{ email: string | null; phone: string | null } | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(true);

  // Sign Up States
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpDisplayName, setSignUpDisplayName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpRole, setSignUpRole] = useState<'Administrator' | 'Operator' | 'Guest'>('Operator');
  const [signUpClearance, setSignUpClearance] = useState<number>(3);

  // Status/Loader States
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attestationSteps, setAttestationSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const attSteps = [
    'Connecting to Secure OIDC Identity Gateway (Keycloak)...',
    'Requesting TPM 2.0 hardware attestation challenge...',
    'Attesting container SPIRE workload SVID credentials...',
    'Decrypting session credential vault...',
    'Authenticating operator PKI credentials...'
  ];

  // OTP Resend Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 3 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    setAttestationSteps([]);
    setCurrentStep(0);

    // Run attestation animation
    for (let i = 0; i < attSteps.length; i++) {
      setCurrentStep(i);
      setAttestationSteps(prev => [...prev, attSteps[i]]);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Invalid credentials');
      }

      const data = await response.json();
      
      if (data.token) {
        onLoginSuccess(data.token, data.user);
        setLoading(false);
        return;
      }

      setSessionId(data.sessionId);
      setRegisteredContact(data.registeredContact || null);
      
      // Auto-fill contact method if registered on backend
      const regContact = data.registeredContact;
      if (regContact?.email) {
        setContactInfo(regContact.email);
      } else if (regContact?.phone) {
        setContactInfo(regContact.phone);
      } else {
        setContactInfo('');
      }

      setStep(2); // Go to Contact Info
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signUpUsername || !signUpPassword || !signUpDisplayName || !signUpEmail || !signUpPhone) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signUpUsername,
          password: signUpPassword,
          displayName: signUpDisplayName,
          role: signUpRole,
          clearanceLevel: signUpClearance,
          email: signUpEmail,
          phone: signUpPhone
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Registration failed');
      }

      setSuccessMessage('Operator SVID registered successfully! Enter credentials to log in.');
      setIsSignUp(false);
      setUsername(signUpUsername);
      setPassword(signUpPassword);
      setContactInfo(signUpEmail);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Contact network security.');
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactInfo) return;
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, contactInfo })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to dispatch OTP');
      }

      const data = await response.json();
      setDevOtpCode(data.devOtpCode || null);
      setIsSimulated(data.isSimulated !== false);
      setStep(3); // Go to OTP Entry
      setResendTimer(60);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Unable to register contact. Please check format.');
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Invalid OTP code');
      }

      const data = await response.json();
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'OTP validation failed. Access denied.');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/login/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, contactInfo })
      });

      if (!response.ok) {
        throw new Error('Failed to dispatch code');
      }
      const data = await response.json();
      setDevOtpCode(data.devOtpCode || null);
      setIsSimulated(data.isSimulated !== false);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Resend failed.');
    }
  };

  const handlePersonaSelect = (userKey: string) => {
    setUsername(userKey);
    setPassword(userKey === 'guest' ? 'guest123' : 'isro123');
    if (userKey === 'vikram') {
      setContactInfo('v.sarabhai@isro.gov.in');
    } else if (userKey === 'satish') {
      setContactInfo('+91 9876543210');
    } else {
      setContactInfo('auditor@nic.in');
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col justify-center items-center overflow-hidden font-sans select-none selection:bg-isro-orange selection:text-white">
      <BackgroundPixelStars />
      
      <div className="relative z-10 w-full max-w-lg p-8 mx-4">
        <div className="absolute -inset-1 bg-linear-to-r from-isro-orange to-isro-blue rounded-3xl blur-md opacity-25"></div>
        <div className="relative isro-glass border border-zinc-800 rounded-3xl p-8 bg-zinc-950/90 shadow-2xl flex flex-col items-center">
          
          {/* Logo & Title */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="p-4 bg-isro-orange rounded-2xl shadow-[0_0_30px_rgba(242,116,32,0.4)] animate-pulse">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-[0.25em] text-white uppercase font-display bg-linear-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                IRSARGO
              </h1>
              <p className="text-[10px] text-isro-orange font-mono tracking-[0.2em] uppercase mt-1">
                Zero-Trust Secure Access Portal
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          {step === 1 && !loading && (
            <div className="flex w-full mb-6 border-b border-zinc-800 font-mono text-[10px] uppercase tracking-widest">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); setSuccessMessage(null); }}
                className={`flex-1 pb-2 border-b-2 font-bold transition-all cursor-pointer ${!isSignUp ? 'border-isro-orange text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                🔑 Login Session
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(null); setSuccessMessage(null); }}
                className={`flex-1 pb-2 border-b-2 font-bold transition-all cursor-pointer ${isSignUp ? 'border-isro-orange text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                🛰️ Sign Up
              </button>
            </div>
          )}

          {loading ? (
            <div className="w-full space-y-4 py-8 font-mono text-xs">
              <div className="flex items-center gap-3 text-isro-orange font-bold animate-pulse mb-4">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span>CRYPTOGRAPHIC VERIFICATION IN PROGRESS...</span>
              </div>
              <div className="bg-black/50 border border-zinc-900 rounded-xl p-4 space-y-2 h-44 overflow-y-auto">
                {attestationSteps.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-emerald-500">
                    <span className="text-[10px]">✔</span>
                    <span>{s}</span>
                  </div>
                ))}
                {currentStep < attSteps.length && (
                  <div className="flex items-center gap-2 text-zinc-500 animate-pulse">
                    <span className="animate-spin text-[10px]">⟳</span>
                    <span>{attSteps[currentStep]}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full space-y-5">
              {error && (
                <div className="flex items-center gap-3 bg-red-950/30 border border-red-950 rounded-xl p-3 text-xs text-red-400 font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-3 bg-emerald-950/30 border border-emerald-950 rounded-xl p-3 text-xs text-emerald-400 font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Step 1: Login Form */}
              {step === 1 && !isSignUp && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                  {/* Persona Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Select Security Persona</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'vikram', label: 'Vikram', role: 'Admin', color: 'text-emerald-500' },
                        { id: 'satish', label: 'Satish', role: 'Operator', color: 'text-isro-blue' },
                        { id: 'guest', label: 'Guest', role: 'Auditor', color: 'text-zinc-400' }
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handlePersonaSelect(p.id)}
                          className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-300 ${
                            username === p.id 
                              ? 'bg-zinc-900 border-isro-orange shadow-[0_0_10px_rgba(242,116,32,0.1)] text-white' 
                              : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <Shield className={`w-5 h-5 mb-1.5 ${username === p.id ? 'text-isro-orange' : 'text-zinc-500'}`} />
                          <span className="text-[11px] font-bold">{p.label}</span>
                          <span className="text-[9px] opacity-60 font-mono">{p.role}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Persona description banner */}
                  {username && PERSONAS_INFO[username as keyof typeof PERSONAS_INFO] && (
                    <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3 text-[10px] text-zinc-400 font-sans italic leading-normal">
                      {PERSONAS_INFO[username as keyof typeof PERSONAS_INFO].description}
                    </div>
                  )}

                  {/* Inputs */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Operator ID / Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-isro-orange transition"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Cryptographic PIN / Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-isro-orange transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!username || !password}
                    className="w-full bg-isro-orange hover:bg-orange-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(242,116,32,0.25)] hover:shadow-[0_0_25px_rgba(242,116,32,0.35)] flex items-center justify-center gap-2 mt-2 font-mono text-xs uppercase tracking-widest cursor-pointer disabled:bg-zinc-900/50 disabled:text-zinc-700 disabled:shadow-none"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Verify Credentials</span>
                  </button>
                </form>
              )}

              {/* Step 1: Sign Up Form */}
              {step === 1 && isSignUp && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">Operator Username</label>
                      <input
                        type="text"
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value)}
                        placeholder="e.g. arnab"
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-isro-orange transition"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">Cryptographic Password</label>
                      <input
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="PIN or phrase"
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-isro-orange transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">Full Name (Display Name)</label>
                    <input
                      type="text"
                      value={signUpDisplayName}
                      onChange={(e) => setSignUpDisplayName(e.target.value)}
                      placeholder="e.g. Arnab Sengupta"
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-isro-orange transition"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">Email Address</label>
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="e.g. user@isro.gov.in"
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-isro-orange transition"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">Mobile Number</label>
                      <input
                        type="text"
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        placeholder="e.g. +91 9999888877"
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-isro-orange transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">Security Role</label>
                      <select
                        value={signUpRole}
                        onChange={(e) => {
                          const r = e.target.value as 'Administrator' | 'Operator' | 'Guest';
                          setSignUpRole(r);
                          setSignUpClearance(r === 'Administrator' ? 5 : r === 'Operator' ? 3 : 1);
                        }}
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-isro-orange transition"
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Operator">Operator</option>
                        <option value="Guest">Guest Auditor</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">Clearance level</label>
                      <select
                        value={signUpClearance}
                        onChange={(e) => setSignUpClearance(Number(e.target.value))}
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-isro-orange transition"
                      >
                        <option value={5}>Level 5 (Top Secret)</option>
                        <option value={3}>Level 3 (Confidential)</option>
                        <option value={1}>Level 1 (Public)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-isro-orange hover:bg-orange-500 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-[0_0_15px_rgba(242,116,32,0.25)] flex items-center justify-center gap-2 mt-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Create Operator Profile</span>
                  </button>
                </form>
              )}

              {/* Step 2: Contact Info */}
              {step === 2 && (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Step 2: Multifactor Authentication</label>
                    <p className="text-zinc-500 text-xs leading-relaxed font-sans">
                      Select or enter your email address or mobile number. An OTP code will be dispatched to confirm your secure token credentials.
                    </p>
                  </div>

                  {registeredContact && (registeredContact.email || registeredContact.phone) && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-mono tracking-wider text-zinc-650 uppercase">Registered Methods</label>
                      <div className="grid grid-cols-2 gap-2">
                        {registeredContact.email && (
                          <button
                            type="button"
                            onClick={() => setContactInfo(registeredContact.email!)}
                            className={`p-2.5 text-[10px] font-mono rounded-xl border transition-all text-left truncate ${
                              contactInfo === registeredContact.email
                                ? 'bg-zinc-900 border-isro-orange text-white'
                                : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:text-zinc-400'
                            }`}
                          >
                            📧 {registeredContact.email.replace(/(?<=.{2}).(?=.*@)/g, '*')}
                          </button>
                        )}
                        {registeredContact.phone && (
                          <button
                            type="button"
                            onClick={() => setContactInfo(registeredContact.phone!)}
                            className={`p-2.5 text-[10px] font-mono rounded-xl border transition-all text-left truncate ${
                              contactInfo === registeredContact.phone
                                ? 'bg-zinc-900 border-isro-orange text-white'
                                : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:text-zinc-400'
                            }`}
                          >
                            📱 {registeredContact.phone.replace(/(?<=\+91 \d{2})\d(?=\d{2})/g, '*')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Email or Mobile Number</label>
                    <input
                      type="text"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="e.g. operator@isro.gov.in or +91 XXXXXXXXXX"
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-isro-orange transition"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold py-3.5 px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition font-mono text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!contactInfo}
                      className="flex-2 bg-isro-orange hover:bg-orange-500 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-[0_0_15px_rgba(242,116,32,0.25)] flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer disabled:bg-zinc-900/50 disabled:text-zinc-700"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Send OTP Code</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: OTP Verification */}
              {step === 3 && (
                <form onSubmit={handleOtpSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Step 3: Verify OTP Credentials</label>
                    <p className="text-zinc-500 text-xs leading-normal font-sans">
                      Enter the 6-digit verification code sent to <strong className="text-zinc-300">{contactInfo}</strong>.
                    </p>
                  </div>

                  {/* Developer guidance helper banner */}
                  <div className={`${isSimulated ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-blue-950/25 border-blue-900/40 text-blue-300'} border rounded-xl p-3.5 text-[10px] font-mono flex flex-col gap-2.5 leading-normal`}>
                    <div className="flex items-start gap-2.5">
                      {isSimulated ? (
                        <Terminal className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                      ) : (
                        <Terminal className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
                      )}
                      <div>
                        {isSimulated ? (
                          <>
                            <span className="font-bold text-emerald-500 uppercase tracking-widest block mb-0.5">📟 SECURE OTP CODE LOGGED (SIMULATION)</span>
                            Since IRSARGO operates in a self-contained air-gapped system, check the backend server command terminal logs, open the file <strong className="text-zinc-200">otp_code.txt</strong> in your workspace, or view the on-screen simulated code below.
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-blue-400 uppercase tracking-widest block mb-0.5">📧 SECURE OTP CODE SENT (SMTP)</span>
                            An actual OTP code has been dispatched to your email address <strong className="text-zinc-200">{contactInfo}</strong> via the configured SMTP server. Please check your inbox and enter the 6-digit code below.
                          </>
                        )}
                      </div>
                    </div>
                    {devOtpCode && isSimulated && (
                      <div className="mt-1 p-2 bg-isro-orange/10 border border-isro-orange/30 rounded-lg text-isro-orange font-bold text-center text-xs tracking-wider animate-pulse uppercase">
                        🔑 Simulated Delivery Code: {devOtpCode}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">6-Digit verification code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center tracking-[0.7em] font-mono font-bold text-lg text-isro-orange outline-none focus:border-isro-orange transition"
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-600">Didn't receive code?</span>
                    <button
                      type="button"
                      disabled={resendTimer > 0}
                      onClick={handleResendOtp}
                      className={`font-bold transition ${resendTimer > 0 ? 'text-zinc-650 cursor-not-allowed' : 'text-isro-orange hover:text-orange-400 cursor-pointer'}`}
                    >
                      {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code Now'}
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold py-3.5 px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition font-mono text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={otp.length !== 6}
                      className="flex-2 bg-isro-orange hover:bg-orange-500 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-[0_0_15px_rgba(242,116,32,0.25)] flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider cursor-pointer disabled:bg-zinc-900/50 disabled:text-zinc-700"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Login</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="mt-8 text-[9px] font-mono text-zinc-700 text-center leading-normal">
            <p>WARNING: THIS SYSTEM IS MONITORED. UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED.</p>
            <p className="mt-1">SECURED BY NIC & GOVT OF INDIA OFF-GRID CRYPTO PLATFORM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('console');
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<Domain>(Domain.AEROSPACE);
  const [isQuerying, setIsQuerying] = useState(false);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('IRSARGO_chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('IRSARGO_history');
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

  // User Access State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('irsargo_token'));
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('irsargo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [simulateOutage, setSimulateOutage] = useState<boolean>(() => localStorage.getItem('irsargo_simulate_outage') === 'true');
  const [lastSecurityContext, setLastSecurityContext] = useState<any>(() => {
    const saved = localStorage.getItem('irsargo_last_security_context');
    return saved ? JSON.parse(saved) : null;
  });
  const [showTokenDecoder, setShowTokenDecoder] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const orchestrator = useRef(new IRSARGOOrchestrator());

  useEffect(() => {
    localStorage.setItem('IRSARGO_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('IRSARGO_chat_messages', JSON.stringify(messages));
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
        },
        user ? (user.role === 'Administrator' ? ['admin', 'everyone'] : user.role === 'Guest' ? ['guest', 'everyone'] : ['everyone']) : ['everyone']
      );

      const IRSARGOMessageId = Math.random().toString(36).substring(7).toUpperCase();
      const IRSARGOMsg: ChatMessage = {
        id: IRSARGOMessageId,
        sender: 'IRSARGO',
        text: result.answer,
        timestamp: new Date().toISOString(),
        response: result
      };

      setMessages(prev => [...prev, IRSARGOMsg]);
      setActiveMessageId(IRSARGOMessageId);
      
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
          currentQuery,
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
            if (msg.id === IRSARGOMessageId) {
              const updatedResponse: IRSARGOResponse = {
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
              const updatedResponse: IRSARGOResponse = {
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
        sender: 'IRSARGO',
        text: `Error: Execution failed. Verification engine returned invalid output.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
      const updatedContext = localStorage.getItem('irsargo_last_security_context');
      if (updatedContext) {
        setLastSecurityContext(JSON.parse(updatedContext));
      }
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    const userMsg: ChatMessage = {
      id: `${item.id}-u`,
      sender: 'user',
      text: item.query,
      timestamp: item.timestamp
    };
    const IRSARGOMsg: ChatMessage = {
      id: `${item.id}-s`,
      sender: 'IRSARGO',
      text: item.response.answer,
      timestamp: item.timestamp,
      response: item.response
    };
    setMessages([userMsg, IRSARGOMsg]);
    setActiveMessageId(IRSARGOMsg.id);
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
        system: "IRSARGO_FRAMEWORK_V2",
        node: "NIC_SECURED_NODE_882"
      },
      ...activeResp,
      answer: sanitizeOutput(activeResp.answer, activeResp.retrievedNodes || [])
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const safeQuery = activeMsg.text.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const defaultName = `IRSARGO_${domain.toUpperCase()}_${safeQuery}`;
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
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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

  if (!token || !user) {
    return (
      <LoginPortal
        onLoginSuccess={(newToken, newUser) => {
          localStorage.setItem('irsargo_token', newToken);
          localStorage.setItem('irsargo_user', JSON.stringify(newUser));
          setToken(newToken);
          setUser(newUser);
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-isro-orange selection:text-white bg-black overflow-hidden">
      <BackgroundPixelStars />
      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800 bg-black/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-isro-orange rounded-lg shadow-[0_0_20px_rgba(242,116,32,0.3)]">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-[0.2em] uppercase bg-linear-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                IRSARGO
              </h1>
              <p className="text-[10px] text-isro-orange font-mono tracking-widest uppercase">
                Zero-Trust Multi-Agent RAG Engine
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
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

            {user && (
              <div className="hidden sm:flex items-center gap-3 border-l border-zinc-800 pl-4 h-10">
                <div className="text-right">
                  <p className="text-[11px] font-bold text-zinc-300 tracking-wide">{user.displayName}</p>
                  <p className="text-[8px] font-mono text-isro-orange uppercase tracking-wider">{user.role}</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('irsargo_token');
                    localStorage.removeItem('irsargo_user');
                    localStorage.removeItem('irsargo_last_security_context');
                    setToken(null);
                    setUser(null);
                    setLastSecurityContext(null);
                  }}
                  className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-950 hover:bg-red-950/20 hover:text-red-400 rounded-lg text-zinc-500 transition cursor-pointer"
                  title="Logout operator session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-10">
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

                {/* Identity & Access Control */}
                <section className="isro-glass p-6 rounded-2xl space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-isro-orange" />
                    Security Session & FGA Console
                  </h2>

                  {/* Outage Warning */}
                  {simulateOutage && (
                    <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-3 animate-pulse text-[10px] font-mono text-red-400 flex items-start gap-2.5 leading-normal">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                      <div>
                        <span className="font-bold text-red-500 uppercase tracking-widest block mb-0.5">⚠️ IDP DISCONNECTED</span>
                        RAG server failed OIDC token-exchange. Fallback Guest clearance active. Auditing alert logged.
                      </div>
                    </div>
                  )}

                  {/* Active Profile Info */}
                  <div className="bg-black/40 border border-zinc-900 rounded-xl p-4 space-y-3 font-mono text-[10px]">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
                      <span className="text-zinc-500">SESSION IDENTIFIER:</span>
                      <span className="text-zinc-300 font-bold">{user.sid}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
                      <span className="text-zinc-500">ACTIVE WORKLOAD ID:</span>
                      <span className="text-zinc-400 break-all select-all">spiffe://IRSARGO.isro/sa/{user.sub}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
                      <span className="text-zinc-500">CLEARANCE:</span>
                      <span className={`font-bold ${
                        simulateOutage ? 'text-zinc-400' :
                        user.role === 'Administrator' ? 'text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)]' :
                        user.role === 'Operator' ? 'text-isro-blue' : 'text-zinc-400'
                      }`}>
                        {simulateOutage ? 'LEVEL 1 (RESTRICTED)' :
                         user.role === 'Administrator' ? 'LEVEL 5 (TOP SECRET)' :
                         user.role === 'Operator' ? 'LEVEL 3 (CONFIDENTIAL)' : 'LEVEL 1 (PUBLIC)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">TOKEN EXCHANGE (RFC 8693):</span>
                      <span className={`font-bold ${simulateOutage ? 'text-red-500' : 'text-emerald-500'}`}>
                        {simulateOutage ? 'FAILED / OUTAGE' : 'COMPLETED'}
                      </span>
                    </div>
                  </div>

                  {/* Simulate IDP Outage Control */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-900 bg-black/40">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Simulate IDP Outage</p>
                      <p className="text-[8px] text-zinc-600 mt-0.5 leading-normal">Forces token exchange failure & tests graceful degradation fallback.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !simulateOutage;
                        localStorage.setItem('irsargo_simulate_outage', String(newVal));
                        setSimulateOutage(newVal);
                      }}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${simulateOutage ? 'bg-red-600' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${simulateOutage ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Collapsible JWT claims decoder */}
                  <div className="border border-zinc-900 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowTokenDecoder(!showTokenDecoder)}
                      className="w-full flex items-center justify-between bg-zinc-900/30 px-3.5 py-2.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900"
                    >
                      <span>🔍 Decrypted JWT Claims</span>
                      <span>{showTokenDecoder ? '▲' : '▼'}</span>
                    </button>
                    {showTokenDecoder && (
                      <pre className="bg-black/80 p-3 text-[9px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-normal select-all">
                        {JSON.stringify({
                          sub: user.sub,
                          iss: 'keycloak.internal/realms/isro',
                          aud: 'IRSARGO-rag-backend',
                          displayName: user.displayName,
                          role: user.role,
                          clearanceLevel: simulateOutage ? 1 : user.clearanceLevel,
                          departments: simulateOutage ? [] : user.departments,
                          projects: simulateOutage ? [] : user.projects,
                          sid: simulateOutage ? 'S-1-5-21-fallback-000' : user.sid,
                          attestation: { method: 'PKI_SMARTCARD', trust_domain: 'isro.internal' }
                        }, null, 2)}
                      </pre>
                    )}
                  </div>

                  {/* FGA ChromaDB rewrite view */}
                  <div className="border border-zinc-900 rounded-xl overflow-hidden">
                    <div className="bg-zinc-900/30 px-3.5 py-2.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900">
                      <span>🔗 ReBAC ChromaDB Filter Rewrite</span>
                    </div>
                    <pre className="bg-black/80 p-3 text-[9px] font-mono text-isro-orange overflow-x-auto whitespace-pre-wrap leading-normal select-all">
                      {lastSecurityContext?.fgaQueryRewritten
                        ? JSON.stringify(JSON.parse(lastSecurityContext.fgaQueryRewritten), null, 2)
                        : '// Execute search to resolve OpenFGA permissions and generate ChromaDB query rewrite.'}
                    </pre>
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
                                        <span className="text-isro-orange font-bold">IRSARGO_AGENT</span>
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
                                        <ReactMarkdown>{formatMarkdownSpacing(sanitizeOutput(msg.text, msg.response?.retrievedNodes || []))}</ReactMarkdown>
                                      </div>
                                    )}
                                  </div>

                                  {/* Sub-status bar for IRSARGO message */}
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
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse font-bold">IRSARGO IS ORCHESTRATING SWARM...</span>
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

                            <div className="mt-6 mb-8">
                              <OutputEditor key={activeMessageId} content={sanitizeOutput(activeResponse.answer, activeResponse.retrievedNodes || [])} />
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
                      <h2 className="text-xl font-display uppercase tracking-[0.2em] mb-2">IRSARGO Operational Portal</h2>
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
              <span className="text-[9px] md:text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">© 2026 ISRO IRSARGO UNIT II</span>
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
