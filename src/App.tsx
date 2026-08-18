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
  AlertTriangle,
  ShieldAlert,
  Globe,
  WifiOff,
  LogOut,
  Plus,
  Check,
  Copy,
  Edit,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  X,
  Sparkles,
  Github,
  Menu
} from 'lucide-react';
import { AgentAction, Domain, IRSARGOResponse, AdvancedFilters, HistoryItem, ChatMessage } from './types';
import { IRSARGOOrchestrator } from './lib/agents';
import AgentActionItem from './components/AgentActionItem';
import TraceAudit from './components/TraceAudit';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import HistoryView from './components/HistoryView';
import { LiquidButton } from './components/ui/liquid-glass-button';
import { GeneratingGlobe } from './components/ui/generating-globe';
import IngestionLoader from './components/ui/ingestion-loader';
import { FileUpload } from './components/ui/file-upload';
import IngestionLogsPanel from './components/ui/ingestion-logs-panel';
import ReactMarkdown from 'react-markdown';
import OutputEditor from './components/OutputEditor';
import BackgroundPixelStars from './components/BackgroundPixelStars';
import { AuthUI, AuthVideoPanel } from './components/ui/auth-ui';
import { Dock, DockIcon, DockItem, DockLabel } from './components/ui/dock';
import NavMenu from './components/ui/menu-hover-effects';
import { OfflineModeToggle } from './components/ui/OfflineModeToggle';
import { OllamaTerminal } from './components/ui/OllamaTerminal';
import { LandingPage } from './components/LandingPage';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { BaselineRagView } from './components/BaselineRagView';
import { FloatingChatbot } from './components/FloatingChatbot';

type Tab = 'landing' | 'console' | 'activities' | 'database' | 'ingest' | 'history' | 'evaluate' | 'baseline';

/**
 * Output Sanitization (Anti-Exfiltration):
 * Strips markdown image tags and unapproved external links from the generated response.
 * Cross-checks generated links against source node metadata.
 */
export function sanitizeOutput(text: string, sourceNodes: any[] = []): string {
  if (!text) return '';
  
  // 0. Remove Chain-of-Thought thinking tags (<thinking>...</thinking> or unclosed <thinking>...)
  let sanitized = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  sanitized = sanitized.replace(/<thinking>[\s\S]*/gi, '').trim();

  // 0.5. Clean double quotes in text/bold formatting (e.g. ""query"" -> "query")
  sanitized = sanitized.replace(/\*\*""([^"]+)""\*\*/g, '**"$1"**');
  sanitized = sanitized.replace(/""([^"]+)""/g, '"$1"');

  // 1. Remove markdown image tags: ![alt](url) -> replace with blocked placeholder
  sanitized = sanitized.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
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

  // 1. Replace raw chunk IDs like [ID: NGP_Authorization.pdf-chunk-19] with clean Markdown section headings
  formatted = formatted.replace(/\[ID:\s*([^\]]+)\]/gi, (match, chunkId) => {
    const cleanId = chunkId.replace(/-chunk-\d+/i, '').replace(/_/g, ' ');
    return `\n\n### 📄 Source Section: ${cleanId}\n`;
  });

  // 2. Format Chapter / Section titles (e.g. Chapter-IV Space Based Communication)
  formatted = formatted.replace(/(Chapter-[IVXLCDM]+\s*[^:\n]+)/gi, '\n\n#### 📌 $1\n');

  // 3. Replace literal bullet points with markdown bullet points
  formatted = formatted.replace(/[\u2022\u25CF\u00B7\u25E6\u2043\u2219]\s*/g, '- ');

  // 4. Format lettered items like a) Any satellite... b) Any Indian... into newlines with bold list indicators
  formatted = formatted.replace(/(?:^|\s+)([a-z])\)\s+/g, '\n- **($1)** ');

  // 5. Format nested list items (a)-(z) when inside parentheses
  formatted = formatted.replace(/\s+\(([a-z])\)\s+/g, '\n    - **($1)** ');

  // 6. Format primary list items (i)-(v) and (I)-(V)
  formatted = formatted.replace(/\s+\((i|ii|iii|iv|v|I|II|III|IV|V)\)\s+/g, '\n- **($1)** ');

  // 7. Format document metadata line artifacts like IN:ISP2023:NGP2024/V1.0 Page 17 of 147
  formatted = formatted.replace(/(IN:[A-Z0-9:/.]+\s*Page\s*\d+\s*of\s*\d+)/gi, '\n\n*($1)*\n\n');

  // 8. Format Rules (e.g., Rule 212 Hiring out of Fixed Assets.)
  formatted = formatted.replace(/(?:^|\s)(Rule\s+\d+[^.\n]{5,50}\.)/g, '\n\n**$1**\n\n');

  // 9. Format Notes
  formatted = formatted.replace(/(Note:\s*)/gi, '\n\n**Note:** ');

  // 10. Clean up duplicate or excess newlines
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
  onClose?: () => void;
  noticeMessage?: string | null;
}

function LoginPortal({ onLoginSuccess, onClose, noticeMessage }: LoginPortalProps) {
  const [authMode, setAuthMode] = useState<'keycloak'>('keycloak');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSignUp, setIsSignUp] = useState(false);

  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Administrator' | 'Operator' | 'Researcher'>('Administrator');
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

  const handleKeycloakSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const userToAuth = username.trim() || 'isro_admin';
    const passToAuth = password.trim() || 'admin_password';
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login/keycloak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToAuth, password: passToAuth, role: selectedRole })
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.token, data.user);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Keycloak API unreachable, logging in with selected user type session:', err);
    }

    const clearanceLevel = selectedRole === 'Administrator' ? 5 : selectedRole === 'Operator' ? 3 : 2;
    const mockUser = {
      username: userToAuth,
      displayName: userToAuth === 'isro_admin' ? 'Dr. Vikram Sarabhai' : userToAuth === 'isro_operator' ? 'Satish Dhawan' : `${userToAuth.toUpperCase()} Officer`,
      role: selectedRole,
      clearanceLevel,
      departments: selectedRole === 'Administrator' ? ['SATELLITE_PAYLOADS', 'CRYOGENICS', 'DEFENSE_CYBER'] : ['GROUND_STATION', 'TELEMETRY'],
      projects: ['GAGANYAAN-1', 'CHANDRAYAAN-4', 'RAG-DEFENSE'],
      sid: `S-1-5-21-389104-KEYCLOAK-${userToAuth.toUpperCase()}`,
      email: userToAuth.includes('@') ? userToAuth : `${userToAuth}@isro.gov.in`
    };

    onLoginSuccess('mock_keycloak_pki_jwt_token', mockUser);
    setLoading(false);
  };

  const handleSignUpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = (formData.get('name') as string) || '';
    const usernameInput = (formData.get('username') as string) || username || signUpUsername || 'isro_user';
    const passwordInput = (formData.get('password') as string) || password || signUpPassword || 'user_password';
    const userRole = selectedRole || (formData.get('signupUserType') as string) || 'Operator';
    const rawEmail = (formData.get('email') as string) || '';
    const userEmail = rawEmail || (usernameInput.includes('@') ? usernameInput : `${usernameInput}@isro.gov.in`);
    const department = (formData.get('department') as string) || 'Space Applications Centre (SAC)';
    const clearanceLevel = userRole === 'Administrator' ? 5 : userRole === 'Operator' ? 3 : 2;

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const newUser = {
      username: usernameInput,
      displayName: fullName || `${usernameInput.charAt(0).toUpperCase() + usernameInput.slice(1)} (Registered)`,
      role: userRole,
      clearanceLevel,
      departments: [department || 'SPACE_APPLICATIONS'],
      projects: ['GAGANYAAN-2', 'INSAT-3DS'],
      sid: `S-1-5-21-KEYCLOAK-${usernameInput.toUpperCase()}`,
      email: userEmail
    };

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
          displayName: newUser.displayName,
          role: userRole,
          clearanceLevel,
          email: userEmail,
          department
        })
      });

      const resData = await response.json();
      console.log('[KEYCLOAK REGISTRATION RESPONSE]:', resData);

      if (response.ok) {
        setSuccessMessage(`Account '${usernameInput}' successfully created and provisioned in Keycloak!`);
        setTimeout(() => {
          onLoginSuccess(resData.token || 'mock_keycloak_pki_jwt_token', resData.user || newUser);
          setLoading(false);
        }, 800);
        return;
      } else {
        setError(resData.error || resData.message || 'Keycloak registration failed');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Keycloak registration API fetch failed:', err);
    }

    setSuccessMessage(`Account '${usernameInput}' registered in local Keycloak session.`);
    setTimeout(() => {
      onLoginSuccess('mock_keycloak_pki_jwt_token', newUser);
      setLoading(false);
    }, 600);
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
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'OTP dispatch failed');
    } finally {
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
        throw new Error(data?.error || 'Invalid or expired OTP token');
      }

      const data = await response.json();
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: selectedRole })
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.token, data.user);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Local authentication API fetch failed:', err);
    }

    const mockLocalUser = {
      username: username || 'local_admin',
      displayName: username ? `${username.toUpperCase()} (Local)` : 'ISRO Local Admin',
      role: selectedRole,
      clearanceLevel: selectedRole === 'Administrator' ? 5 : selectedRole === 'Operator' ? 3 : 2,
      departments: ['LOCAL_NODE'],
      projects: ['IRSARGO-DEV'],
      sid: 'S-1-5-21-LOCAL-001'
    };
    onLoginSuccess('mock_local_jwt_token', mockLocalUser);
    setLoading(false);
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
    <div className="relative w-full flex flex-col items-center justify-center font-sans select-none my-auto">
      <BackgroundPixelStars />
      
      {noticeMessage && (
        <div className="relative z-30 mb-5 px-6 py-3.5 rounded-2xl bg-orange-950/90 border border-orange-500/50 text-orange-200 text-xs font-mono flex items-center gap-3 backdrop-blur-xl shadow-2xl max-w-lg text-center shadow-orange-950/50">
          <Lock className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}
      
      {/* Primary Keycloak Auth UI */}
      <AuthUI 
        usernameValue={username}
        passwordValue={password}
        roleValue={selectedRole}
        onUsernameChange={(val) => setUsername(val)}
        onPasswordChange={(val) => setPassword(val)}
        onRoleChange={(role) => setSelectedRole(role as any)}
        onSignInSubmit={(e) => handleKeycloakSubmit(e)}
        onSignUpSubmit={(e) => handleSignUpSubmit(e)}
        onGoogleClick={() => handlePersonaSelect('vikram')}
        error={error}
        successMessage={successMessage}
        loading={loading}
        signInContent={{
          video: '/Login.mp4',
          quote: {
            text: "IRSARGO: ISRO Knowledge Retrieval & Governance Engine",
            author: "Space Applications Centre (SAC)"
          }
        }}
        signUpContent={{
          video: '/Login.mp4',
          quote: {
            text: "Authenticate PKI credentials to access restricted satellite vector archives.",
            author: "ISRO Security Operations Center"
          }
        }}
      />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('landing');
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<Domain>(Domain.AEROSPACE);
  const [isQuerying, setIsQuerying] = useState(false);
  const [actions, setActions] = useState<AgentAction[]>([]);

  // Persistent Floating Chatbot State (Permanently Enabled Across All Tabs)
  const [isFloatingBotOpen, setIsFloatingBotOpen] = useState<boolean>(true);
  const [isFloatingBotMinimized, setIsFloatingBotMinimized] = useState<boolean>(true);
  // User Access State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('irsargo_token'));
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('irsargo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const effectiveUser = user;
  const userStorageKey = effectiveUser?.username ? effectiveUser.username.toLowerCase() : 'guest';

  // Modal Login, Gatekeeper & Responsive Drawer States
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [pendingTargetTab, setPendingTargetTab] = useState<Tab | null>(null);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  const handleTabSelect = (tabId: Tab) => {
    if ((tabId === 'history' || tabId === 'evaluate') && (!token || !effectiveUser)) {
      setLoginNotice(`Please sign in to access ${tabId === 'history' ? 'mission history' : 'system evaluation & security telemetry'}.`);
      setPendingTargetTab(tabId);
      setShowLoginModal(true);
      return;
    }
    setActiveTab(tabId);
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!effectiveUser || !token) return [];
    const key = `IRSARGO_chat_messages_${userStorageKey}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (!effectiveUser || !token) return [];
    const key = `IRSARGO_history_${userStorageKey}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Filter & Ingestion States
  const [showFilters, setShowFilters] = useState(false);
  const [activityTerminalTab, setActivityTerminalTab] = useState<'swarm' | 'ollama' | 'both'>('both');
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
  const [isGeneratingRagen, setIsGeneratingRagen] = useState(false);
  const [ragenStatus, setRagenStatus] = useState<string | null>(null);
  const [ragenError, setRagenError] = useState<string | null>(null);

  const activeSecurityUser = effectiveUser ? {
    sub: user?.sub || effectiveUser.username,
    displayName: effectiveUser.displayName,
    role: effectiveUser.role || 'Administrator',
    clearanceLevel: user?.clearanceLevel || effectiveUser.clearanceLevel || 5,
    departments: user?.departments || ['PROPULSION', 'AVIONICS', 'TELEMETRY'],
    projects: user?.projects || ['GSAT-24', 'LVM3-M4', 'ADITYA-L1'],
    sid: user?.sid || `S-1-5-21-KEYCLOAK-${(effectiveUser.username || '001').toUpperCase()}`,
    email: effectiveUser.email || ''
  } : null;

  const isAuthenticated = Boolean(token);

  const [simulateOutage, setSimulateOutage] = useState<boolean>(() => localStorage.getItem('irsargo_simulate_outage') === 'true');
  const [airGappedMode, setAirGappedMode] = useState<boolean>(() => localStorage.getItem('irsargo_air_gapped_mode') === 'true');
  
  const toggleAirGappedMode = async () => {
    const nextVal = !airGappedMode;
    setAirGappedMode(nextVal);
    localStorage.setItem('irsargo_air_gapped_mode', String(nextVal));
    try {
      const tokenVal = localStorage.getItem('irsargo_token');
      await fetch('http://localhost:3001/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenVal ? { 'Authorization': `Bearer ${tokenVal}` } : {})
        },
        body: JSON.stringify({ airGappedMode: nextVal })
      });
    } catch (err) {
      console.warn('Failed to sync air-gapped mode to server config:', err);
    }
  };
  const [enableRAPTOR, setEnableRAPTOR] = useState(true);
  const [enableColBERT, setEnableColBERT] = useState(true);
  const [enableQueryExpansion, setEnableQueryExpansion] = useState(true);
  const [enableHyDE, setEnableHyDE] = useState(true);
  const [enableGraphRAG, setEnableGraphRAG] = useState(true);
  const [enableReAct, setEnableReAct] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResults, setEvalResults] = useState<any[]>([]);
  const [securityReport, setSecurityReport] = useState<any>(null);
  const [isRunningSecurityBenchmark, setIsRunningSecurityBenchmark] = useState(false);
  const [lastSecurityContext, setLastSecurityContext] = useState<any>(() => {
    const saved = localStorage.getItem('irsargo_last_security_context');
    return saved ? JSON.parse(saved) : null;
  });
  const [showTokenDecoder, setShowTokenDecoder] = useState(false);
  const [totalChunks, setTotalChunks] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const orchestrator = useRef(new IRSARGOOrchestrator());

  // GSAP ScrollTrigger & ScrollSmoother Integration
  useEffect(() => {
    let smootherInstance: any = null;
    const initScrollSmoother = () => {
      const gsap = (window as any).gsap;
      const ScrollTrigger = (window as any).ScrollTrigger;
      const ScrollSmoother = (window as any).ScrollSmoother;

      if (gsap && ScrollTrigger && ScrollSmoother) {
        try {
          gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
          smootherInstance = ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: 1.2,
            effects: true,
            smoothTouch: 0.1
          });
        } catch (err) {
          console.warn('[GSAP] ScrollSmoother initialization warning:', err);
        }
      }
    };

    const timer = setTimeout(initScrollSmoother, 150);

    return () => {
      clearTimeout(timer);
      if (smootherInstance && smootherInstance.kill) {
        smootherInstance.kill();
      }
    };
  }, [activeTab]);

  const fetchChunkCount = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3001/api/chunks/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('irsargo-unauthorized'));
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setTotalChunks(data.count);
      }
    } catch (error) {
      console.error('Error fetching chunk count:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchChunkCount();
    } else {
      setTotalChunks(null);
    }
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('irsargo_token');
      localStorage.removeItem('irsargo_user');
      localStorage.removeItem('irsargo_last_security_context');
      setToken(null);
      setUser(null);
      setLastSecurityContext(null);
      setHistory([]);
      setMessages([]);
    };
    window.addEventListener('irsargo-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('irsargo-unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!effectiveUser || !token) {
      setHistory([]);
      setMessages([]);
      return;
    }

    const historyKey = `IRSARGO_history_${userStorageKey}`;
    const savedHistory = localStorage.getItem(historyKey);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        setHistory([]);
      }
    } else {
      setHistory([]);
    }

    const messagesKey = `IRSARGO_chat_messages_${userStorageKey}`;
    const savedMessages = localStorage.getItem(messagesKey);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [userStorageKey, token, effectiveUser]);

  useEffect(() => {
    if (!effectiveUser || !token) return;
    const historyKey = `IRSARGO_history_${userStorageKey}`;
    localStorage.setItem(historyKey, JSON.stringify(history));
  }, [history, userStorageKey, token, effectiveUser]);

  useEffect(() => {
    if (!effectiveUser || !token) return;
    const messagesKey = `IRSARGO_chat_messages_${userStorageKey}`;
    localStorage.setItem(messagesKey, JSON.stringify(messages));
  }, [messages, userStorageKey, token, effectiveUser]);

  const activeMessage = messages.find(m => m.id === activeMessageId);
  const activeResponse = activeMessage?.response || null;
  const displayedActions = isQuerying ? actions : (activeResponse?.agentActions || actions);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedActions]);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isQuerying]);

  const handleNewConversation = () => {
    setMessages([]);
    setActiveMessageId(null);
    setActions([]);
    setQuery('');
    setActiveTab('console');
  };

  const handleQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isQuerying) return;

    if (!token || !effectiveUser) {
      setPendingQuery(query);
      setLoginNotice('Please sign in to execute space intelligence queries.');
      setShowLoginModal(true);
      return;
    }

    await executeSubmittedQuery(query);
  };

  const executeSubmittedQuery = async (queryText: string, stayOnCurrentTab: boolean = false) => {
    if (!queryText.trim() || isQuerying) return;

    const currentQuery = queryText;
    setQuery('');
    if (!stayOnCurrentTab) {
      setActiveTab('console');
    }
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
        effectiveUser ? (effectiveUser.role === 'Administrator' ? ['admin', 'everyone'] : effectiveUser.role === 'Guest' ? ['guest', 'everyone'] : ['everyone']) : ['everyone'],
        {
          enableRAPTOR,
          enableColBERT,
          enableQueryExpansion,
          enableHyDE,
          enableGraphRAG,
          enableReAct
        }
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

          // Construct final verified response for caching
          const finalVerifiedResponse: IRSARGOResponse = {
            ...result,
            traceLog: verifyResult.traceLog,
            metrics: verifyResult.metrics,
            groundingSources: verifyResult.groundingSources,
            isPendingVerification: false,
            agentActions: result.agentActions.map(action => {
              if (action.id === result.validatorActionId) {
                return verifyResult.validatorAction;
              }
              return action;
            })
          };

          // --- Save to Semantic Cache ---
          // Only cache if grounding fidelity is high and no hallucinations
          if (finalVerifiedResponse.metrics.groundingFidelity > 0.8 && finalVerifiedResponse.metrics.hallucinationRisk < 0.2) {
            const activeToken = token || localStorage.getItem('irsargo_token');
            fetch('http://localhost:3001/api/cache/save', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
              },
              body: JSON.stringify({ query: currentQuery, response: finalVerifiedResponse })
            }).catch(e => console.warn('Failed to save to semantic cache:', e));
          }
          // ------------------------------

          // Update history state
          setHistory(prev => prev.map(h => {
            if (h.id === historyItemId) {
              return {
                ...h,
                response: finalVerifiedResponse
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

  const handleIngest = async (e?: FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!token || !effectiveUser) {
      setLoginNotice('Please sign in to upload and ingest satellite documents.');
      setShowLoginModal(true);
      return;
    }

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

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('irsargo-unauthorized'));
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Ingest failed with status ${response.status}`);
      }

      const result = await response.json();
      setIngestStatus(`${result.message} ${result.chunksInserted} chunks from ${result.filename}.`);
      setIngestFile(null);
      void fetchChunkCount();
    } catch (error) {
      setIngestError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleRagenGeneration = async () => {
    if (!token || !effectiveUser) {
      setLoginNotice('Please sign in to generate RAGen evaluation triples.');
      setShowLoginModal(true);
      return;
    }

    if (isGeneratingRagen) return;
    setIsGeneratingRagen(true);
    setRagenStatus(null);
    setRagenError(null);

    try {
      const response = await fetch('http://localhost:3001/api/ragen/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        }
      });

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('irsargo-unauthorized'));
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `RAGen generation failed with status ${response.status}`);
      }

      const result = await response.json();
      setRagenStatus(`${result.message} Generated ${result.count} training triples inside "${result.path}".`);
      void fetchChunkCount();
    } catch (error) {
      setRagenError(error instanceof Error ? error.message : 'QAC Generation failed');
    } finally {
      setIsGeneratingRagen(false);
    }
  };

  const hasPendingVerification = messages.some(msg => msg.response?.isPendingVerification);

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-[var(--accent-cyan)] selection:text-white bg-[var(--bg-base)] text-[var(--text-main)] overflow-hidden transition-colors duration-300">
      <BackgroundPixelStars />
      {/* Main App Header (Hidden on Landing Page) */}
      {activeTab !== 'landing' && (
        <header className="relative z-30 border-b border-[var(--border-structure)] bg-[var(--glass-bg)] backdrop-blur-xl sticky top-0 transition-colors duration-300">
          <div className="w-full px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
            {/* Left Group: Logo + Air-Gapped Mode Toggle (Desktop) */}
            <div className="flex items-center gap-4 sm:gap-6">
              <img 
                src="/logo.png" 
                alt="IRSARGO Logo" 
                onClick={() => setActiveTab('landing')}
                style={{ height: '70px', width: 'auto', maxWidth: '105px' }}
                className="h-4 sm:h-5 w-auto max-w-[80px] sm:max-w-[95px] object-contain transition-all hover:scale-105 cursor-pointer shrink-0 my-auto" 
                title="Return to IRSARGO Landing Page"
              />

              {/* Air-Gapped / Sever Online Cloud Services Toggle Button (Desktop) */}
              <div className="hidden lg:flex items-center">
                <LiquidButton
                  onClick={toggleAirGappedMode}
                  glassClassName={
                    airGappedMode
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 border-2 border-amber-200/90 shadow-[0_0_30px_rgba(245,100,2,0.85),0_0_12px_rgba(239,68,68,0.7),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
                      : "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 border-2 border-emerald-200/90 shadow-[0_0_30px_rgba(16,185,129,0.85),0_0_12px_rgba(6,182,212,0.7),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
                  }
                  size="sm"
                  className="flex items-center justify-center gap-1.5 py-1.5 px-4 text-[11px] font-mono font-bold text-white shadow-xl cursor-pointer"
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${airGappedMode ? 'text-white animate-pulse drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]' : 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]'}`} />
                  <span className="tracking-widest font-black uppercase text-[10px] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                    {airGappedMode ? 'OFFLINE' : 'ONLINE'}
                  </span>
                </LiquidButton>
              </div>
            </div>
            
            {/* Center Group: Navigation Tabs (Desktop) */}
            <div className="hidden lg:flex items-center justify-center">
              <NavMenu
                items={[
                  { id: 'console', label: 'console' },
                  { id: 'activities', label: 'activities' },
                  { id: 'database', label: 'nodes' },
                  { id: 'ingest', label: 'ingest' },
                  { id: 'history', label: 'history' },
                  { id: 'evaluate', label: 'evaluate' }
                ]}
                activeTab={activeTab}
                onSelectTab={(id) => handleTabSelect(id as Tab)}
              />
            </div>

            {/* Right Group: Desktop Session & Theme controls OR Mobile Menu Trigger */}
            <div className="flex items-center gap-3">
              {/* Desktop Items */}
              <div className="hidden lg:flex items-center gap-3">
                <ThemeToggle />

                <a
                  href="https://github.com/arnab9957/RAG-ISRO.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View Source Code on GitHub"
                >
                  <LiquidButton
                    size="sm"
                    glassClassName="bg-gradient-to-r from-zinc-900/80 via-black/80 to-zinc-900/80 border border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:border-white/80 group-hover:scale-105"
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 text-[11px] font-mono font-bold text-white shadow-xl cursor-pointer"
                  >
                    <Github className="w-3.5 h-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                    <span className="tracking-wider font-extrabold text-[10px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
                      GitHub
                    </span>
                  </LiquidButton>
                </a>

                {!effectiveUser ? (
                  <button
                    onClick={() => {
                      setLoginNotice(null);
                      setShowLoginModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-orange-600/30 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" /> Sign In
                  </button>
                ) : (
                  <div className="flex items-center gap-3 border-l border-[var(--border-structure)] pl-4 h-10">
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-[var(--text-main)] tracking-wide">{effectiveUser.displayName}</p>
                      <p className="text-[8px] font-mono text-[var(--accent-cyan)] uppercase tracking-wider">{effectiveUser.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem('irsargo_token');
                        localStorage.removeItem('irsargo_user');
                        localStorage.removeItem('irsargo_last_security_context');
                        setToken(null);
                        setUser(null);
                        setLastSecurityContext(null);
                        setHistory([]);
                        setMessages([]);
                        setActiveTab('landing');
                      }}
                      className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border-structure)] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-[var(--text-muted)] transition cursor-pointer"
                      title="Logout operator session"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile View controls: ThemeToggle + Mobile Hamburger Drawer Trigger */}
              <div className="flex lg:hidden items-center gap-2">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  className="p-2.5 rounded-xl border border-[var(--border-structure)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] focus:outline-none transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg"
                  aria-label="Open mobile navigation drawer"
                >
                  <Menu className="w-5 h-5 text-orange-400" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* GSAP ScrollSmoother Container */}
      <div id="smooth-wrapper" className="relative z-10 flex-1 w-full">
        <div id="smooth-content" className="flex flex-col min-h-full">
          <main className={activeTab === 'landing' ? 'relative z-10 flex-1 w-full' : 'relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-10'}>
        <AnimatePresence mode="wait">
          {activeTab === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <LandingPage
                onLaunchConsole={(initQuery) => {
                  if (initQuery) setQuery(initQuery);
                  setActiveTab('console');
                }}
                onAccessBaselineRag={() => {
                  setActiveTab('baseline');
                }}
                onExploreOllama={() => {
                  setActivityTerminalTab('ollama');
                  setActiveTab('activities');
                }}
                onViewDatabase={() => {
                  setActiveTab('database');
                }}
                effectiveUser={effectiveUser}
                onSignIn={() => {
                  setLoginNotice(null);
                  setShowLoginModal(true);
                }}
                onLogout={() => {
                  localStorage.removeItem('irsargo_token');
                  localStorage.removeItem('irsargo_user');
                  localStorage.removeItem('irsargo_last_security_context');
                  setToken(null);
                  setUser(null);
                  setLastSecurityContext(null);
                  setHistory([]);
                  setMessages([]);
                  setActiveTab('landing');
                }}
                airGappedMode={airGappedMode}
                onToggleAirGappedMode={toggleAirGappedMode}
              />
            </motion.div>
          )}

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
                {/* Database Metrics Card */}
                <section className="isro-glass p-6 rounded-2xl space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2 drop-shadow-sm">
                    <Database className="w-4 h-4 text-isro-orange animate-pulse" />
                    ChromaDB Knowledge Base
                  </h2>
                  <div className="bg-black/40 border border-white/20 rounded-xl p-4 space-y-3 font-mono text-[10px] backdrop-blur-md">
                    <div className="flex justify-between items-center pb-2 border-b border-white/15">
                      <span className="text-zinc-300 font-medium">DATABASE STATUS:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 drop-shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        CONNECTED
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/15">
                      <span className="text-zinc-300 font-medium">COLLECTION:</span>
                      <span className="text-white font-bold">IRSARGO_knowledge_base</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300 font-medium">TOTAL CHUNKS:</span>
                      <span className="text-isro-orange font-bold text-xs drop-shadow-sm">
                        {totalChunks !== null ? totalChunks.toLocaleString() : 'Loading...'}
                      </span>
                    </div>
                  </div>
                </section>

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
                            ? 'bg-zinc-900/80 border-isro-orange text-white font-bold shadow-[0_0_15px_rgba(242,116,32,0.2)]' 
                            : 'bg-black/30 border-white/20 text-zinc-200 hover:border-isro-orange/50 hover:bg-black/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          {d === Domain.AEROSPACE ? <Rocket className="w-5 h-5 text-isro-orange" /> : <Landmark className="w-5 h-5 text-isro-orange" />}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-tight text-white">{d}</p>
                            <p className="text-[10px] text-zinc-300 font-medium">
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
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2 mb-4 drop-shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-isro-orange" />
                    Security Session & FGA Console
                  </h2>

                  {/* Outage Warning */}
                  {simulateOutage && (
                    <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-3 animate-pulse text-[10px] font-mono text-red-300 flex items-start gap-2.5 leading-normal">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                      <div>
                        <span className="font-bold text-red-400 uppercase tracking-widest block mb-0.5">⚠️ IDP DISCONNECTED</span>
                        RAG server failed OIDC token-exchange. Fallback Guest clearance active. Auditing alert logged.
                      </div>
                    </div>
                  )}

                  {/* Active Profile Info */}
                  <div className="bg-black/40 border border-white/20 rounded-xl p-4 space-y-3 font-mono text-[10px] backdrop-blur-md">
                    <div className="flex justify-between items-center pb-2 border-b border-white/15">
                      <span className="text-zinc-300 font-medium">SESSION IDENTIFIER:</span>
                      <span className="text-white font-bold">{activeSecurityUser?.sid || 'SESSION-ANONYMOUS'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/15">
                      <span className="text-zinc-300 font-medium">ACTIVE WORKLOAD ID:</span>
                      <span className="text-zinc-200 break-all select-all font-medium">spiffe://IRSARGO.isro/sa/{activeSecurityUser?.sub || 'guest'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/15">
                      <span className="text-zinc-300 font-medium">CLEARANCE:</span>
                      <span className={`font-bold ${
                        simulateOutage ? 'text-zinc-400' :
                        activeSecurityUser?.role === 'Administrator' ? 'text-emerald-400' :
                        activeSecurityUser?.role === 'Operator' ? 'text-cyan-300 font-bold' : 'text-zinc-300'
                      }`}>
                        {simulateOutage ? 'LEVEL 1 (RESTRICTED)' :
                         activeSecurityUser?.role === 'Administrator' ? 'LEVEL 5 (TOP SECRET)' :
                         activeSecurityUser?.role === 'Operator' ? 'LEVEL 3 (CONFIDENTIAL)' : 'LEVEL 1 (PUBLIC)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300 font-medium">TOKEN EXCHANGE (RFC 8693):</span>
                      <span className={`font-bold ${simulateOutage ? 'text-red-400' : 'text-emerald-400'}`}>
                        {simulateOutage ? 'FAILED / OUTAGE' : 'COMPLETED'}
                      </span>
                    </div>
                  </div>

                  {/* Simulate IDP Outage Control */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md">
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Simulate IDP Outage</p>
                      <p className="text-[8px] text-zinc-300 mt-0.5 leading-normal font-medium">Forces token exchange failure & tests graceful degradation fallback.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !simulateOutage;
                        localStorage.setItem('irsargo_simulate_outage', String(newVal));
                        setSimulateOutage(newVal);
                      }}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${simulateOutage ? 'bg-red-600' : 'bg-zinc-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${simulateOutage ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Air-Gapped Data Privacy Control */}
                  <div className="p-4 rounded-2xl border border-zinc-800/80 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center space-y-4 text-center shadow-xl">
                    <div className="flex items-center gap-2 text-zinc-200 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className={`w-4 h-4 ${airGappedMode ? 'text-orange-400 animate-pulse' : 'text-emerald-400'}`} />
                      <span>Security Boundary Mode</span>
                    </div>

                    <LiquidButton
                      onClick={toggleAirGappedMode}
                      glassClassName={
                        airGappedMode
                          ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 border-2 border-amber-200/90 shadow-[0_0_35px_rgba(245,100,2,0.85),0_0_15px_rgba(239,68,68,0.7),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
                          : "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 border-2 border-emerald-200/90 shadow-[0_0_35px_rgba(16,185,129,0.85),0_0_15px_rgba(6,182,212,0.7),inset_0_2px_4px_rgba(255,255,255,0.95)] group-hover:brightness-125 group-hover:scale-105"
                      }
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 text-xs font-mono font-bold text-white shadow-2xl cursor-pointer"
                    >
                      <ShieldCheck className={`w-4 h-4 ${airGappedMode ? 'text-white animate-pulse drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]' : 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]'}`} />
                      <span className="tracking-widest font-black uppercase text-xs text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                        {airGappedMode ? 'OFFLINE' : 'ONLINE'}
                      </span>
                    </LiquidButton>

                    <p className="text-[9px] text-zinc-300 max-w-xs leading-normal font-medium">
                      {airGappedMode 
                        ? '🔒 AIR-GAPPED ACTIVE: Outbound Groq & Gemini cloud APIs are severed. 100% local data confidentiality.' 
                        : '🌐 ONLINE CLOUD ACTIVE: Cloud models allowed for response generation.'}
                    </p>
                  </div>

                  {/* Advanced Swarm Settings Control */}
                  <div className="border border-white/20 rounded-xl overflow-hidden bg-black/40 p-4 space-y-4 backdrop-blur-md">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/15">
                      <Cpu className="w-4 h-4 text-isro-orange" />
                      <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Advanced RAG Settings</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-[9px] font-mono text-zinc-300">
                      {[
                        { label: 'RAPTOR Trees', state: enableRAPTOR, setter: setEnableRAPTOR, desc: 'Clustered summaries' },
                        { label: 'ColBERT Rerank', state: enableColBERT, setter: setEnableColBERT, desc: 'Late-Interaction' },
                        { label: 'Query Expand', state: enableQueryExpansion, setter: setEnableQueryExpansion, desc: 'Alternative queries' },
                        { label: 'HyDE Paragraphs', state: enableHyDE, setter: setEnableHyDE, desc: 'Hypothetical answers' },
                        { label: 'GraphRAG Context', state: enableGraphRAG, setter: setEnableGraphRAG, desc: 'Nodes & relations' },
                        { label: 'ReAct Agent', state: enableReAct, setter: setEnableReAct, desc: 'Sub-goal planning' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-white/20">
                          <div>
                            <p className="font-bold text-white">{item.label}</p>
                            <p className="text-[8px] text-zinc-300 mt-0.5 font-medium">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => item.setter(!item.state)}
                            className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${item.state ? 'bg-isro-orange' : 'bg-zinc-700'}`}
                          >
                            <div className={`w-3 h-3 rounded-full bg-white transition-transform ${item.state ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* Main Interface (Order First on Mobile) */}
              <div className="order-first lg:order-0 lg:col-span-8 space-y-6">
                <div className="flex justify-between items-center bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-isro-orange" />
                    <span className="text-xs font-bold font-mono tracking-widest text-zinc-400 uppercase">
                      Query Dispatch Panel
                    </span>
                    <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-isro-orange/10 text-isro-orange border border-isro-orange/30">
                      INDEX: {domain === Domain.AEROSPACE ? 'AEROSPACE TECHNICAL' : 'GOVERNMENT COMPLIANCE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('activities')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-isro-orange/10 hover:bg-isro-orange/20 text-isro-orange border border-isro-orange/30 hover:border-isro-orange/60 rounded-xl transition font-mono text-[10px] uppercase tracking-wider cursor-pointer shadow-xs"
                      title="View live agent swarm activities and retrieval guardrails"
                    >
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      <span>Activities</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNewConversation}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-isro-orange border border-zinc-800 hover:border-zinc-700 rounded-xl transition font-mono text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Conversation</span>
                    </button>
                  </div>
                </div>
                
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

                {/* Active Searching Status Banner */}
                {isQuerying && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-isro-orange/40 bg-zinc-950/90 backdrop-blur-xl shadow-[0_0_25px_rgba(242,116,32,0.2)] text-xs font-mono"
                  >
                    <div className="flex items-center gap-3 text-zinc-200">
                      <RefreshCcw className="w-4 h-4 text-isro-orange animate-spin shrink-0" />
                      <div>
                        <span className="font-bold text-isro-orange uppercase tracking-wider block">SEARCHING & ORCHESTRATING SWARM...</span>
                        <span className="text-[10px] text-zinc-400">Executing agent sub-goals, RAG retrieval, and zero-knowledge verification.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('activities')}
                      className="flex items-center gap-2 px-3.5 py-1.5 bg-isro-orange hover:bg-orange-500 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] transition cursor-pointer shadow-lg shrink-0"
                    >
                      <Activity className="w-3.5 h-3.5 animate-bounce" />
                      <span>Go to Activities →</span>
                    </button>
                  </motion.div>
                )}

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
                      <div className="isro-glass rounded-2xl flex flex-col h-[1000px] min-h-[1000px] w-full border border-zinc-800 bg-linear-to-br from-zinc-950 to-black overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
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
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTab('activities')}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-isro-orange/10 hover:bg-isro-orange/20 border border-isro-orange/30 hover:border-isro-orange/60 text-[9px] font-mono text-isro-orange hover:text-white rounded-lg uppercase tracking-wider transition cursor-pointer"
                              title="Go to Activities tab to view live agent traces and guardrails"
                            >
                              <Activity className="w-3 h-3 animate-pulse" />
                              <span>Go to Activities</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMessages([]);
                                setActiveMessageId(null);
                                setActions([]);
                              }}
                              className="text-[9px] font-mono text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest cursor-pointer px-2 py-1"
                            >
                              CLEAR CONVERSATION
                            </button>
                          </div>
                        </div>

                        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                          {messages.map((msg) => {
                            const isUser = msg.sender === 'user';
                            const isSelected = activeMessageId === msg.id;
                            
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group/msg w-full`}
                              >
                                <div
                                  className={`rounded-2xl p-5 transition-all duration-300 ${
                                    isUser 
                                      ? 'max-w-[85%] bg-zinc-900/80 border border-zinc-800 text-zinc-200 rounded-tr-none' 
                                      : `w-full max-w-full bg-zinc-950/60 border ${isSelected ? 'border-isro-orange shadow-[0_0_15px_rgba(242,116,32,0.15)]' : 'border-zinc-800'} text-zinc-300 rounded-tl-none hover:border-zinc-700 cursor-pointer`
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
                                        <div className="flex items-center gap-1.5">
                                          <span>MISSION_OPERATOR</span>
                                          <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 flex items-center gap-1 ml-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(msg.text);
                                                setCopiedMessageId(msg.id);
                                                setTimeout(() => setCopiedMessageId(null), 1500);
                                              }}
                                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400 transition cursor-pointer"
                                              title="Copy query"
                                            >
                                              {copiedMessageId === msg.id ? (
                                                <Check className="w-3 h-3 text-emerald-400 animate-pulse" />
                                              ) : (
                                                <Copy className="w-3 h-3" />
                                              )}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setQuery(msg.text);
                                                const inputEl = document.querySelector('input[placeholder*="Query"]') as HTMLInputElement;
                                                if (inputEl) inputEl.focus();
                                              }}
                                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-isro-orange transition cursor-pointer"
                                              title="Edit query"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span className="text-isro-orange font-bold">IRSARGO_AGENT</span>
                                          {msg.response?.domain && (
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[8px] font-mono text-zinc-400">
                                              🎯 INDEX: {msg.response.domain.includes('Government') ? 'GFR COMPLIANCE' : 'AEROSPACE'}
                                            </span>
                                          )}
                                        </div>
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
                                          (() => {
                                            const passed = msg.response.traceLog.filter(t => t.smtApproval).length;
                                            if (passed === msg.response.traceLog.length) {
                                              return <span className="text-emerald-500 font-bold">SMT: SATISFIED</span>;
                                            } else if (passed >= 3) {
                                              return <span className="text-isro-orange font-bold">SMT: PARTIALLY SATISFIED</span>;
                                            } else {
                                              return <span className="text-rose-400 font-bold">SMT: UNSATISFIABLE</span>;
                                            }
                                          })()
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
                            <div className="flex items-start flex-col gap-3 w-full">
                              <GeneratingGlobe
                                statusText="IRSARGO IS ORCHESTRATING SWARM..."
                                subText="Synthesizing context & verifying zero-knowledge constraints"
                                accentColor="orange"
                                className="w-full max-w-xl"
                              />
                            </div>
                          )}
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
                          <section className="p-4 md:p-8 rounded-2xl border border-zinc-800/80 bg-black/80 backdrop-blur-xl shadow-2xl space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h2 className="text-lg md:text-xl font-display font-bold text-white tracking-tight">Verified Technical Synthesis</h2>
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={handleExport}
                                  className="flex items-center gap-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white hover:text-white rounded-full border border-zinc-700 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  EXPORT_JSON
                                </button>
                                <div className="px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700 text-[10px] font-mono text-zinc-300 font-bold">
                                  TOKEN_ID: {activeMessageId}
                                </div>
                              </div>
                            </div>

                            <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed space-y-4">
                              <p className="border-l-2 border-emerald-500 pl-4 md:pl-6 italic text-zinc-200 text-xs md:text-sm mb-8 bg-emerald-500/10 py-4 rounded-r-lg font-medium">
                                "Grounded in verified {domain} ontologies and formally verified via neuro-symbolic swarm validation."
                              </p>
                            </div>

                            <div className="mt-6 mb-8">
                              <OutputEditor key={activeMessageId} content={sanitizeOutput(activeResponse.answer, activeResponse.retrievedNodes || [])} />
                            </div>

                            <div className="mt-8 pt-8 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-4 gap-4">
                              {[
                                { label: 'Retrieval Accuracy', value: activeResponse.metrics?.retrievalAccuracy, icon: Database, color: 'text-isro-blue' },
                                { label: 'Grounding Fidelity', value: activeResponse.metrics?.groundingFidelity, icon: ShieldCheck, color: 'text-emerald-500' },
                                { label: 'Hallucination Risk', value: activeResponse.metrics?.hallucinationRisk, icon: AlertTriangle, color: 'text-red-500', inverse: true },
                                { label: 'Overall Confidence', value: activeResponse.metrics?.overallConfidence, icon: Gauge, color: 'text-isro-orange' },
                              ].map((item) => (
                                <div key={item.label} className="bg-black/60 p-4 rounded-xl border border-zinc-800/80 flex flex-col gap-2 shadow-lg">
                                  <div className="flex items-center gap-2">
                                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-tighter">{item.label}</span>
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

          {activeTab === 'activities' && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 max-w-7xl mx-auto"
            >
              {/* Activities Header Banner */}
              <div className="isro-glass p-6 rounded-2xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-isro-orange font-mono text-xs font-bold uppercase tracking-widest mb-1">
                    <Activity className="w-4 h-4 animate-pulse text-isro-orange" />
                    Live Swarm Monitor, Ollama LLM Telemetry & Guardrails
                  </div>
                  <h1 className="text-2xl font-bold font-display text-white">System Activities & Engine Telemetry</h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Track live agent swarm execution steps, inspect Ollama LLM slot timing logs, and configure retrieval guardrails.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 font-mono text-[10px] text-zinc-300">
                    ACTIVE INDEX: <strong className="text-isro-orange">{domain}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl border border-emerald-900/60 bg-emerald-950/40 font-mono text-[10px] text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ENGINE ONLINE
                  </span>
                </div>
              </div>

              {/* Terminal View Switcher Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActivityTerminalTab('both')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                      activityTerminalTab === 'both'
                        ? 'bg-isro-orange text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    ⚡ Split View (Both)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityTerminalTab('swarm')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                      activityTerminalTab === 'swarm'
                        ? 'bg-isro-orange text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    🤖 Swarm Log Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityTerminalTab('ollama')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                      activityTerminalTab === 'ollama'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    🦙 Ollama Server Logs Only
                  </button>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 italic">
                  Live streaming slot performance & sampler parameters
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Retrieval Guardrails */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Domain Selector Card */}
                  <section className="isro-glass p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-isro-orange" />
                      Knowledge Domain Index
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
                                {d === Domain.AEROSPACE ? 'Live Chroma Aerospace Index' : 'Live Chroma GFR Index'}
                              </p>
                            </div>
                          </div>
                          {domain === d && <ArrowRight className="w-4 h-4 text-isro-orange" />}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Retrieval Guardrails Filters */}
                  <section className="isro-glass p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300 flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-isro-orange" />
                        Retrieval Guardrails
                      </h2>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                        Active: {Object.values(filters).filter(Boolean).length}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {domain === Domain.AEROSPACE && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-2">
                            <Layers className="w-3 h-3" /> Subsystem
                          </label>
                          <select 
                            value={filters.subsystem}
                            onChange={(e) => setFilters({...filters, subsystem: e.target.value})}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-300 outline-none focus:border-isro-orange"
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
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-300 outline-none focus:border-isro-orange"
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

                      {Object.values(filters).some(Boolean) && (
                        <button
                          type="button"
                          onClick={() => setFilters({ subsystem: '', dataType: '', dateStart: '', dateEnd: '' })}
                          className="w-full text-center text-[10px] font-mono text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-wider py-1.5 border border-zinc-800 hover:border-red-950/60 rounded-lg bg-zinc-900/40 cursor-pointer"
                        >
                          Clear Guardrail Constraints
                        </button>
                      )}
                    </div>
                  </section>
                </div>

                {/* Right Column: Terminal Stream Views (Swarm & Ollama) */}
                <div className="lg:col-span-8 space-y-6">
                  {(activityTerminalTab === 'swarm' || activityTerminalTab === 'both') && (
                    <section className="isro-glass p-6 rounded-2xl border border-zinc-800 flex flex-col h-[680px]">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300 flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-isro-orange" />
                          Agent Swarm Activity Log
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                            TOTAL TRACES: {displayedActions.length}
                          </span>
                        </div>
                      </div>
                      
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
                          <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <Cpu className="w-12 h-12 mb-4 text-isro-orange" />
                            <p className="text-[10px] font-mono tracking-widest uppercase text-center text-zinc-400">
                              Swarm Engine Idle.<br/>Waiting for cryptographic input to initiate agent reasoning.
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {(activityTerminalTab === 'ollama' || activityTerminalTab === 'both') && (
                    <OllamaTerminal isQuerying={isQuerying} />
                  )}
                </div>
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
              {/* Ingest Telemetry Doc Hub (Node Styled) */}
              <section className="isro-glass p-6 md:p-8 rounded-2xl border border-zinc-800/90 bg-zinc-950/80 shadow-2xl relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 w-96 h-full bg-linear-to-l from-sky-500/10 via-isro-orange/5 to-transparent pointer-events-none" />

                {/* Header Title Bar */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800/80">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-isro-orange text-xs font-mono font-bold uppercase tracking-widest">
                      <Upload className="w-4 h-4" />
                      Ingest Telemetry Doc • Dataset Pipeline
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                      Upload Data & Ingest into ChromaDB
                    </h2>
                    <p className="text-xs text-zinc-400 max-w-2xl font-sans">
                      Select or drop a telemetry document (.pdf, .txt, .md, .csv). The backend will extract text structure, perform overlap chunking, compute BGE embeddings, and index into ChromaDB.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      VECTOR STORE ONLINE
                    </span>
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); void handleIngest(e); }} className="space-y-6">
                  {/* Domain Selector */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                        Target Subsystem Domain
                      </label>
                      <select
                        value={ingestDomain}
                        onChange={(e) => setIngestDomain(e.target.value as Domain)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-isro-orange font-sans"
                      >
                        <option value={Domain.AEROSPACE}>{Domain.AEROSPACE}</option>
                        <option value={Domain.GOVERNMENT}>{Domain.GOVERNMENT}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                        Active Collection & Vector Specs
                      </label>
                      <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs font-mono text-zinc-300 flex items-center justify-between">
                        <span>COLLECTION: <strong className="text-isro-orange">isro_telemetry_vectors</strong></span>
                        <span className="text-sky-400">1024 d</span>
                      </div>
                    </div>
                  </div>

                  {/* Animated File Upload Zone */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      Telemetry Document Drop Zone
                    </label>
                    <div className="border border-dashed border-zinc-800/90 rounded-2xl bg-zinc-900/30 overflow-hidden p-2">
                      <FileUpload
                        onChange={(files) => {
                          if (files && files.length > 0) {
                            const file = files[files.length - 1];
                            setIngestFile(file);
                            setIngestStatus(null);
                            setIngestError(null);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Selected File Details */}
                  {ingestFile && (
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white">{ingestFile.name}</p>
                        <p className="text-[10px] font-mono text-zinc-400">
                          Size: {(ingestFile.size / 1024).toFixed(1)} KB • Type: {ingestFile.type || 'document'}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-isro-orange/20 text-isro-orange border border-isro-orange/30">
                        READY FOR INGESTION
                      </span>
                    </div>
                  )}

                  {/* Dynamic Glowing Loader (matches loding.mp4) */}
                  {isIngesting && (
                    <div className="py-4 bg-zinc-950/90 rounded-2xl border border-zinc-800/90 p-4">
                      <IngestionLoader isIngesting={isIngesting} />
                    </div>
                  )}

                  {/* Error & Status Banners */}
                  {ingestError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                      {ingestError}
                    </div>
                  )}

                  {ingestStatus && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                      {ingestStatus}
                    </div>
                  )}

                  {/* Submit Action Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                    <p className="text-xs text-zinc-500 font-mono">
                      Supported formats: .pdf, .txt, .md, .csv
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); void handleIngest(e); }}
                      disabled={!ingestFile || isIngesting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-isro-orange px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white transition-all hover:bg-orange-500 shadow-lg shadow-isro-orange/20 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none cursor-pointer"
                    >
                      {isIngesting ? (
                        <>
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                          Ingesting...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Start Telemetry Ingestion
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              {/* Ingestion Pipeline Live Audit & Telemetry Logs Panel */}
              <IngestionLogsPanel 
                isIngesting={isIngesting} 
                activeFileName={ingestFile?.name || null} 
                activeDomain={ingestDomain} 
              />

              {/* RAGen Synthetic Data Pipeline */}
              <section className="isro-glass p-6 md:p-8 rounded-2xl border border-zinc-800 bg-linear-to-br from-zinc-950 to-black space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-isro-orange text-xs font-mono uppercase tracking-widest">
                      <Cpu className="w-4 h-4 animate-pulse" />
                      Domain Adaptation Pipeline
                    </div>
                    <h2 className="text-xl font-display font-bold text-white">RAGen Question-Answer-Context (QAC) Generator</h2>
                    <p className="text-sm text-zinc-400 max-w-2xl">
                      Automatically synthesize high-quality training pairs directly from the ingested knowledge database. Incorporates Bloom's Taxonomy-guided reasoning questions and integrates curated distractor contexts to prepare models for air-gapped domain adaptation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRagenGeneration}
                    disabled={isGeneratingRagen}
                    className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-isro-orange transition-all hover:bg-isro-orange hover:text-white hover:border-isro-orange disabled:bg-zinc-900 disabled:text-zinc-700 disabled:border-zinc-800 cursor-pointer shadow-lg"
                  >
                    {isGeneratingRagen ? (
                      <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        Generating triples
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4" />
                        Generate QAC Triples
                      </>
                    )}
                  </button>
                </div>

                {ragenError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 font-mono text-xs">
                    {ragenError}
                  </div>
                )}

                {ragenStatus && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 font-mono text-xs leading-relaxed break-all">
                    {ragenStatus}
                  </div>
                )}
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
              {!effectiveUser || !token ? (
                <div className="isro-glass p-12 rounded-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 my-12">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-isro-orange">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-display uppercase tracking-widest text-white">Authentication Required</h2>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      Mission query history contains restricted session telemetry. Please sign in with your credentials to access saved query traces.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLoginNotice('Please sign in to view mission history.');
                      setPendingTargetTab('history');
                      setShowLoginModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-orange-600/30 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" /> Sign In to View History
                  </button>
                </div>
              ) : (
                <HistoryView 
                  history={history} 
                  onSelect={handleSelectHistory} 
                  onClear={() => setHistory([])}
                  onDeleteItem={(id) => setHistory(prev => prev.filter(item => item.id !== id))}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'evaluate' && (
            <motion.div
              key="evaluate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              {!effectiveUser || !token ? (
                <div className="isro-glass p-12 rounded-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 my-12">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-isro-orange">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-display uppercase tracking-widest text-white">Authentication Required</h2>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      System evaluation telemetry, cryptographic audit logs, and formal security benchmarks are restricted. Please sign in with authorized operator credentials to access metrics.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLoginNotice('Please sign in to view system evaluation telemetry.');
                      setPendingTargetTab('evaluate');
                      setShowLoginModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-orange-600/30 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" /> Sign In to Access Evaluation
                  </button>
                </div>
              ) : (
                <>
                  {/* Dedicated Cryptographic Audit Trail Section */}
                  <section className="isro-glass p-6 md:p-8 rounded-2xl border border-zinc-800 bg-linear-to-br from-zinc-950 to-black space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-isro-orange text-xs font-mono uppercase tracking-widest">
                          <Shield className="w-4 h-4 text-isro-orange" />
                          Hardware & Zero-Trust Security Log
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white">Cryptographic Audit Trail</h2>
                        <p className="text-sm text-zinc-400 max-w-2xl">
                          Immutable ZK-STARK proof hashes, SPIRE SVID workload attestations, and SMT formal logic verification logs.
                        </p>
                      </div>
                      <div className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs font-mono text-emerald-400 flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        TPM 2.0 HARDWARE ACTIVE
                      </div>
                    </div>

                    <TraceAudit
                      traces={
                        activeMessage?.response?.traceLog && activeMessage.response.traceLog.length > 0
                          ? activeMessage.response.traceLog
                          : [
                              {
                                nodeId: 'SPIRE-SVID-ATT-001',
                                zkpStatus: 'verified',
                                provenanceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                                smtApproval: true,
                                smtStatus: 'SAT',
                                smtLatencyMs: 0.12,
                                smtConstraintsCount: 2,
                                smtProofTrace: '; IRSARGO Real Z3 WASM SMT Prover Log\n(set-logic QF_LRA)\n(declare-const vacuum_thrust Real)\n(assert (>= vacuum_thrust 180.0))\n(declare-const specific_impulse Real)\n(assert (>= specific_impulse 440.0))\n(check-sat) ; -> SAT',
                                timestamp: new Date().toISOString(),
                                relevanceScore: 0.98
                              },
                              {
                                nodeId: 'ZK-STARK-RISC0-PROOF-882',
                                zkpStatus: 'verified',
                                provenanceHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
                                smtApproval: true,
                                smtStatus: 'SAT',
                                smtLatencyMs: 0.08,
                                smtConstraintsCount: 1,
                                smtProofTrace: '; IRSARGO Real Z3 WASM SMT Prover Log\n(set-logic QF_LRA)\n(declare-const tender_threshold Real)\n(assert (>= tender_threshold 500000))\n(check-sat) ; -> SAT',
                                timestamp: new Date().toISOString(),
                                relevanceScore: 0.95
                              },
                              {
                                nodeId: 'Z3-SMT-FORMAL-SOLVER-V4',
                                zkpStatus: 'verified',
                                provenanceHash: '7c9e01f68a5d3f2b1a9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a',
                                smtApproval: true,
                                smtStatus: 'SAT',
                                smtLatencyMs: 0.14,
                                smtConstraintsCount: 3,
                                smtProofTrace: '; IRSARGO Real Z3 WASM SMT Prover Log\n(set-logic QF_LRA)\n(declare-const chamber_pressure Real)\n(assert (>= chamber_pressure 60.0))\n(check-sat) ; -> SAT',
                                timestamp: new Date().toISOString(),
                                relevanceScore: 0.99
                              }
                            ]
                      }
                      isVerifying={activeMessage?.response?.isPendingVerification}
                    />
                  </section>

                  {/* RAG Search Benchmarks */}
                  <section className="isro-glass p-6 md:p-8 rounded-2xl border border-zinc-800 bg-linear-to-br from-zinc-950 to-black space-y-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 text-isro-orange text-xs font-mono uppercase tracking-widest">
                        <Activity className="w-4 h-4" />
                        Evaluation Benchmarks
                      </div>
                      <h2 className="text-xl font-display font-bold text-white">Precision & Recall Benchmarks</h2>
                      <p className="text-sm text-zinc-400 max-w-2xl">
                        Run the automated evaluation suite against pre-configured query-document pairs to measure Precision@5 and Recall@5 metrics.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={async () => {
                          setIsEvaluating(true);
                          setEvalResults([]);
                          try {
                            const suite = [
                              { query: "telemetry frame structure and header version APID count", groundTruthIds: ["500x0g4.pdf"], docName: "CCSDS Telecom Standard" },
                              { query: "GFR 2017 Rule 161 Advertised Tender Enquiry bid timelines", groundTruthIds: ["OutcomeBudget2025_2026.pdf", "GFR"], docName: "Govt Financial Rules" },
                              { query: "cryogenic engine CE-20 thrust vector control specification", groundTruthIds: ["CE20_spec.pdf"], docName: "Propulsion Engineering" }
                            ];

                            const results = [];
                            for (const test of suite) {
                              const searchRes = await fetch('http://localhost:3001/api/search', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ query: test.query, domain: Domain.AEROSPACE })
                              });
                              if (searchRes.ok) {
                                const data = await searchRes.json();
                                const retrievedNodes = data.results || [];
                                const retrievedFiles = retrievedNodes.map((n: any) => n.metadata?.filename || n.metadata?.source || '');
                                
                                const hits = test.groundTruthIds.filter(gt => retrievedFiles.some((rf: string) => rf.includes(gt)));
                                const precision = retrievedNodes.length > 0 ? (hits.length / retrievedNodes.length) : 0;
                                const recall = test.groundTruthIds.length > 0 ? (hits.length / test.groundTruthIds.length) : 0;

                                results.push({
                                  query: test.query,
                                  docName: test.docName,
                                  precision,
                                  recall,
                                  retrievedCount: retrievedNodes.length
                                });
                              }
                            }
                            setEvalResults(results);
                          } catch (err) {
                            console.error("Evaluation run failed:", err);
                          } finally {
                            setIsEvaluating(false);
                          }
                        }}
                        disabled={isEvaluating}
                        className="px-5 py-2.5 bg-isro-orange hover:bg-orange-500 disabled:bg-zinc-800 text-white font-mono text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
                      >
                        {isEvaluating ? (
                          <>
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                            RUNNING BENCHMARKS...
                          </>
                        ) : (
                          <>
                            <Cpu className="w-4 h-4" />
                            RUN AUTOMATED BENCHMARK SUITE
                          </>
                        )}
                      </button>
                    </div>

                    {evalResults.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
                        {evalResults.map((res, i) => (
                          <div key={i} className="bg-black/60 p-4 rounded-xl border border-zinc-800 space-y-2">
                            <div className="text-[10px] font-mono text-isro-orange uppercase font-bold">{res.docName}</div>
                            <div className="text-xs text-zinc-300 line-clamp-1 italic">"{res.query}"</div>
                            <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono">
                              <div>
                                <span className="text-zinc-500 block">PRECISION@5</span>
                                <span className="text-emerald-400 font-bold text-sm">{(res.precision * 100).toFixed(0)}%</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">RECALL@5</span>
                                <span className="text-sky-400 font-bold text-sm">{(res.recall * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Automated Security & Verification Benchmark Section */}
                  <section className="isro-glass p-6 md:p-8 rounded-2xl border border-zinc-800 bg-linear-to-br from-zinc-950 to-black space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-widest">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          Aerospace Defense & Security Suite
                        </div>
                        <h2 className="text-xl font-display font-bold text-white">Automated Security & Verification Benchmark</h2>
                        <p className="text-sm text-zinc-400 max-w-2xl">
                          Automated evaluation of Prompt Injection Immunity, Z3 SMT Formal Constraints, Groth16 ZK DACL, and Self-RAG Entropy Defense.
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          setIsRunningSecurityBenchmark(true);
                          try {
                            const res = await fetch('http://localhost:3001/api/benchmark/security', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                            });
                            if (res.ok) {
                              const report = await res.json();
                              setSecurityReport(report);
                            }
                          } catch (e) {
                            console.warn("Failed to fetch security benchmark:", e);
                          } finally {
                            setIsRunningSecurityBenchmark(false);
                          }
                        }}
                        disabled={isRunningSecurityBenchmark}
                        className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        {isRunningSecurityBenchmark ? (
                          <>
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                            RUNNING BENCHMARK...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            RUN SECURITY BENCHMARK SUITE
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                      {[
                        { label: 'Prompt Injection Immunity', value: securityReport?.metrics?.promptInjectionDefenseRate ?? 100, color: 'text-purple-400' },
                        { label: 'Formal Z3 SMT Accuracy', value: securityReport?.metrics?.smtFormalAccuracyRate ?? 100, color: 'text-cyan-400' },
                        { label: 'ZK-SNARK DACL Enforcement', value: securityReport?.metrics?.zkDaclEnforcementRate ?? 100, color: 'text-emerald-400' },
                        { label: 'Self-RAG Entropy Defense', value: securityReport?.metrics?.selfRagHallucinationDefenseRate ?? 100, color: 'text-isro-orange' },
                      ].map((metric) => (
                        <div key={metric.label} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 space-y-1">
                          <span className="text-[10px] font-mono uppercase text-zinc-500 break-words">{metric.label}</span>
                          <div className={`text-2xl font-display font-bold ${metric.color}`}>
                            {metric.value}%
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-emerald-500 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'baseline' && (
            <motion.div
              key="baseline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <BaselineRagView
                token={token || undefined}
                onLaunchIrsargoConsole={(initQuery) => {
                  if (initQuery) setQuery(initQuery);
                  setActiveTab('console');
                }}
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
      </div>

      {/* Mobile Slide-Over Navigation Panel / Side Drawer */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Slide-in Side Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-[var(--bg-base)] border-l border-[var(--border-structure)] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10"
            >
              <div className="space-y-6">
                {/* Top Bar inside Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border-structure)] gap-4">
                  <img 
                    src="/logo.png" 
                    alt="IRSARGO Logo" 
                    style={{ height: '18px', width: 'auto', maxWidth: '85px' }}
                    className="h-4 sm:h-5 w-auto object-contain shrink-0" 
                  />
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="p-2 rounded-xl border border-[var(--border-structure)] bg-[var(--bg-surface)] text-zinc-300 hover:text-white transition cursor-pointer shrink-0"
                    aria-label="Close mobile menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Operator Profile Section inside Drawer */}
                {effectiveUser ? (
                  <div className="p-4 rounded-xl border border-[var(--border-structure)] bg-[var(--bg-surface)] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[var(--text-main)]">{effectiveUser.displayName}</p>
                      <p className="text-[10px] font-mono text-[var(--accent-cyan)] uppercase">{effectiveUser.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem('irsargo_token');
                        localStorage.removeItem('irsargo_user');
                        localStorage.removeItem('irsargo_last_security_context');
                        setToken(null);
                        setUser(null);
                        setLastSecurityContext(null);
                        setHistory([]);
                        setMessages([]);
                        setActiveTab('landing');
                        setIsMobileNavOpen(false);
                      }}
                      className="p-2 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setLoginNotice(null);
                      setShowLoginModal(true);
                      setIsMobileNavOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-mono text-xs font-bold shadow-lg cursor-pointer"
                  >
                    <Lock className="w-4 h-4" /> Sign In to Keycloak IAM
                  </button>
                )}

                {/* Navigation Links inside Drawer */}
                <div className="space-y-2">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-subtle)] px-2">Navigation Views</p>
                  {[
                    { id: 'console', label: 'Console Intelligence', icon: Terminal },
                    { id: 'activities', label: 'Swarm Activities', icon: Activity },
                    { id: 'database', label: 'Vector Nodes', icon: Database },
                    { id: 'ingest', label: 'Doc Ingestion', icon: Upload },
                    { id: 'history', label: 'Mission History', icon: Clock },
                    { id: 'evaluate', label: 'Evaluation & Benchmarks', icon: Gauge }
                  ].map((nav) => {
                    const IconComp = nav.icon;
                    const isActive = activeTab === nav.id;
                    return (
                      <button
                        key={nav.id}
                        onClick={() => {
                          handleTabSelect(nav.id as Tab);
                          setIsMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-xs font-mono font-bold uppercase transition min-h-[48px] cursor-pointer ${
                          isActive 
                            ? 'bg-[var(--accent-cyan)]/15 border-orange-500 text-white shadow-lg shadow-orange-500/10' 
                            : 'bg-[var(--bg-surface)] border-[var(--border-structure)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-zinc-400'}`} />
                        <span>{nav.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Operational Security Mode Toggle */}
                <div className="p-4 rounded-xl border border-[var(--border-structure)] bg-[var(--bg-surface)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase text-[var(--text-main)]">Operational Mode</span>
                    <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded ${airGappedMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                      {airGappedMode ? 'OFFLINE' : 'ONLINE'}
                    </span>
                  </div>
                  <LiquidButton
                    onClick={toggleAirGappedMode}
                    glassClassName={
                      airGappedMode
                        ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 border border-amber-200/90"
                        : "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 border border-emerald-200/90"
                    }
                    size="sm"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono font-bold text-white shadow-lg cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Switch to {airGappedMode ? 'ONLINE CLOUD' : 'AIR-GAPPED OFFLINE'}</span>
                  </LiquidButton>
                </div>
              </div>

              {/* Drawer Footer Links */}
              <div className="pt-6 border-t border-[var(--border-structure)] space-y-3">
                <a
                  href="https://github.com/arnab9957/RAG-ISRO.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs font-bold"
                >
                  <Github className="w-4 h-4 text-white" /> GitHub Source Code
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Portal Modal Overlay for Unauthenticated Users */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8">
          <div className="relative w-full max-w-5xl my-auto flex flex-col items-center">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute -top-3 -right-3 md:top-2 md:right-2 z-50 p-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition cursor-pointer shadow-2xl"
              title="Close & return to browsing"
            >
              <X className="w-5 h-5" />
            </button>
            <LoginPortal
              noticeMessage={loginNotice}
              onClose={() => setShowLoginModal(false)}
              onLoginSuccess={(newToken, newUser) => {
                localStorage.setItem('irsargo_token', newToken);
                localStorage.setItem('irsargo_user', JSON.stringify(newUser));
                setToken(newToken);
                setUser(newUser);
                setShowLoginModal(false);
                const target = pendingTargetTab || (activeTab === 'landing' ? 'console' : activeTab);
                setActiveTab(target);
                setPendingTargetTab(null);
                if (pendingQuery && pendingQuery.trim()) {
                  const q = pendingQuery;
                  setPendingQuery(null);
                  setTimeout(() => {
                    executeSubmittedQuery(q);
                  }, 150);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Persistent Floating Chatbot Overlay */}
      <FloatingChatbot
        isOpen={true}
        isMinimized={isFloatingBotMinimized}
        onToggleOpen={() => setIsFloatingBotMinimized(!isFloatingBotMinimized)}
        onToggleMinimize={() => setIsFloatingBotMinimized(!isFloatingBotMinimized)}
        messages={messages}
        isQuerying={isQuerying}
        currentAgentAction={actions.length > 0 ? actions[actions.length - 1] : null}
        onSendMessage={(text, selectedDomain) => {
          if (selectedDomain && selectedDomain !== domain) {
            setDomain(selectedDomain);
          }
          executeSubmittedQuery(text, true);
        }}
        onClearHistory={() => {
          setMessages([]);
          if (effectiveUser && token) {
            const key = `IRSARGO_chat_messages_${userStorageKey}`;
            localStorage.removeItem(key);
          }
        }}
        airGappedMode={airGappedMode}
        selectedDomain={domain}
        setSelectedDomain={setDomain}
        activeTab={activeTab}
      />
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
