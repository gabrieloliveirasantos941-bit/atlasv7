import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
    Mic, 
    MicOff, 
    Camera, 
    CameraOff, 
    Monitor, 
    MonitorOff, 
    Plus,
    X,
    Menu,
    Archive
} from 'lucide-react';
import { createLiveSession, sendTextMessage, summarizeText, summarizeConversation, LiveSessionController } from './services/geminiService';
import { extractYouTubeVideoId, checkYouTubeVideoAvailability } from './services/youtubeUtils';
import { CustomTheme, applyCustomTheme } from './services/themeService';
import { saveToMemory, searchMemory, saveImportantMemory } from './services/memoryService';
import AdminDashboard from './components/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import VisualHelpModal from './components/VisualHelpModal';
import ConfirmationModal from './components/ConfirmationModal';
import NotificationsModal from './components/NotificationsModal';
import AgentsModal from './components/AgentsModal';
import { SpecialistSidebar } from './src/components/SpecialistSidebar';
import ArchivedConversationsModal from './components/ArchivedConversationsModal';
import SettingsModal from './components/SettingsModal';
import FocoFlowDashboard from './src/components/FocoFlowDashboard';
import { SYSTEM_AGENTS } from './constants';
import { ConversationMessage, Conversation, UserProfile, CustomAgent, SystemNotification } from './types';
import { auth, signOut, db, doc, updateDoc, setDoc, increment, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, getDocs, limit, handleFirestoreError, OperationType } from './firebase';
import ImmersiveHUD from './src/components/ImmersiveHUD';
import { Sidebar } from './src/components/dashboard/Sidebar';
import YouTubePiP from './src/components/YouTubePiP';
import BrowserPiP from './src/components/BrowserPiP';
import { AgentTransition } from './src/components/AgentTransition';
import { Toaster, toast } from 'sonner';
import { addTask, addTransaction, addNote, addReminder } from './src/services/focoFlowService';

// ... (inside the App component or at the top level)

import type { User } from 'firebase/auth';

// Cost Constants & Token Estimations
// Pricing for gemini-2.5-flash in USD per 1M tokens (for text)
const GEMINI_FLASH_INPUT_COST_PER_MILLION_TOKENS = 0.35;
const GEMINI_FLASH_OUTPUT_COST_PER_MILLION_TOKENS = 0.70;

// Helper to generate the favicon SVG data URL with a status indicator.
const createFavicon = (isMicActive: boolean): string => {
  const GLogo = `<text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='70' font-weight='bold' fill='white' font-family='sans-serif'>G</text>`;

  // Red dot for microphone in the top-right corner
  const micDot = isMicActive
    ? `<circle cx='80' cy='20' r='12' fill='#22c55e' stroke='white' strokeWidth='2'/>`
    : '';

  const svgContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='0' fill='#4A5568'/%3E${GLogo}${micDot}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
};

// Helper function to play a short beep sound for feedback.
const playBeep = (context: AudioContext | null, frequency = 440, duration = 100) => {
  if (!context || context.state === 'closed') return;
  if (context.state === 'suspended') {
    context.resume();
  }
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'sine'; // A simple, clean tone
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  
  // Fade out to avoid clicking sound
  gainNode.gain.setValueAtTime(0.3, context.currentTime); // Start at a reasonable volume
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration / 1000);
};

// NEW: Helper function to play a futuristic startup sound (Jarvis style).
const playStartupSound = (context: AudioContext | null) => {
    if (!context || context.state === 'closed') return;
    if (context.state === 'suspended') {
        context.resume();
    }
    const now = context.currentTime;
    
    // Digital "blips" (Jarvis style)
    const playBlip = (time: number, freq: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 0.05);
    };

    playBlip(now, 1200);
    playBlip(now + 0.1, 1500);
    playBlip(now + 0.2, 1800);

    // Power up sweep
    const oscSweep = context.createOscillator();
    const gainSweep = context.createGain();
    oscSweep.type = 'sawtooth'; // More techy
    oscSweep.frequency.setValueAtTime(100, now + 0.3);
    oscSweep.frequency.exponentialRampToValueAtTime(800, now + 1.5);
    
    // Filter for that resonant Jarvis feel
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now + 0.3);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 1.5);
    filter.Q.setValueAtTime(10, now + 0.3);

    gainSweep.gain.setValueAtTime(0, now + 0.3);
    gainSweep.gain.linearRampToValueAtTime(0.2, now + 0.6);
    gainSweep.gain.exponentialRampToValueAtTime(0.0001, now + 2);

    oscSweep.connect(filter);
    filter.connect(gainSweep);
    gainSweep.connect(context.destination);
    oscSweep.start(now + 0.3);
    oscSweep.stop(now + 2);

    // Final confirmation chime
    const playChime = (time: number, freq: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 1);
    };
    playChime(now + 1.5, 880);
    playChime(now + 1.6, 1100);
};

// NEW: Helper function to play a notification sound.
const playNotificationSound = (context: AudioContext | null) => {
    if (!context || context.state === 'closed') return;
    if (context.state === 'suspended') {
        context.resume();
    }
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime); // Higher pitch for notification
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15); // Short, sharp sound

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.15);
};

// NEW: Helper function to play an agent switch sound.
const playAgentSwitchSound = (context: AudioContext | null) => {
    if (!context || context.state === 'closed') return;
    if (context.state === 'suspended') {
        context.resume();
    }
    const now = context.currentTime;
    
    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    osc.start(now);
    osc.stop(now + 0.4);
};

// NEW: Helper function to play an alarm sound.
const playAlarmSound = (context: AudioContext | null) => {
    if (!context || context.state === 'closed') return;
    if (context.state === 'suspended') {
        context.resume();
    }
    const now = context.currentTime;
    
    // Create a double-beep alarm sound
    const playBeepAt = (time: number) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    };

    playBeepAt(now);
    playBeepAt(now + 0.25);
};


// Estimated costs for other modalities
const ESTIMATED_COST_PER_SECOND_OF_AUDIO = 0.000166; // Approx $0.01/min
const ESTIMATED_COST_PER_IMAGE_FRAME = 0.0025; // An estimate for image analysis
const ESTIMATED_COST_PER_TTS_CHARACTER = 0.000015; // Based on $15 per 1M characters

// Based on pricing, we can estimate token equivalents for non-text modalities
// to provide a unified view of consumption.
const COST_PER_INPUT_TOKEN = GEMINI_FLASH_INPUT_COST_PER_MILLION_TOKENS / 1_000_000;
const COST_PER_OUTPUT_TOKEN = GEMINI_FLASH_OUTPUT_COST_PER_MILLION_TOKENS / 1_000_000;

const ESTIMATED_TOKENS_PER_SECOND_OF_AUDIO = Math.round(ESTIMATED_COST_PER_SECOND_OF_AUDIO / COST_PER_INPUT_TOKEN); // ~474 tokens
const ESTIMATED_TOKENS_PER_IMAGE_FRAME = Math.round(ESTIMATED_COST_PER_IMAGE_FRAME / COST_PER_INPUT_TOKEN); // ~7143 tokens
const ESTIMATED_TOKENS_PER_TTS_CHARACTER = Math.round(ESTIMATED_COST_PER_TTS_CHARACTER / COST_PER_OUTPUT_TOKEN); // ~21 tokens

const TEXT_COMPRESSION_THRESHOLD = 300; // Summarize texts longer than 300 chars
const URL_REGEX = new RegExp('^(https?:\\/\\/)?'+ // protocol
'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
'(\\:\\d+)+?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
'(\\#[-a-z\\d_]*)?$','i'); // fragment locator

type Agent = string; // Relaxed type to allow custom IDs

// Utility function to convert Blob to Base64 (Data URL)
const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to data URL."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Utility function to convert Blob/File to Base64 (raw string)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      } else {
        reject(new Error("Failed to convert blob to base64 string."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// NEW: Função utilitária para enviar status do microfone para a extensão
function enviarStatusParaExtensao(status: boolean) {
    try {
        if (window?.parent) {
            window.parent.postMessage(
                {
                    type: "ASSISTENTE_MIC_STATUS",
                    on: status
                },
                "*"
            );
            console.log("Status do microfone enviado:", status);
        }
    } catch (e) {
        console.warn("Não foi possível enviar status para extensão:", e);
    }
}


interface AppProps {
  user: User;
  initialUserData: Partial<UserProfile>;
  onApplyTheme?: (theme: string | undefined, customColor: string | undefined) => void;
}

// Helper to extract YouTube video ID
// (Moved to services/youtubeUtils.ts)


export const App: React.FC<AppProps> = ({ user, initialUserData, onApplyTheme }) => {
  const [path, setPath] = useState(window.location.pathname);
  
  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  useEffect(() => {
  }, []);

  // UI State
  const [isMicActive, setIsMicActive] = useState(() => localStorage.getItem('atlas_mic_active') === 'true');
  const [voiceState, setVoiceState] = useState<'OUVINDO' | 'PROCESSANDO' | 'FALANDO'>('FALANDO');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicLoading, setIsMicLoading] = useState(false);
  const [isMicPermissionDenied, setIsMicPermissionDenied] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);
  
  useEffect(() => {
    if (errorMessage) {
        toast.error(errorMessage as string);
        setErrorMessage(null);
    }
  }, [errorMessage]);

  const [isImmersiveMode, setIsImmersiveMode] = useState(true);
  const [showBootOverlay, setShowBootOverlay] = useState(false);
  const isImmersiveModeRef = useRef(true);
  
  useEffect(() => {
      isImmersiveModeRef.current = isImmersiveMode;
  }, [isImmersiveMode]);

  // Persist isMicActive
  useEffect(() => {
    localStorage.setItem('atlas_mic_active', isMicActive.toString());
  }, [isMicActive]);

  // Sidebar Visibility State (Expanded Mode)
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isVoiceOnlyMode, setIsVoiceOnlyMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableAudioOutputs, setAvailableAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [showOutputSelector, setShowOutputSelector] = useState(false);
  
  // Conversation History State
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => localStorage.getItem('atlas_active_convo_id'));
  const [activeSidebarId, setActiveSidebarId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ConversationMessage[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Persist activeConversationId
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('atlas_active_convo_id', activeConversationId);
    } else {
      localStorage.removeItem('atlas_active_convo_id');
    }
  }, [activeConversationId]);
  
  // Conversation Renaming State
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  // Transcription & Input State
  const [currentInputTranscription, setCurrentInputTranscription] = useState<string>('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState<string>('');
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  // Sync refs with state for use in callbacks
  useEffect(() => {
    currentInputTranscriptionRef.current = currentInputTranscription;
  }, [currentInputTranscription]);

  useEffect(() => {
    currentOutputTranscriptionRef.current = currentOutputTranscription;
  }, [currentOutputTranscription]);

  const [textInput, setTextInput] = useState('');
  
  // Session & Command State
  const [silencePromptVisible, setSilencePromptVisible] = useState(false);
  const [visualHelp, setVisualHelp] = useState<{ image: string; highlight: { x: number; y: number } } | null>(null);
  const [chatToDelete, setChatToDelete] = useState<Conversation | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [isAgentsModalOpen, setIsAgentsModalOpen] = useState(false);
  const [isAgentsManagerOpen, setIsAgentsManagerOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent>('default');
  const [isAgentTransitioning, setIsAgentTransitioning] = useState(false);
  const [prevAgentId, setPrevAgentId] = useState<Agent>('default');

  useEffect(() => {
    if (activeAgent !== prevAgentId) {
      setIsAgentTransitioning(true);
      if (outputAudioContextRef.current) {
        playAgentSwitchSound(outputAudioContextRef.current);
      }
      const timer = setTimeout(() => {
        setIsAgentTransitioning(false);
        setPrevAgentId(activeAgent);
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [activeAgent, prevAgentId]);

  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]); 
  const activeAgentData = useMemo(() => {
    const system = SYSTEM_AGENTS.find(a => a.id === activeAgent);
    if (system) return system;
    return customAgents.find(a => a.id === activeAgent);
  }, [activeAgent, customAgents]);
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  const [isSummarizedMode, setIsSummarizedMode] = useState(false);
  const [youTubePiPInfo, setYouTubePiPInfo] = useState<{videoId: string, title?: string, isVisible: boolean}>({videoId: '', title: '', isVisible: false});
  const [browserPiPInfo, setBrowserPiPInfo] = useState<{url: string, title?: string, isVisible: boolean}>({url: '', title: '', isVisible: false});
  const [isJarvisMode, setIsJarvisMode] = useState(() => initialUserData.jarvisMode || false);
  const [isLowLatency, setIsLowLatency] = useState(() => initialUserData.lowLatency || false);
  const [isElevatedThinking, setIsElevatedThinking] = useState(() => initialUserData.elevatedThinking || false);
  const [sessionTime, setSessionTime] = useState(0);

  // Apply Jarvis Mode CSS
  useEffect(() => {
    if (isJarvisMode) {
        document.body.classList.add('jarvis-mode');
    } else {
        document.body.classList.remove('jarvis-mode');
    }
  }, [isJarvisMode]);

  const handleToggleJarvisMode = async (val: boolean) => {
    setIsJarvisMode(val);
    try {
        await setDoc(doc(db, 'users', user.uid), { jarvisMode: val }, { merge: true });
        
        // Play startup sound if turning on
        if (val) {
            if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }
            if (outputAudioContextRef.current.state === 'running') {
                playStartupSound(outputAudioContextRef.current);
            }
        }
    } catch (err) {
        console.error("Error setting jarvisMode:", err);
    }
  };

  // Session Timer Effect
  useEffect(() => {
      const interval = setInterval(() => {
          setSessionTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
  }, []);

  // Auto-start microphone if it was active
  useEffect(() => {
    if (initialLoadComplete && isMicActive && !isMicLoading && !isSessionActive) {
        const timer = setTimeout(() => {
            handleToggleMicrophone(false, true);
        }, 1500); // Small delay to ensure everything is ready
        return () => clearTimeout(timer);
    }
  }, [initialLoadComplete]);
  const [usageInfo, setUsageInfo] = useState({ totalTokens: initialUserData.usage?.totalTokens || 0, totalCost: initialUserData.usage?.totalCost || 0 });
  const [remainingTokens, setRemainingTokens] = useState(initialUserData.usage?.remainingTokens || 0);
  const [userApiKey, setUserApiKey] = useState<string | null>(() => localStorage.getItem('userGideonApiKey'));
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isValidatingInSettings, setIsValidatingInSettings] = useState(false);
  const [validationErrorInSettings, setValidationErrorInSettings] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [usdToBrlRate, setUsdToBrlRate] = useState<number | null>(null);

  const isAdmin = useMemo(() => {
    return initialUserData.role === 'admin' || (user.email === 'gabrieloliveirasantos941@gmail.com' && user.emailVerified);
  }, [initialUserData.role, user.email, user.emailVerified]);

  // Settings & Profile State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFocoFlowDashboardOpen, setIsFocoFlowDashboardOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  const handleSystemCommand = useCallback(async (command: string, args: any): Promise<{ success?: boolean; message?: string; report?: any; data?: any; url?: string; videoId?: string | null; audioUrl?: string; error?: string }> => {
    try {
        switch (command) {
            case 'playMusicOnYouTube':
                let videoIdToPlay = null;
                let candidates: string[] = [];
                
                // 1. Try direct URL first if provided
                if (args.url) {
                    videoIdToPlay = extractYouTubeVideoId(args.url);
                }
                
                // 2. If no direct URL or it failed, use videoIds list from args
                if (!videoIdToPlay && args.videoIds && Array.isArray(args.videoIds) && args.videoIds.length > 0) {
                    candidates = args.videoIds;
                }
                
                // 3. If still no videoId, use the new API to search and extract
                if (!videoIdToPlay && args.query) {
                    try {
                        const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(args.query)}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.videoIds && data.videoIds.length > 0) {
                                candidates = [...candidates, ...data.videoIds];
                            }
                        }
                    } catch (e) {
                        console.error("Failed to fetch from YouTube search API:", e);
                    }
                }

                // 4. Validate candidates and find the first available one
                if (!videoIdToPlay && candidates.length > 0) {
                    // Filter out duplicates
                    const uniqueCandidates = Array.from(new Set(candidates));
                    for (const id of uniqueCandidates) {
                        const isAvailable = await checkYouTubeVideoAvailability(id);
                        if (isAvailable) {
                            videoIdToPlay = id;
                            break;
                        }
                    }
                }
                
                // 5. Fallback to search query if still nothing (last resort)
                if (!videoIdToPlay && args.query) {
                    if (args.query.includes('youtube.com') || args.query.includes('youtu.be')) {
                        videoIdToPlay = extractYouTubeVideoId(args.query);
                    }
                }

                if (videoIdToPlay) {
                    setYouTubePiPInfo({ videoId: videoIdToPlay, title: args.title || args.query || "música", isVisible: true });
                    return { 
                        success: true, 
                        message: `🎵 Tocando agora no YouTube: ${args.title || args.query || "música"}`, 
                        videoId: videoIdToPlay,
                        data: { title: args.title || args.query, channelName: args.channelName }
                    };
                } else {
                    // SEÇÃO MODIFICADA: Não abrir janela externa. Informar que o ATLAS só usa o PiP interno.
                    return { 
                        success: false, 
                        message: `Não foi possível encontrar um vídeo direto para "${args.query}". O ATLAS opera exclusivamente via Mini Player PiP para manter a imersão. Tente especificar melhor o nome da música ou artista.`, 
                        data: { title: args.title || args.query }
                    };
                }
            case 'searchOnYouTube':
                // SEÇÃO MODIFICADA: Em vez de abrir link externo, vamos tentar tocar o primeiro resultado no PiP
                try {
                    const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(args.query)}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.videoIds && data.videoIds.length > 0) {
                            const firstId = data.videoIds[0];
                            setYouTubePiPInfo({ videoId: firstId, title: args.query, isVisible: true });
                            return { success: true, message: `Pesquisando e reproduzindo "${args.query}" no Mini Player PiP.`, videoId: firstId };
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch from YouTube search API:", e);
                }
                return { success: false, message: "O ATLAS gerencia o YouTube exclusivamente pelo Mini Player PiP. Não foi possível encontrar um vídeo para os termos pesquisados." };
            case 'openYouTube':
                // Já estava correto, apenas reforçando a mensagem se necessário
                return { success: true, message: "O YouTube no ATLAS é integrado. Diga 'Atlas, tocar [música]' para iniciar o Mini Player PiP sem sair da aplicação." };
            case 'searchOnGoogle':
                const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(args.query)}`;
                window.open(googleSearchUrl, '_blank');
                return { success: true, message: `Pesquisando "${args.query}" no Google...`, url: googleSearchUrl };
            case 'openWebsite':
                window.open(args.url, '_blank');
                return { success: true, message: `Abrindo ${args.siteName || 'site'} em uma nova aba...`, url: args.url };
            case 'closeWebsite':
            case 'closeBrowser':
                setBrowserPiPInfo(prev => ({ ...prev, isVisible: false }));
                return { success: true, message: "Navegador integrado fechado." };
            case 'openSettings':
                setIsSettingsModalOpen(true);
                return { success: true, message: "Abrindo painel de configurações (ajustes)." };
            case 'openAgents':
                setIsAgentsModalOpen(true);
                return { success: true, message: "Abrindo o Núcleo de Especialistas." };
            case 'closeAgents':
            case 'closeCore':
                setIsAgentsModalOpen(false);
                return { success: true, message: "Fechando o Núcleo de Especialistas." };
            case 'openDashboard':
            case 'openFocoCore':
            case 'openFocoFlow':
                setIsFocoFlowDashboardOpen(true);
                return { success: true, message: "Abrindo o painel FocoFlow / FocoCore (FocoCore Dashboard)." };
            case 'closeDashboard':
                setIsFocoFlowDashboardOpen(false);
                return { success: true, message: "Fechando o painel FocoFlow." };
            case 'stopActiveAlarm':
                window.dispatchEvent(new CustomEvent('stop_active_alarm'));
                return { success: true, message: "Sistema de alerta interrompido." };
            case 'addTask':
                addTask(args.title, args.category || 'GERAL', args.priority || 'medium');
                setIsFocoFlowDashboardOpen(true);
                setTimeout(() => window.dispatchEvent(new CustomEvent('focoflow_switch_tab', { detail: { tab: 'tasks' } })), 100);
                return { success: true, message: `Tarefa "${args.title}" adicionada com sucesso ao painel.` };
            case 'addTransaction':
                addTransaction(args.description, args.amount, args.type, args.category, new Date().toISOString());
                setIsFocoFlowDashboardOpen(true);
                setTimeout(() => window.dispatchEvent(new CustomEvent('focoflow_switch_tab', { detail: { tab: 'finances' } })), 100);
                return { success: true, message: `Transação financeira registrada: ${args.description} (${args.type}).` };
            case 'addNote':
                addNote(args.title, args.content);
                setIsFocoFlowDashboardOpen(true);
                setTimeout(() => window.dispatchEvent(new CustomEvent('focoflow_switch_tab', { detail: { tab: 'notes' } })), 100);
                return { success: true, message: `Nota "${args.title}" criada.` };
            case 'addReminder':
                addReminder(args.title, args.datetime, args.isImportant || false);
                setIsFocoFlowDashboardOpen(true);
                setTimeout(() => window.dispatchEvent(new CustomEvent('focoflow_switch_tab', { detail: { tab: 'reminders' } })), 100);
                return { success: true, message: `Lembrete "${args.title}" gravado.` };
            case 'getInterfaceContext':
                return { 
                    success: true, 
                    data: {
                        isSettingsOpen: isSettingsModalOpen,
                        isAgentsOpen: isAgentsModalOpen,
                        isCameraActive,
                        isMicActive,
                        isScreenSharing,
                        activeAgent,
                        activeAgentName: activeAgentData?.name,
                        currentTheme: theme,
                        userIsActive: true, // Simplified
                        time: new Date().toLocaleTimeString('pt-BR')
                    }
                };
            default:
                return { error: "Comando desconhecido." };
        }
    } catch (e: any) {
        return { error: e.message };
    }
  }, [user.uid]);
  const handleSearchPastConversationsCommand = useCallback(async (queryStr: string, limitCount: number = 10) => {
    console.log("Searching past conversations for:", queryStr);
    if (!user) return { error: "Usuário não autenticado." };

    try {
      const convosPath = 'conversations';
      const convosQuery = query(collection(db, convosPath), where('uid', '==', user.uid));
      let convosSnapshot;
      try {
        convosSnapshot = await getDocs(convosQuery);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, convosPath);
        throw err;
      }
      
      if (convosSnapshot.empty) return { result: "Nenhuma conversa anterior encontrada." };

      const allConvos = convosSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

      let results: any[] = [];
      const searchTerms = queryStr.toLowerCase().split(' ').filter(t => t.length > 2);

      for (const convo of allConvos.slice(0, 30)) { // Check more conversations
        let matchFound = false;
        
        // Check title
        if (convo.title && convo.title.toLowerCase().includes(queryStr.toLowerCase())) {
          matchFound = true;
        }

        const msgPath = `conversations/${convo.id}/messages`;
        const msgQuery = query(
          collection(db, msgPath),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
        let msgSnapshot;
        try {
          msgSnapshot = await getDocs(msgQuery);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, msgPath);
          continue; // Skip this conversation if we can't read its messages
        }
        
        msgSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.text) {
            const textLower = data.text.toLowerCase();
            const isDirectMatch = textLower.includes(queryStr.toLowerCase());
            const hasSearchTerms = searchTerms.length > 0 && searchTerms.every(term => textLower.includes(term));

            if (isDirectMatch || hasSearchTerms || matchFound) {
              results.push({
                convoTitle: convo.title,
                role: data.role,
                text: data.text.substring(0, 500) + (data.text.length > 500 ? '...' : ''),
                timestamp: data.timestamp instanceof Date ? data.timestamp.toLocaleString() : 
                           (data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : 'Data desconhecida')
              });
            }
          }
        });
      }

      if (results.length === 0) {
        return { result: `Não encontrei referências claras a "${queryStr}" no histórico de projetos e conversas.` };
      }

      // Sort results by timestamp (most recent first)
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Deduplicate by text to avoid spamming the same message if it matches multiple ways
      const uniqueResults = Array.from(new Map(results.map(item => [item.text, item])).values());

      return { 
        result: `Encontrei as seguintes referências no histórico para "${queryStr}":\n` + 
        uniqueResults.slice(0, limitCount).map(r => `[${r.timestamp}] na conversa "${r.convoTitle}" - ${r.role}: ${r.text}`).join('\n\n')
      };

    } catch (error) {
      console.error("Error searching past conversations:", error);
      return { error: "Erro ao buscar no histórico." };
    }
  }, [user]);

  const handleSearchMemoryCommand = useCallback(async (queryStr: string, limitCount: number = 5) => {
    if (!user) return { error: "Usuário não autenticado." };
    const result = await searchMemory(user.uid, queryStr, limitCount);
    return { result };
  }, [user]);

  const handleSaveImportantMemoryCommand = useCallback(async (info: string) => {
    if (!user) return { error: "Usuário não autenticado." };
    await saveImportantMemory(user.uid, info);
    return { result: "Informação salva na memória importante." };
  }, [user]);

  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false); // NEW STATE for Archived Conversations Modal
  const [profilePicUrl, setProfilePicUrl] = useState(initialUserData.profilePicUrl || null);
  const [theme, setTheme] = useState(initialUserData.theme || 'dark');
  const [customThemeColor, setCustomThemeColor] = useState(initialUserData.customThemeColor || '#00B7FF');
  const [tempColor, setTempColor] = useState(initialUserData.customThemeColor || '#00B7FF'); 
  const [voiceName, setVoiceName] = useState(initialUserData.voiceName || 'Kore'); 
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  useEffect(() => {
    const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  
  useEffect(() => {
    // Robustly find a voice:
    // 1. Try exact or partial match with the selected voiceName
    // 2. If not found, try to find a Portuguese-Brazilian voice
    // 3. If that fails too, pick the first available voice
    
    let foundVoice = voices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
    
    if (!foundVoice) {
        foundVoice = voices.find(v => v.lang.startsWith('pt-BR'));
    }
    
    if (!foundVoice && voices.length > 0) {
        foundVoice = voices[0];
    }
    
    setSelectedVoice(foundVoice || null);
    console.log("Voices available:", voices.map(v => v.name));
    console.log("VoiceName selected:", voiceName);
    console.log("Found voice:", foundVoice ? foundVoice.name : "None");
  }, [voiceName, voices]);
  const [assistantCustomName, setAssistantCustomName] = useState(initialUserData.assistantCustomName || 'Atlas');
  const [userPreferredName, setUserPreferredName] = useState(initialUserData.userPreferredName || '');
  const [isTextToSpeechEnabled, setIsTextToSpeechEnabled] = useState(initialUserData.textToSpeechEnabled || false); // NEW State for TTS
  const [customBackground, setCustomBackground] = useState<string | null>(() => {
    return localStorage.getItem('atlas_custom_bg');
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('atlas_bg_opacity');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => {
    const saved = localStorage.getItem('atlas_custom_themes');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCustomThemeId, setActiveCustomThemeId] = useState<string | null>(() => {
    return localStorage.getItem('atlas_active_custom_theme_id');
  });
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      const userPath = `users/${user.uid}`;
      setDoc(doc(db, 'users', user.uid), { 
        lastSeen: serverTimestamp(),
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || 'Usuário',
        uid: user.uid
      }, { merge: true })
        .catch(e => {
          // Silent catch for lastSeen to avoid annoying toasts during session
          console.warn("Silent catch for lastSeen:", e);
        });
    }
  }, [user]);

  // Apply custom theme on load
  useEffect(() => {
    if (customBackground) {
      document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,${1 - bgOpacity}), rgba(0,0,0,${1 - bgOpacity})), url(${customBackground})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.documentElement.classList.add('has-custom-theme');
      
      // Remove any custom theme style if background is set manually
      const existingStyle = document.getElementById('atlas-custom-theme-style');
      if (existingStyle) existingStyle.remove();
      const bgVideo = document.getElementById('atlas-custom-bg-video');
      if (bgVideo) bgVideo.remove();
      
      return;
    }

    if (activeCustomThemeId) {
      const theme = customThemes.find(t => t.id === activeCustomThemeId);
      if (theme) {
        applyCustomTheme(theme);
      } else {
        applyCustomTheme(null);
      }
    } else {
      applyCustomTheme(null);
    }
  }, [activeCustomThemeId, customThemes, customBackground, bgOpacity]);

  // Persist custom themes
  useEffect(() => {
    localStorage.setItem('atlas_custom_themes', JSON.stringify(customThemes));
  }, [customThemes]);

  useEffect(() => {
    if (activeCustomThemeId) {
        localStorage.setItem('atlas_active_custom_theme_id', activeCustomThemeId);
    } else {
        localStorage.removeItem('atlas_active_custom_theme_id');
    }
  }, [activeCustomThemeId]);

  // Persist custom assistant name to localStorage for Auth screen
  useEffect(() => {
      if (assistantCustomName) {
          localStorage.setItem('assistantCustomName', assistantCustomName);
      }
  }, [assistantCustomName]);

  // Notification System State
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const hasPlayedNotificationSoundRef = useRef(false); // NEW: To prevent multiple notification sounds
  const [ringingAlarms, setRingingAlarms] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]); // NEW: State to hold all reminders
  const alarmIntervalRef = useRef<number | null>(null);

  // Refs
  const liveSessionControllerRef = useRef<LiveSessionController | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null); 
  const audioAnalyserRef = useRef<AnalyserNode | null>(null); // Output Analyser
  const inputAudioAnalyserRef = useRef<AnalyserNode | null>(null); // NEW: Input Analyser Ref
  const animationFrameRef = useRef<number | null>(null); // NEW: Animation Loop Ref
  const silenceTimerRef = useRef<number | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const usageUpdateRef = useRef({ tokenDelta: 0, costDelta: 0 });
  const firestoreUpdateTimerRef = useRef<number | null>(null);
  const visionVideoRef = useRef<HTMLVideoElement>(null);
  const hudVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleToggleMicrophoneRef = useRef<any>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null); // NEW: Visualizer Canvas Ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      // Automatic entry after a short delay
      const timer = setTimeout(() => {
          // Attempt to initialize audio context (might be blocked until first interaction)
          if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
              try {
                  outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
              } catch (e) {
                  console.warn("Could not auto-initialize AudioContext:", e);
              }
          }
          setShowBootOverlay(false);
          // Play startup sound if context is running
          if (outputAudioContextRef.current?.state === 'running') {
              playStartupSound(outputAudioContextRef.current);
          }
      }, 3500); // 3.5 seconds delay for the "boot" feel
      
      return () => clearTimeout(timer);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  
  // Scrolling Logic Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true); // Default to true so it starts at bottom

  // --- TEXTAREA AUTO-RESIZE ---
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textInput]);

  // Refs for State (Fix Stale Closures in Event Listeners)
  const isMicActiveRef = useRef(isMicActive);
  const isScreenSharingRef = useRef(isScreenSharing);
  const isCameraActiveRef = useRef(isCameraActive);
  
  // Prevent duplicate messages
  const lastProcessedResponseRef = useRef<string>('');


  // Efeito para atualizar o favicon, mostrando um ponto vermelho quando o microfone está ativo.
  useEffect(() => {
    const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = createFavicon(isMicActive);
    }
  }, [isMicActive]);
  
  // Sync Refs with State
  useEffect(() => { isMicActiveRef.current = isMicActive; }, [isMicActive]);
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);
  useEffect(() => { isCameraActiveRef.current = isCameraActive; }, [isCameraActive]);

  // Previous state ref for mic active status to detect change
  const prevIsMicActiveRef = useRef<boolean>(isMicActive);
  
  // Effect to play a sound when the microphone is turned off.
  useEffect(() => {
    if (prevIsMicActiveRef.current && !isMicActive) {
      // Play a low-pitched beep to indicate 'off'
      // Note: We only play sound here if state changed. The actual logic is in disconnectSession or handleToggle
      // window.speechSynthesis.cancel(); // Stopped in handler
    }
    prevIsMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  // Ensure video element stays in sync with stream state to fix visibility issues
  useEffect(() => {
    const updateVideoElements = async (stream: MediaStream | null) => {
        const refs = [visionVideoRef, hudVideoRef];
        for (const ref of refs) {
            if (ref.current) {
                if (ref.current.srcObject !== stream) {
                    ref.current.srcObject = stream;
                    if (stream) {
                        try {
                            await ref.current.play();
                        } catch (e) {
                            console.warn("Video play error:", e);
                        }
                    }
                }
            }
        }
    };

    if (isCameraActive && cameraStreamRef.current) {
        updateVideoElements(cameraStreamRef.current);
    } else if (isScreenSharing && screenStreamRef.current) {
        updateVideoElements(screenStreamRef.current);
    } else {
        updateVideoElements(null);
    }
  }, [isCameraActive, isScreenSharing, isSessionActive]);

  useEffect(() => {
    const handleOpenConversation = (e: any) => {
      if (e.detail?.id) {
        setActiveConversationId(e.detail.id);
      }
    };
    window.addEventListener('atlas_open_conversation', handleOpenConversation);
    return () => {
      window.removeEventListener('atlas_open_conversation', handleOpenConversation);
    };
  }, []);

  // --- PRESENCE SYSTEM (Online Status) ---
  useEffect(() => {
      if (!user) return;

      const updatePresence = async () => {
          try {
              const userRef = doc(db, 'users', user.uid);
              await setDoc(userRef, {
                  lastSeen: serverTimestamp()
              }, { merge: true });
          } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
          }
      };

      updatePresence();
      const interval = setInterval(updatePresence, 60000);

      const handleVisibilityChange = () => {
          if (!document.hidden) {
              updatePresence();
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
  }, [user]);

  const updateUsage = useCallback((tokens: number, cost: number) => {
      if (userApiKey) return;
      setUsageInfo(prev => ({ totalTokens: prev.totalTokens + tokens, totalCost: prev.totalCost + cost }));
      setRemainingTokens(prev => prev - tokens);
      usageUpdateRef.current.tokenDelta += tokens;
      usageUpdateRef.current.costDelta += cost;
      if (firestoreUpdateTimerRef.current) clearTimeout(firestoreUpdateTimerRef.current);
      firestoreUpdateTimerRef.current = window.setTimeout(async () => {
          const { tokenDelta, costDelta } = usageUpdateRef.current;
          if (tokenDelta > 0 || costDelta > 0) {
              const userPath = `users/${user.uid}`;
              const userDocRef = doc(db, 'users', user.uid);
              try {
                  await setDoc(userDocRef, {
                      usage: {
                          totalTokens: increment(tokenDelta),
                          totalCost: increment(costDelta),
                          remainingTokens: increment(-tokenDelta)
                      }
                  }, { merge: true });
              } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, userPath);
              }
              usageUpdateRef.current = { tokenDelta: 0, costDelta: 0 };
          }
      }, 5000);
  }, [userApiKey, user.uid]);

  // --- OPTIMIZED VIDEO CAPTURE (Downscaling) ---
  const captureScreenAsBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const videoToCapture = visionVideoRef.current;
      
      // Some browsers might suspend the track if the video is too hidden or small
      // We check for that and also check videoWidth to ensure content is arriving
      if (!videoToCapture || videoToCapture.readyState < 2 || !canvasRef.current || videoToCapture.videoWidth === 0) { 
        resolve(null); 
        return; 
      }
      
      const video = videoToCapture;
      const canvas = canvasRef.current;
      
      // Use alpha: false to optimize canvas performance for video frames
      const ctx = canvas.getContext('2d', { alpha: false });
      
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          // MAX WIDTH 800px for performance optimization
          const MAX_WIDTH = 800;
          let width = video.videoWidth;
          let height = video.videoHeight;
          
          if (width > MAX_WIDTH) {
              const scale = MAX_WIDTH / width;
              width = MAX_WIDTH;
              height = height * scale;
          }

          // Set canvas to downscaled size
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(video, 0, 0, width, height);
          
          // Compress to JPEG 0.6 quality for bandwidth efficiency
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.6);
      } else {
        resolve(null);
      }
    });
  }, []);

  // Efeito que gerencia o envio recorrente dos frames (Vision Loop centralizado)
  useEffect(() => {
    if ((isScreenSharing || isCameraActive) && liveSessionControllerRef.current && isSessionActive) {
      frameIntervalRef.current = window.setInterval(async () => {
        if ((isScreenSharing || isCameraActive) && liveSessionControllerRef.current) {
          const blob = await captureScreenAsBlob();
          if (blob) {
              try {
                  const base64Data = await blobToBase64(blob);
                  // Envio para o Gemini usando o formato 'media' como solicitado
                  liveSessionControllerRef.current?.sessionPromise?.then((session) => {
                      session.sendRealtimeInput({ 
                          video: { data: base64Data, mimeType: 'image/jpeg' } 
                      });
                  });
                  updateUsage(ESTIMATED_TOKENS_PER_IMAGE_FRAME, ESTIMATED_COST_PER_IMAGE_FRAME);
              } catch (e) {
                  console.error("Error sending frame:", e);
              }
          }
        }
      }, 1000); // 1 segundo
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [isScreenSharing, isCameraActive, isSessionActive, updateUsage, captureScreenAsBlob]);
  const { activeConversations, archivedConversations } = useMemo(() => {
    const active: Conversation[] = [];
    const archived: Conversation[] = [];
    allConversations.forEach(convo => {
      if (convo.isArchived) {
        archived.push(convo);
      } else {
        active.push(convo);
      }
    });
    return { activeConversations: active, archivedConversations: archived };
  }, [allConversations]);

  const activeConversation = useMemo(() => 
    allConversations.find(c => c.id === activeConversationId), 
  [allConversations, activeConversationId]);

  const updateConversationSummary = useCallback(async (convoId: string, messages: ConversationMessage[]) => {
    if (messages.length < 5) return; // Don't summarize very short conversations
    
    try {
      const textToSummarize = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      const summary = await summarizeText(`Resuma esta conversa focando nos principais pontos, decisões e continuidade de projetos para servir como memória de longo prazo:\n\n${textToSummarize}`);
      if (summary) {
        const convoPath = `conversations/${convoId}`;
        try {
          await updateDoc(doc(db, 'conversations', convoId), { summary });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, convoPath);
        }
      }
    } catch (err) {
      console.error("Error summarizing conversation:", err);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId && activeMessages.length > 0 && activeMessages.length % 10 === 0) {
      updateConversationSummary(activeConversationId, activeMessages);
    }
  }, [activeMessages.length, activeConversationId, updateConversationSummary]);

  const addMessage = useCallback(async (
      role: 'user' | 'model' | 'system', 
      text: string, 
      options: {
          summary?: string;
          imageUrl?: string;
          fileName?: string;
          blockType?: 'code' | 'text' | 'prompt';
          audioUrl?: string;
          youtubeVideoId?: string;
          youtubeTitle?: string;
          youtubeChannel?: string;
      } = {}
  ): Promise<string | null> => {
      if (!activeConversationId) return null;
      try {
          const { summary, imageUrl, fileName, blockType, audioUrl, youtubeVideoId, youtubeTitle, youtubeChannel } = options;
          
          // Automatically extract YouTube Video ID if not explicitly provided
          let finalYoutubeVideoId = youtubeVideoId;
          if (!finalYoutubeVideoId && text) {
              const youtubeMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
              if (youtubeMatch) {
                  finalYoutubeVideoId = youtubeMatch[1];
              }
          }

          const messageData = { 
              role, 
              text, 
              uid: user?.uid, // Added uid for easier cross-conversation searching in future
              timestamp: serverTimestamp(), 
              ...(summary && { summary }), 
              ...(imageUrl && { imageUrl }), 
              ...(fileName && { fileName }),
              ...(blockType && { blockType }),
              ...(audioUrl && { audioUrl }),
              ...(finalYoutubeVideoId && { youtubeVideoId: finalYoutubeVideoId }),
              ...(youtubeTitle && { youtubeTitle }),
              ...(youtubeChannel && { youtubeChannel })
          };
          const messageRef = await addDoc(collection(db, `conversations/${activeConversationId}/messages`), messageData);
          // Update conversation last activity
          await updateDoc(doc(db, 'conversations', activeConversationId), { updatedAt: serverTimestamp() });

          // SAVE TO PERSISTENT MEMORY
          if (user?.uid && (role === 'user' || role === 'model')) {
              saveToMemory(
                  user.uid, 
                  role === 'model' ? 'atlas' : 'user', 
                  text, 
                  'conversation'
              ).catch(e => console.error("Error saving to persistent memory:", e));
          }

          return messageRef.id;
      } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `conversations/${activeConversationId}/messages`);
          setErrorMessage("Falha ao salvar a mensagem.");
          return null;
      }
  }, [activeConversationId, user?.uid]);

  const checkAndSaveProgrammingLevel = useCallback(async (userMessage: string) => {
    if (activeAgent === 'programmer' && !initialUserData.programmingLevel) {
      const messageLower = userMessage.toLowerCase().trim();
      let level: 'basic' | 'intermediate' | 'advanced' | null = null;

      const basicTerms = ['básico', 'basico', 'iniciante', 'basic', 'beginner'];
      const intermediateTerms = ['intermédio', 'intermediário', 'intermediario', 'medio', 'medium', 'intermediate'];
      const advancedTerms = ['avançado', 'avancado', 'expert', 'especialista', 'senior', 'advanced'];

      if (basicTerms.some(term => messageLower.includes(term))) {
        level = 'basic';
      } else if (intermediateTerms.some(term => messageLower.includes(term))) {
        level = 'intermediate';
      } else if (advancedTerms.some(term => messageLower.includes(term))) {
        level = 'advanced';
      }
      
      if (level) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, { programmingLevel: level }, { merge: true });
          addMessage('system', `Seu nível de programação foi salvo como: ${level}.`);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
          setErrorMessage("Não foi possível salvar seu nível de programação.");
        }
      }
    }
  }, [activeAgent, initialUserData.programmingLevel, user.uid, addMessage]);

  // Sync internal state with props from Firestore listener
  useEffect(() => {
    setProfilePicUrl(initialUserData.profilePicUrl || null);
    setTheme(initialUserData.theme || 'dark');
    setCustomThemeColor(initialUserData.customThemeColor || '#00B7FF');
    setTempColor(initialUserData.customThemeColor || '#00B7FF');
    setVoiceName(initialUserData.voiceName || 'Kore');
    setIsTextToSpeechEnabled(initialUserData.textToSpeechEnabled || false);
    setIsLowLatency(initialUserData.lowLatency || false);
    setIsElevatedThinking(initialUserData.elevatedThinking || false);
    setRemainingTokens(initialUserData.usage?.remainingTokens || 0);
    setUsageInfo({
      totalTokens: initialUserData.usage?.totalTokens || 0,
      totalCost: initialUserData.usage?.totalCost || 0
    });
  }, [initialUserData]);

  // Fetch System Notifications
  useEffect(() => {
    if (!user) return;

    const q = query(
        collection(db, 'system_notifications'),
        orderBy('createdAt', 'desc'),
        limit(5)
    );

    const path = 'system_notifications';
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifs: SystemNotification[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notifs.push({
                id: doc.id,
                title: data.title,
                message: data.message,
                videoUrl: data.videoUrl,
                linkUrl: data.linkUrl, // Added linkUrl
                linkText: data.linkText, // Added linkText
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });
        setNotifications(notifs);
        
        const seenStorage = localStorage.getItem('seenNotificationIds');
        const seenIds = seenStorage ? JSON.parse(seenStorage) : [];
        const hasUnread = notifs.some(n => !seenIds.includes(n.id));

        if (hasUnread) {
            setUnreadNotifications(true);
            // Play sound only if it hasn't been played for this batch of unread notifications
            if (!hasPlayedNotificationSoundRef.current && outputAudioContextRef.current) {
                playNotificationSound(outputAudioContextRef.current);
                hasPlayedNotificationSoundRef.current = true;
            }
        } else {
            setUnreadNotifications(false);
            hasPlayedNotificationSoundRef.current = false; // Reset if no unread notifications
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const markNotificationsAsSeen = useCallback(async () => {
      if (!notifications || notifications.length === 0) return;

      const seenStorage = localStorage.getItem('seenNotificationIds');
      const seenIds: string[] = seenStorage ? JSON.parse(seenStorage) : [];
      const newSeenIds = [...seenIds];
      let hasUpdates = false;

      for (const n of notifications) {
          if (!seenIds.includes(n.id)) {
              const notifRef = doc(db, 'system_notifications', n.id);
              try {
                  await updateDoc(notifRef, { viewCount: increment(1) });
              } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, `system_notifications/${n.id}`);
              }
              newSeenIds.push(n.id);
              hasUpdates = true;
          }
      }

      if (hasUpdates) {
          localStorage.setItem('seenNotificationIds', JSON.stringify(newSeenIds));
      }
      setUnreadNotifications(false);
      hasPlayedNotificationSoundRef.current = false; // Reset after marking as seen
  }, [notifications]);

  // ATLAS Alarms Listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'focuflow_items'),
      where('uid', '==', user.uid),
      where('category', '==', 'reminder')
    );

    const path = 'focuflow_items';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReminders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReminders(fetchedReminders);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  // NEW: Alarm Checker Effect
  useEffect(() => {
    if (!reminders || reminders.length === 0) {
      setRingingAlarms([]);
      return;
    }

    const checkAlarms = () => {
      const now = Date.now();
      const active = (reminders || []).filter((r: any) => {
        // Trigger if reminderTime is reached and not dismissed/completed
        // We allow a window of 1 hour for old alarms to trigger if they weren't dismissed
        const oneHourAgo = now - (60 * 60 * 1000);
        return r.reminderTime <= now && r.reminderTime > oneHourAgo && !r.dismissed && !r.completed;
      });
      
      // Only update if the list of active alarms actually changed to prevent unnecessary re-renders
      setRingingAlarms(prev => {
        const currentPrev = prev || [];
        const prevIds = currentPrev.map(a => a.id).sort().join(',');
        const nextIds = active.map(a => a.id).sort().join(',');
        if (prevIds === nextIds) return currentPrev;
        return active;
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    checkAlarms();

    return () => clearInterval(interval);
  }, [reminders]);

  // NEW: Alarm Sound Effect
  useEffect(() => {
    if (ringingAlarms && ringingAlarms.length > 0) {
      if (!alarmIntervalRef.current) {
        // Ensure AudioContext exists for alarm
        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
            try {
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            } catch (e) {
                console.error("Failed to create AudioContext for alarm:", e);
            }
        }

        // Play alarm sound every second
        alarmIntervalRef.current = window.setInterval(() => {
          if (outputAudioContextRef.current) {
            playAlarmSound(outputAudioContextRef.current);
          }
        }, 1000);
      }
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [ringingAlarms]);

  const handleDismissAlarm = useCallback(async (alarmId: string) => {
    try {
        // Mark as dismissed (local logic for now)
        console.log("Alarm dismissed:", alarmId);
        setRingingAlarms(prev => (prev || []).filter(a => a.id !== alarmId));
    } catch (error) {
        console.error("Error dismissing alarm:", error);
    }
  }, []);

  const handleDismissAllAlarms = useCallback(async () => {
    if (!ringingAlarms || ringingAlarms.length === 0) return;
    try {
        const ids = ringingAlarms.map(a => a.id);
        // Mark multiple as dismissed (local logic for now)
        console.log("Alarms dismissed:", ids);
        setRingingAlarms([]);
    } catch (error) {
        console.error("Error dismissing all alarms:", error);
    }
  }, [ringingAlarms]);

  const handleStopAlarmCommand = useCallback(() => {
      console.log("Stopping alarm via voice command...");
      handleDismissAllAlarms();
  }, [handleDismissAllAlarms]);

  const handleUpdateUserPreferencesCommand = useCallback(async (prefs: { themeColor?: string; assistantName?: string; userName?: string }) => {
      console.log("Updating user preferences via voice command:", prefs);
      if (!user) return;

      const updates: any = {};

      if (prefs.themeColor) {
          setCustomThemeColor(prefs.themeColor);
          updates.customThemeColor = prefs.themeColor;
      }

      if (prefs.assistantName) {
          setAssistantCustomName(prefs.assistantName);
          updates.assistantCustomName = prefs.assistantName;
      }

      if (prefs.userName) {
          setUserPreferredName(prefs.userName);
          updates.userPreferredName = prefs.userName;
      }

      if (Object.keys(updates).length > 0) {
          const userPath = `users/${user.uid}`;
          try {
              await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
          } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, userPath);
          }
      }
  }, [user]);

  // NEW: Fetch Custom Agents
  useEffect(() => {
      if (!user) return;

      const q = query(
          collection(db, `users/${user.uid}/custom_agents`),
          orderBy('createdAt', 'desc')
      );

      const path = `users/${user.uid}/custom_agents`;
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const agents: CustomAgent[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              agents.push({
                  id: doc.id,
                  name: data.name,
                  description: data.description,
                  systemInstruction: data.systemInstruction,
                  createdAt: data.createdAt?.toDate() || new Date(),
              });
          });
          setCustomAgents(agents);
      }, (err) => {
          handleFirestoreError(err, OperationType.GET, path);
      });

      return () => unsubscribe();
  }, [user]);

  // Fetch all conversations for the user
  useEffect(() => {
      if (!user) return;
      setIsConversationsLoading(true);

      const q = query(
          collection(db, 'conversations'),
          where('uid', '==', user.uid)
      );

      const path = 'conversations';
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedConversations: Conversation[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              fetchedConversations.push({
                  id: doc.id,
                  uid: data.uid,
                  title: data.title,
                  createdAt: data.createdAt?.toDate() || new Date(),
                  isArchived: data.isArchived || false,
                  summary: data.summary,
              });
          });
          
          fetchedConversations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          setAllConversations(fetchedConversations);
          
          const currentActive = fetchedConversations.find(c => !c.isArchived);

          // If we have a saved ID, try to find it. Otherwise fallback to most recent.
          const savedId = localStorage.getItem('atlas_active_convo_id');
          const savedConvo = savedId ? fetchedConversations.find(c => c.id === savedId) : null;

          // Fix: Ensure activeConversationId belongs to the current user
          const isCurrentActiveValid = activeConversationId && fetchedConversations.some(c => c.id === activeConversationId);
          
          if (!activeConversationId || !isCurrentActiveValid) {
              if (savedConvo) {
                  setActiveConversationId(savedConvo.id);
              } else if (currentActive) {
                  setActiveConversationId(currentActive.id);
              } else if (fetchedConversations.length > 0) {
                  // Fallback to most recent if savedConvo not found
                  setActiveConversationId(fetchedConversations[0].id);
              }
          }
          
          if (!initialLoadComplete && !currentActive) {
              seedInitialConversation();
          }
          
          setIsConversationsLoading(false);
          setInitialLoadComplete(true);
      }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          setErrorMessage("Não foi possível carregar seu histórico de conversas.");
          setIsConversationsLoading(false);
      });

      return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch messages for the active conversation
  useEffect(() => {
      if (!activeConversationId || !initialLoadComplete) {
          setActiveMessages([]);
          return;
      }

      // Guard: Ensure the conversation exists in the loaded list for this user
      if (!allConversations.some(c => c.id === activeConversationId)) {
          console.log("Waiting for valid conversation ID...");
          return;
      }
      
      // Reset scroll tracking when changing conversations
      shouldAutoScrollRef.current = true;

      setIsMessagesLoading(true);
      const q = query(
          collection(db, `conversations/${activeConversationId}/messages`),
          orderBy('timestamp', 'asc')
      );

      const path = `conversations/${activeConversationId}/messages`;
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedMessages: ConversationMessage[] = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              fetchedMessages.push({
                  id: doc.id,
                  role: data.role,
                  text: data.text,
                  timestamp: data.timestamp?.toDate() || new Date(),
                  summary: data.summary,
                  imageUrl: data.imageUrl,
                  fileName: data.fileName,
                  blockType: data.blockType,
              });
          });
          setActiveMessages(fetchedMessages);
          setIsMessagesLoading(false);
      }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          setErrorMessage("Não foi possível carregar as mensagens desta conversa.");
          setIsMessagesLoading(false);
      });

      return () => unsubscribe();
  }, [activeConversationId]);

  // SMART AUTO-SCROLL LOGIC
  const handleChatScroll = useCallback(() => {
      if (chatContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
          // Determine if user is near bottom (within 100px)
          const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
          shouldAutoScrollRef.current = isAtBottom;
      }
  }, []);

  useEffect(() => {
      if (shouldAutoScrollRef.current && chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
  }, [activeMessages, currentInputTranscription, currentOutputTranscription, silencePromptVisible]);


  const handleLogout = async () => {
    try {
      if (user?.email) {
        localStorage.setItem('lastKnownTokenCount', JSON.stringify({ email: user.email, tokens: remainingTokens }));
      }
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error)
    }
  };
  
  const generateAndStoreSummary = useCallback(async (messageId: string, text: string) => {
    if (text.length > TEXT_COMPRESSION_THRESHOLD && activeConversationId) {
        const messagePath = `conversations/${activeConversationId}/messages/${messageId}`;
        try {
            const summary = await summarizeText(text);
            const messageRef = doc(db, `conversations/${activeConversationId}/messages`, messageId);
            await updateDoc(messageRef, { summary });
        } catch(err) {
            handleFirestoreError(err, OperationType.UPDATE, messagePath);
        }
    }
  }, [activeConversationId]);

  const generateConversationSummary = useCallback(async () => {
    if (activeConversationId && activeMessages.length > 0) {
        try {
            const activeConversation = activeConversations.find(c => c.id === activeConversationId);
            const currentSummary = activeConversation?.summary;
            // Summarize the last few messages to update the long-term memory
            const newSummary = await summarizeConversation(currentSummary, activeMessages.slice(-6));
            if (newSummary && newSummary !== currentSummary) {
                const conversationPath = `conversations/${activeConversationId}`;
                const conversationDocRef = doc(db, 'conversations', activeConversationId);
                try {
                    await updateDoc(conversationDocRef, { summary: newSummary });
                    console.log("Conversation summary updated for continuity.");
                    
                    // Also save to Atlas memory for long-term persistence and searchability
                    await saveToMemory(user.uid, 'system', `Resumo da conversa "${activeConversation?.title || 'Sem título'}": ${newSummary}`, 'important_memory');
                    
                    // Notify dashboard to refresh
                    window.dispatchEvent(new CustomEvent('atlas_refresh_conversations'));
                } catch (err) {
                    handleFirestoreError(err, OperationType.UPDATE, conversationPath);
                }
            }
        } catch (err) {
            console.error("Error generating conversation summary:", err);
        }
    }
  }, [activeConversationId, activeMessages, activeConversations, user.uid]);

  useEffect(() => {
    const handleSummarize = (e: any) => {
      if (e.detail?.id === activeConversationId) {
        generateConversationSummary();
      }
    };
    window.addEventListener('atlas_summarize_conversation', handleSummarize);
    return () => {
      window.removeEventListener('atlas_summarize_conversation', handleSummarize);
    };
  }, [activeConversationId, generateConversationSummary]);
  
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setSilencePromptVisible(false);
  }, [setSilencePromptVisible]); 

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
  }, [clearSilenceTimer]); 

  // --- DISCONNECT SESSION ---
  // MOVED UP to be available for stopScreenSharing
  const disconnectSession = useCallback(() => {
    setIsMicActive(false);
    if (liveSessionControllerRef.current) {
        liveSessionControllerRef.current?.stopMicInput();
        liveSessionControllerRef.current?.closeSession();
        liveSessionControllerRef.current = null;
    }
    // Also force stop videos if full disconnect is called
    [visionVideoRef, hudVideoRef].forEach(ref => {
        if (ref.current) ref.current.srcObject = null;
    });
    
    if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
    }
    setIsScreenSharing(false);
    setIsCameraActive(false);
    setVisualHelp(null);
    
    playBeep(outputAudioContextRef.current, 300, 150); 
    enviarStatusParaExtensao(false);
  }, []);

  const handleBluetoothConnect = useCallback(async () => {
    // Request audio permission to get device labels and list devices
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAvailableAudioOutputs(outputs);
        setShowOutputSelector(true);
    } catch (e: any) {
        console.error("Error accessing devices:", e);
        // Fallback for browsers that require selectAudioOutput
        if ((navigator.mediaDevices as any).selectAudioOutput) {
             try {
                const d = await (navigator.mediaDevices as any).selectAudioOutput();
                if (d && outputAudioContextRef.current && typeof (outputAudioContextRef.current as any).setSinkId === 'function') {
                    await (outputAudioContextRef.current as any).setSinkId(d.deviceId);
                    alert(`Áudio do ATLAS roteado para: ${d.label || "Dispositivo Selecionado"}`);
                    playBeep(outputAudioContextRef.current, 600, 200);
                }
             } catch(err) {
                alert("Não foi possível selecionar o dispositivo de áudio. Verifique permissões.");
             }
        } else {
            alert("Seu navegador não permite selecionar dispositivos de saída de áudio diretamente. Tente conceder permissão de microfone.");
        }
    }
  }, []);

  const handleSelectAudioOutput = useCallback(async (deviceId: string, label: string) => {
    try {
        if (outputAudioContextRef.current && typeof (outputAudioContextRef.current as any).setSinkId === 'function') {
            await (outputAudioContextRef.current as any).setSinkId(deviceId);
            alert(`Áudio do ATLAS roteado para: ${label || "Dispositivo Selecionado"}`);
            playBeep(outputAudioContextRef.current, 600, 200);
        }
    } catch (e) {
        console.error("Error setting sink id:", e);
        alert("Erro ao mudar saída de áudio.");
    }
    setShowOutputSelector(false);
  }, []);

  const handleRealBluetoothConnect = useCallback(async () => {
    try {
      if (!(navigator as any).bluetooth) {
        alert("Seu navegador não suporta a API Web Bluetooth. Use Chrome ou Edge (desktop).");
        return;
      }
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true
      });
      alert(`Pareado com sucesso via Web Bluetooth: ${device.name || 'Dispositivo Desconhecido'}`);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || "";
      if (errorMessage.includes("Bluetooth adapter not available")) {
          alert("Adaptador Bluetooth não encontrado ou não disponível neste dispositivo.");
      } else {
          alert(`Falha ao conectar Bluetooth: ${errorMessage || "Cancelado pelo usuário."}`);
      }
    }
  }, []);

  const stopScreenSharing = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    [visionVideoRef, hudVideoRef].forEach(ref => {
        if (ref.current) ref.current.srcObject = null;
    });
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    setIsScreenSharing(false);
    setVisualHelp(null);

    // Encerra sessão completa se nenhum input estiver ativo (Mic desligado)
    if (!isMicActiveRef.current && liveSessionControllerRef.current) {
        disconnectSession();
    }
    
    console.log("Screen sharing stopped.");
  }, [disconnectSession]);

  // Define handleActivateAgent and handleDeactivateAgent early so they are available for useCallback dependencies and other functions.
  const handleActivateAgent = useCallback((agentId: Agent) => {
    if (agentId === activeAgent) return;
    
    // Determine name for system message
    let agentName = 'Agente Personalizado';
    const customAgent = customAgents.find(a => a.id === agentId);
    const systemAgent = SYSTEM_AGENTS.find(a => a.id === agentId);

    if (customAgent) {
        agentName = customAgent.name;
    } else if (systemAgent) {
        agentName = systemAgent.name;
    }

    // Restart the mic automatically for the new agent if it is active.
    if (isMicActiveRef.current && handleToggleMicrophoneRef.current) {
        handleToggleMicrophoneRef.current(false, false); // Turn off
        setTimeout(() => {
             if (handleToggleMicrophoneRef.current) handleToggleMicrophoneRef.current(false, true); // Turn back on
        }, 1500);
        addMessage('system', `Reiniciando o sistema de voz para: ${agentName}...`);
    }

    setActiveAgent(agentId);
    setIsAgentsModalOpen(false);

    addMessage('system', `Sistema ativou o modo: ${agentName}`);
  }, [activeAgent, customAgents, addMessage]);

  const handleDeactivateAgent = useCallback(() => {
    if (activeAgent === 'default') return;
    setActiveAgent('default');
    setIsAgentsModalOpen(false);
    addMessage('system', 'Sistema ativou o modo: Assistente Padrão');
  }, [activeAgent, addMessage]);

  const handleCreateCustomAgent = useCallback(async (name: string, desc: string, instr: string) => {
    if(!user) return;
    try {
        await addDoc(collection(db, `users/${user.uid}/custom_agents`), {
            name, description: desc, systemInstruction: instr, createdAt: serverTimestamp()
        });
    } catch(err) { 
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/custom_agents`);
        setErrorMessage("Erro ao criar agente."); 
    }
  }, [user]);

  const handleUpdateCustomAgent = useCallback(async (id: string, name: string, desc: string, instr: string) => {
    if(!user) return;
    try {
        await updateDoc(doc(db, `users/${user.uid}/custom_agents`, id), {
            name, description: desc, systemInstruction: instr
        });
    } catch(err) { 
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/custom_agents/${id}`);
        setErrorMessage("Erro ao atualizar agente."); 
    }
  }, [user]);

  const handleDeleteCustomAgent = useCallback((id: string) => {
    if(!user) return;
    setAgentToDelete(id);
  }, [user]);

  const confirmDeleteAgent = useCallback(async () => {
    if(!user || !agentToDelete) return;
    try {
        await deleteDoc(doc(db, `users/${user.uid}/custom_agents`, agentToDelete));
        if(activeAgent === agentToDelete) handleActivateAgent('default');
        setAgentToDelete(null);
    } catch(err) { 
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/custom_agents/${agentToDelete}`);
        setErrorMessage("Erro ao excluir agente."); 
    }
  }, [user, agentToDelete, activeAgent, handleActivateAgent]);

  const onSwitchAgentCommand = useCallback((agentName: string) => {
      // Normalize string: Lowercase, remove accents
      const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedInput = normalize(agentName);

      // 1. Check Custom Agents (Name Matching)
      const customMatch = customAgents.find(a => 
          normalize(a.name).includes(normalizedInput) || normalizedInput.includes(normalize(a.name))
      );
      if (customMatch) {
          handleActivateAgent(customMatch.id);
          return;
      }

      // 2. Check System Agents (Keywords & Name Matching)
      // This allows the AI to send "trafego", "gestor", "andromeda" and we find the right agent
      const systemMatch = SYSTEM_AGENTS.find(a => 
          // Match ID directly
          a.id === agentName ||
          // Match Name partial
          normalize(a.name).includes(normalizedInput) ||
          // Match any defined keyword
          a.keywords.some(k => normalizedInput.includes(k))
      );

      if (systemMatch) {
          handleActivateAgent(systemMatch.id);
          return;
      }

      // Fallback: If "default" or general terms are used but missed above
      if (['padrao', 'normal', 'voltar', 'inicio'].some(k => normalizedInput.includes(k))) {
          handleActivateAgent('default');
      }

  }, [customAgents, handleActivateAgent]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
    }
    [visionVideoRef, hudVideoRef].forEach(ref => {
        if (ref.current) ref.current.srcObject = null;
    });
    setIsCameraActive(false);
    setVisualHelp(null);

    // Keep the session open to maintain context, even if camera is off.
    console.log("Camera stopped. Session remains open to maintain context.");
  }, [disconnectSession]);

  const startScreenSharing = useCallback(async (): Promise<boolean> => {
    try {
      // Se a câmera estiver ativa, desliga para priorizar a tela
      if (isCameraActive) {
          if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
          }
          setIsCameraActive(false);
          await new Promise(r => setTimeout(r, 100)); // Pequena pausa para garantir que a câmera parou
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: false,
          // @ts-ignore - Some browsers support these to avoid internal frame issues
          selfBrowserSurface: "exclude",
          surfaceSwitching: "include"
      });
      screenStreamRef.current = stream;
      
      const updateRef = async (ref: React.RefObject<HTMLVideoElement | null>) => {
          if (ref.current) {
              ref.current.srcObject = stream;
              try { await ref.current.play(); } catch(e) {}
          }
      };
      await updateRef(visionVideoRef);
      await updateRef(hudVideoRef);
      
      // Listener caso o usuário pare de compartilhar pelo navegador
      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };
      
      setIsScreenSharing(true);
      
      // Se a sessão não estiver ativa, inicia automaticamente para análise visual
      if (!isMicActiveRef.current && !isMicLoading && handleToggleMicrophoneRef.current) {
          handleToggleMicrophoneRef.current(false, true);
      }

      return true;
    } catch (err: any) {
      console.warn('Screen sharing failed or cancelled:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorName = err instanceof Error ? err.name : '';
      let friendlyError = '';
      if (
        errorName === 'NotAllowedError' || 
        errorMsg.includes('Permission denied') ||
        errorMsg.includes('user denied')
      ) {
         friendlyError = "Permissão para compartilhar tela foi negada pelo usuário.";
      } else if (errorName === 'NotSupportedError' || errorMsg.includes('not supported') || errorMsg.includes('is not a function')) {
         friendlyError = "Seu navegador não suporta compartilhamento de tela neste ambiente.";
      } else {
         friendlyError = `Erro ao compartilhar tela: ${errorMsg}.`;
      }
      setErrorMessage(friendlyError);
      toast.error(friendlyError, { duration: 6000 });
      return false;
    }
  }, [stopScreenSharing, isCameraActive, isMicLoading]);

  const startCamera = useCallback(async (): Promise<boolean> => {
      try {
        if (isScreenSharing) {
            // Stop screen but don't disconnect session
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }
            setIsScreenSharing(false);
            await new Promise(r => setTimeout(r, 100));
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        cameraStreamRef.current = stream;
        
        const updateRef = async (ref: React.RefObject<HTMLVideoElement | null>) => {
            if (ref.current) {
                ref.current.srcObject = stream;
                try { await ref.current.play(); } catch(e) {}
            }
        };
        await updateRef(visionVideoRef);
        await updateRef(hudVideoRef);

        stream.getVideoTracks()[0].onended = () => {
            stopCamera();
        };

        setIsCameraActive(true);

        // If session is not active, start it automatically for real-time visual analysis
        // Fix: Use isMicActiveRef to avoid stale closure and force state to true to avoid toggling off
        if (!isMicActiveRef.current && !isMicLoading && handleToggleMicrophoneRef.current) {
            handleToggleMicrophoneRef.current(false, true);
        }

        return true;
      } catch (err: any) {
          console.warn('Camera start failed or cancelled:', err);
          const errorMsg = err instanceof Error ? err.message : String(err);
          const errorName = err instanceof Error ? err.name : '';

          if (
            errorName === 'NotAllowedError' || 
            errorName === 'NotFoundError' || 
            errorName === 'AbortError' ||
            errorMsg.includes('Permission denied') ||
            errorMsg.includes('user denied')
          ) {
             if (errorName === 'NotFoundError') {
                setErrorMessage("Nenhuma câmera encontrada no dispositivo.");
             }
             return false;
          }

          setErrorMessage(`Falha ao iniciar a câmera: ${errorMsg}`);
          return false;
      }
  }, [stopCamera, isScreenSharing, isSessionActive]);
  
  const seedInitialConversation = async () => {
    if (liveSessionControllerRef.current) {
        disconnectSession();
    }
    
    try {
        const conversationsPath = 'conversations';
        const newConvoRef = await addDoc(collection(db, conversationsPath), {
            uid: user.uid,
            title: "Configuração do Atlas IA",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isArchived: false,
            summary: "Resumo da configuração inicial do sistema Atlas IA com Firebase, Autenticação e Firestore Rules.",
        });

        const messagesPath = `conversations/${newConvoRef.id}/messages`;
        const initialMessages = [
            {
                role: 'system',
                text: 'Olá! Sou o ATLAS IA. Notei que acabamos de configurar seu ambiente Firebase. Aqui está o que foi feito:\n\n1. **Firebase Provisionado**: O projeto foi criado e configurado.\n2. **Autenticação Ativada**: Login via Google está funcional.\n3. **Firestore Rules**: Regras de segurança implementadas para proteger seus dados.\n4. **Memória Ativada**: Agora posso lembrar de conversas passadas para te ajudar melhor.',
                timestamp: serverTimestamp(),
                uid: user.uid
            },
            {
                role: 'user',
                text: 'Como posso começar a usar o sistema?',
                timestamp: serverTimestamp(),
                uid: user.uid
            },
            {
                role: 'model',
                text: 'Você pode começar explorando o **ATLAS CORE Dashboard** para monitorar o sistema, ou usar o **Modo Imersivo** para que eu possa ver sua tela e te ajudar em tempo real. Também posso gerar imagens e comandos de voz!',
                timestamp: serverTimestamp(),
                uid: user.uid
            }
        ];

        for (const msg of initialMessages) {
            await addDoc(collection(db, messagesPath), msg);
        }

        // Save to memory too
        await saveToMemory(user.uid, 'system', 'O sistema Atlas IA foi configurado com sucesso. Firebase, Auth e Firestore Rules estão operacionais.', 'important_memory');

        setActiveConversationId(newConvoRef.id);
        setInitialLoadComplete(true);
    } catch (err) {
        console.error("Error seeding initial conversation:", err);
        handleNewChat(); // Fallback to standard new chat
    }
  };

  const handleNewChat = async () => {
    // If we have a session, close it entirely when starting new chat
    if(liveSessionControllerRef.current) {
        disconnectSession();
    }
    
    // Auto-archive current conversation if it exists
    if (activeConversationId) {
        const conversationPath = `conversations/${activeConversationId}`;
        try {
            const conversationDocRef = doc(db, 'conversations', activeConversationId);
            await updateDoc(conversationDocRef, { isArchived: true });
        } catch (err) {
            console.error("Error auto-archiving conversation:", err);
            handleFirestoreError(err, OperationType.UPDATE, conversationPath);
        }
    }
    
    try {
        const conversationsPath = 'conversations';
        const newConvoRef = await addDoc(collection(db, conversationsPath), {
            uid: user.uid,
            title: "Nova Conversa",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isArchived: false,
        });

        const messagesPath = `conversations/${newConvoRef.id}/messages`;
        // Initial message removed as per user request

        setActiveConversationId(newConvoRef.id);
        setTextInput('');
        setCurrentInputTranscription('');
        setCurrentOutputTranscription('');
        setErrorMessage(null);
    } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'conversations');
        setErrorMessage("Falha ao criar nova conversa.");
    }
  };
  
  const handleArchiveConversation = async (conversationId: string) => {
    const conversationPath = `conversations/${conversationId}`;
    try {
        const conversationDocRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationDocRef, { isArchived: true });

        if (activeConversationId === conversationId) {
            const nextActiveConvo = activeConversations.find(c => c.id !== conversationId);
            if (nextActiveConvo) {
                setActiveConversationId(nextActiveConvo.id);
            } else {
                handleNewChat();
            }
        }
    } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, conversationPath);
        setErrorMessage("Não foi possível arquivar a conversa.");
    }
  };
  
  const handleRestoreConversation = async (conversationId: string) => {
      const conversationPath = `conversations/${conversationId}`;
      try {
          const conversationDocRef = doc(db, 'conversations', conversationId);
          await updateDoc(conversationDocRef, { isArchived: false, createdAt: serverTimestamp() });
          setActiveConversationId(conversationId);
          setIsArchivedModalOpen(false); // Close the archived modal after restoring
      } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, conversationPath);
          setErrorMessage("Não foi possível restaurar a conversa.");
      }
  };

  const handleDeleteConversation = async () => {
    if (!chatToDelete) return;
    const conversationPath = `conversations/${chatToDelete.id}`;
    try {
      const messagesPath = `conversations/${chatToDelete.id}/messages`;
      const messagesQuery = query(collection(db, messagesPath));
      let querySnapshot;
      try {
        querySnapshot = await getDocs(messagesQuery);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, messagesPath);
        throw err;
      }
      for (const doc of querySnapshot.docs) {
          try {
              await deleteDoc(doc.ref);
          } catch (err) {
              handleFirestoreError(err, OperationType.DELETE, doc.ref.path);
          }
      }

      if (activeConversationId === chatToDelete.id) {
          const nextActiveConvo = activeConversations.find(c => c.id !== chatToDelete.id) || activeConversations[0] || null;
          setActiveConversationId(null);
          try {
            await deleteDoc(doc(db, 'conversations', chatToDelete.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, conversationPath);
            throw err;
          }
          if (nextActiveConvo) {
              setActiveConversationId(nextActiveConvo.id);
          } else {
              handleNewChat();
          }
      } else {
          try {
            await deleteDoc(doc(db, 'conversations', chatToDelete.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, conversationPath);
            throw err;
          }
      }
      setChatToDelete(null); 
    } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, conversationPath);
        setErrorMessage("Não foi possível excluir a conversa.");
        setChatToDelete(null); 
    }
  };
  
  const startEditingConversation = (convo: Conversation) => {
    setEditingConversationId(convo.id);
    setEditTitleInput(convo.title);
  };

  const saveConversationTitle = async (convoId: string) => {
    if (!editTitleInput.trim() || editTitleInput === "") {
         setEditingConversationId(null);
         return;
    }
    const conversationPath = `conversations/${convoId}`;
    try {
        await updateDoc(doc(db, 'conversations', convoId), { title: editTitleInput.trim() });
    } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, conversationPath);
        setErrorMessage("Erro ao atualizar o título.");
    } finally {
        setEditingConversationId(null);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, convoId: string) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveConversationTitle(convoId);
    } else if (e.key === 'Escape') {
        setEditingConversationId(null);
    }
  };

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        if (!response.ok) throw new Error('Failed to fetch exchange rate');
        const data = await response.json();
        const rate = parseFloat(data.USDBRL.bid);
        setUsdToBrlRate(rate);
      } catch (error) {
        console.error("Could not fetch USD to BRL exchange rate:", error);
      }
    };
    fetchExchangeRate();
    inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
    outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
    
    // Setup Audio Analysers for Visualizer
    const setupAnalysers = () => {
        if (outputAudioContextRef.current) {
            const outAnalyser = outputAudioContextRef.current.createAnalyser();
            outAnalyser.fftSize = 512;
            outAnalyser.smoothingTimeConstant = 0.6;
            outAnalyser.connect(outputAudioContextRef.current.destination);
            audioAnalyserRef.current = outAnalyser;
        }
        if (inputAudioContextRef.current) {
            const inAnalyser = inputAudioContextRef.current.createAnalyser();
            inAnalyser.fftSize = 512;
            inAnalyser.smoothingTimeConstant = 0.6;
            // Don't connect input analyser to destination to avoid feedback loop
            inputAudioAnalyserRef.current = inAnalyser;
        }
    };
    setupAnalysers();

    // Galaxy Animation State
    let time = 0;
    const numStars = 400;
    const stars: {x: number, y: number, z: number, radius: number, angle: number, speed: number, color: string, dist: number}[] = [];
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: 0,
            y: 0,
            z: Math.random() * 2,
            radius: Math.random() * 1.5 + 0.5,
            angle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.01 + 0.002,
            color: `hsl(${Math.random() * 40 + 190}, 100%, ${Math.random() * 40 + 60}%)`, // Cyan/Blue colors
            dist: Math.random() * 400 + 50
        });
    }

    // Start Visualizer Loop
    const renderVisualizer = () => {
        const smallCanvas = visualizerCanvasRef.current;
        
        if (!audioAnalyserRef.current && !inputAudioAnalyserRef.current) {
             animationFrameRef.current = requestAnimationFrame(renderVisualizer);
             return;
        }
        
        // Get data from both analysers
        const bufferLength = 256;
        const outData = new Uint8Array(bufferLength);
        const inData = new Uint8Array(bufferLength);
        
        if (audioAnalyserRef.current) audioAnalyserRef.current.getByteFrequencyData(outData);
        if (inputAudioAnalyserRef.current) inputAudioAnalyserRef.current.getByteFrequencyData(inData);
        
        // Calculate average volume for input to detect user speaking
        let inSum = 0;
        for(let i=0; i<bufferLength; i++) inSum += inData[i];
        const inAvg = inSum / bufferLength;
        const userSpeaking = inAvg > 15; // Lower threshold for better sensitivity

        // Merge data (take max of both)
        const dataArray = new Uint8Array(bufferLength);
        for (let i = 0; i < bufferLength; i++) {
            dataArray[i] = Math.max(outData[i], inData[i]);
        }

        const baseAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary') || '#00B7FF';
        const accentColor = userSpeaking ? '#00FF99' : baseAccent; // Vibrant green when user speaks

        // 1. Draw Small Canvas (Dynamic Wave Mode)
        if (smallCanvas) {
            const ctx = smallCanvas.getContext('2d');
            if (ctx) {
                const parentWidth = smallCanvas.parentElement?.clientWidth || 300;
                if (smallCanvas.width !== parentWidth) {
                    smallCanvas.width = parentWidth;
                }
                
                ctx.clearRect(0, 0, smallCanvas.width, smallCanvas.height);
                
                // Calculate average volume for pulse
                let sum = 0;
                for(let i=0; i<bufferLength; i++) sum += dataArray[i];
                const avg = sum / bufferLength;
                const pulse = avg / 255;

                const centerY = smallCanvas.height / 2;
                const sliceWidth = smallCanvas.width / (bufferLength / 2);
                
                // Draw 3 layers of waves with different offsets and opacities
                const drawWave = (offset: number, opacity: number, scale: number) => {
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = accentColor;
                    ctx.globalAlpha = opacity;
                    
                    // Add glow
                    ctx.shadowBlur = (userSpeaking ? 20 : 10) * pulse;
                    ctx.shadowColor = accentColor;
                    
                    let x = 0;
                    for (let i = 0; i < bufferLength / 2; i++) {
                        const v = dataArray[i] / 128.0;
                        const y = centerY + (v * (smallCanvas.height / 2) * scale * Math.sin(i * 0.2 + time * 0.1 + offset));
                        
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                        x += sliceWidth;
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0; // Reset glow for next layer
                };

                drawWave(0, 0.8, 0.8);
                drawWave(Math.PI / 2, 0.4, 0.6);
                drawWave(Math.PI, 0.2, 0.4);
                
                ctx.globalAlpha = 1.0;
            }
        }
        
        animationFrameRef.current = requestAnimationFrame(renderVisualizer);
    };
    renderVisualizer();

    return () => {
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      window.speechSynthesis.cancel();
      clearSilenceTimer();
      stopScreenSharing(); 
      stopCamera(); 
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed isImmersiveMode dependency to prevent audio context recreation

  // Restart session when immersive mode changes to update voice
  useEffect(() => {
      if (isMicActive) {
          disconnectSession();
          setTimeout(() => handleToggleMicrophone(true), 500);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImmersiveMode]);

  // NEW: Speak Text Function for TTS in Chat
  const speakText = (text: string) => {
    if (!text) return;
    
    // Clean up markdown/code blocks for speech
    let cleanText = text.replace(/<codeblock>[\s\S]*?<\/codeblock>/g, ' Código oculto. ');
    cleanText = cleanText.replace(/```[\s\S]*?```/g, ' Bloco de código. ');
    cleanText = cleanText.replace(/\*/g, ''); // Remove bold/italic markers
    cleanText = cleanText.replace(/<[^>]*>/g, ''); // Remove tags like <highlight>
    
    // Stop previous utterance
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // Slightly slower natural speaking rate
    window.speechSynthesis.speak(utterance);
  };
  
  const handleModelResponse = useCallback(async (responseText: string, isUserCopyRequest: boolean = false) => {
      console.log("handleModelResponse: Processing response:", responseText.substring(0, 100) + "...");
      const codeBlockRegex = /<codeblock>(.*?)<\/codeblock>/s;
      const highlightRegex = /<highlight>([\s\S]*?)<\/highlight>/i;
      const switchAgentRegex = /\[\[SWITCH_AGENT:(.*?)\]\]/i;
      const setUserNameRegex = /\[\[SET_USER_NAME:(.*?)\]\]/i;

      const userNameMatch = responseText.match(setUserNameRegex);
      if (userNameMatch && userNameMatch[1]) {
          const newName = userNameMatch[1].trim();
          setUserPreferredName(newName);
          if (user) {
              const userPath = `users/${user.uid}`;
              try {
                  await setDoc(doc(db, 'users', user.uid), { userPreferredName: newName }, { merge: true });
              } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, userPath);
              }
          }
      }

      const switchMatch = responseText.match(switchAgentRegex);
      if (switchMatch && switchMatch[1]) {
          const agentName = switchMatch[1].trim();
          console.log("Switching agent via text tag:", agentName);
          onSwitchAgentCommand(agentName);
      }

      let modelTextWithoutSwitch = responseText.replace(switchAgentRegex, '').replace(setUserNameRegex, '').trim();

      const highlightMatch = modelTextWithoutSwitch.match(highlightRegex);
      if (highlightMatch && highlightMatch[1]) {
          try {
              let jsonStr = highlightMatch[1].trim();
              jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');
              
              const coords = JSON.parse(jsonStr);
              if (typeof coords.x === 'number' && typeof coords.y === 'number') {
                  if (isScreenSharing || isCameraActive) {
                      const blob = await captureScreenAsBlob();
                      if (blob) {
                          const newImageUrl = await blobToDataURL(blob);
                          setVisualHelp({ image: newImageUrl, highlight: coords });
                      }
                  } else {
                      const lastUserImage = activeMessages.slice().reverse().find(m => m.role === 'user' && m.imageUrl)?.imageUrl;
                      if (lastUserImage) {
                          setVisualHelp({ image: lastUserImage, highlight: coords });
                      }
                  }
              }
          } catch (e) {
              console.error("Failed to parse highlight coordinates:", e);
          }
      }

      let modelTextWithoutHighlight = modelTextWithoutSwitch.replace(highlightRegex, '').trim();
      let explanationText = '';
      let codeText: string | undefined;
      let copyableBlockText: string | undefined; 

      const codeMatch = modelTextWithoutHighlight.match(codeBlockRegex);

      if (codeMatch && codeMatch[1]) {
          codeText = codeMatch[1].trim();
          explanationText = modelTextWithoutHighlight.replace(codeBlockRegex, '').trim();
      } else {
          explanationText = modelTextWithoutHighlight;
      }
      
      if (isUserCopyRequest && !codeText && (explanationText || '').length < 500) {
          copyableBlockText = explanationText;
      }

      const messageId = await addMessage('model', modelTextWithoutHighlight, { 
          blockType: codeText ? 'code' : copyableBlockText ? 'text' : undefined
      });
      
      if (messageId && (explanationText || '').length > TEXT_COMPRESSION_THRESHOLD) {
          generateAndStoreSummary(messageId, explanationText);
      }

      // Update conversation summary for long-term memory after each model response
      generateConversationSummary();
  }, [addMessage, generateAndStoreSummary, generateConversationSummary, activeMessages, isScreenSharing, isCameraActive, captureScreenAsBlob, onSwitchAgentCommand]);
  
  const onModelStartSpeaking = useCallback(() => {
    setIsSpeaking(true);
    startSilenceTimer();
  }, [startSilenceTimer]);

  const onModelStopSpeaking = useCallback((text: string) => {
    setIsSpeaking(false);
    clearSilenceTimer();
    if (lastProcessedResponseRef.current === text) {
        console.log("Duplicate response ignored.");
        return;
    }
    lastProcessedResponseRef.current = text;
    handleModelResponse(text);
  }, [clearSilenceTimer, handleModelResponse]);

  const onUserStopSpeaking = useCallback((text: string) => {
      if (!text.trim()) return;
      lastProcessedResponseRef.current = ''; 
      addMessage('user', text);
      checkAndSaveProgrammingLevel(text);
      shouldAutoScrollRef.current = true; // User spoke, ensure auto-scroll is on

      const lowerText = text.toLowerCase();
      
      // Handle "Pare de ouvir" command to manually disable mic via voice
      if (lowerText.includes('pare de ouvir') || lowerText.includes('parar de ouvir') || lowerText.includes('desligar microfone')) {
          console.log("User requested to stop listening via voice command.");
          handleToggleMicrophone();
          return;
      }

      const visualKeywords = ['print', 'captura', 'foto', 'mostre', 'onde', 'marcar', 'cadê', 'veja'];
      
      if ((isScreenSharing || isCameraActive) && visualKeywords.some(kw => lowerText.includes(kw))) {
         // Placeholder for client-side visual triggers if needed, currently empty as per requirement
      }
  }, [addMessage, checkAndSaveProgrammingLevel, isScreenSharing, isCameraActive]);

  const handleToggleMicrophone = async (skipCheck: boolean | React.SyntheticEvent = false, forceState?: boolean) => {
    const isActuallySkipCheck = typeof skipCheck === 'boolean' ? skipCheck : false;
    const currentlyActive = isMicActiveRef.current;
    const targetState = forceState !== undefined ? forceState : !currentlyActive;

    // If already in target state and not a restart request, do nothing
    if (currentlyActive === targetState && !isActuallySkipCheck) {
        console.log(`Microphone already in target state: ${targetState}. Ignoring toggle.`);
        return;
    }

    // If mic is active and we want to turn it off
    if (currentlyActive && !targetState && !isActuallySkipCheck) {
      console.log("Turning off microphone...");
      // 1. Set State
      setIsMicActive(false);
      isMicActiveRef.current = false;
      
      // 2. Stop Audio Input only
      if (liveSessionControllerRef.current) {
          try {
            liveSessionControllerRef.current?.stopMicInput();
          } catch (e) {
            console.warn("Error stopping mic input:", e);
          }
      }
      
      // 3. Play Feedback
      if (outputAudioContextRef.current) {
        playBeep(outputAudioContextRef.current, 300, 150);
      }
      enviarStatusParaExtensao(false);

    // 4. IMPORTANT: Keep the session open to maintain context, even if mic is off.
    console.log("Mic muted. Session remains open to maintain context.");

    } else if (currentlyActive && isActuallySkipCheck) {
      console.log("Restarting microphone input...");
      // Restart: Just stop and start mic input
      if (liveSessionControllerRef.current) {
          liveSessionControllerRef.current?.stopMicInput();
          try {
            await liveSessionControllerRef.current?.startMic();
          } catch (e) {
            console.error("Failed to restart mic:", e);
            setIsMicActive(false);
            isMicActiveRef.current = false;
          }
      }
    } else if (!currentlyActive && targetState) {
      console.log("Activating microphone and starting session...");
      
      // Automatic screen sharing
      if (!isScreenSharingRef.current && !screenStreamRef.current) {
        startScreenSharing();
      }

      // If mic is inactive and we want to turn it ON
      setIsMicLoading(true);
      setIsMicPermissionDenied(false);
      setIsMicActive(true);
      isMicActiveRef.current = true;
      try {
        // HARD RESET AUDIO CLOCK
        nextStartTimeRef.current = 0;

        // Ensure AudioContexts are healthy.
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        
        const ensureContext = (ref: React.MutableRefObject<AudioContext | null>, sampleRate: number) => {
            if (!ref.current || ref.current.state === 'closed') {
                console.log(`Creating new AudioContext for sampleRate ${sampleRate}`);
                ref.current = new AudioContextClass({ sampleRate });
                return true;
            }
            return false;
        };

        const inputRecreated = ensureContext(inputAudioContextRef, 16000);
        const outputRecreated = ensureContext(outputAudioContextRef, 24000);

        if (outputRecreated && outputAudioContextRef.current) {
            const analyser = outputAudioContextRef.current.createAnalyser();
            analyser.fftSize = 512;
            analyser.connect(outputAudioContextRef.current.destination);
            audioAnalyserRef.current = analyser;
        }
        if (inputRecreated && inputAudioContextRef.current) {
            const analyser = inputAudioContextRef.current.createAnalyser();
            analyser.fftSize = 512;
            inputAudioAnalyserRef.current = analyser;
        }

        if (outputAudioContextRef.current?.state === 'suspended') {
            await outputAudioContextRef.current.resume();
        }
        if (inputAudioContextRef.current?.state === 'suspended') {
            await inputAudioContextRef.current.resume();
        }

        // If session already exists, just resume mic
        if (liveSessionControllerRef.current) {
             console.log("Session exists, resuming microphone input...");
             liveSessionControllerRef.current?.stopPlayback();
             await liveSessionControllerRef.current?.startMic();
             setIsMicLoading(false);
             playBeep(outputAudioContextRef.current, 600, 150); 
             enviarStatusParaExtensao(true);
             return;
        }

        // If no session exists, create a new one
        let agentInstruction = "";
        const customAgent = customAgents.find(a => a.id === activeAgent);
        const systemAgent = SYSTEM_AGENTS.find(a => a.id === activeAgent);
        
        if (customAgent) {
            agentInstruction = `\n\n${customAgent.systemInstruction}`;
        } else if (systemAgent && (systemAgent as any).systemInstruction) {
            agentInstruction = `\n\n${(systemAgent as any).systemInstruction}`;
        }
        
        let finalVoiceName = voiceName;
        if (isImmersiveMode) {
            finalVoiceName = 'Charon'; // ATLAS like voice
            agentInstruction += "\n\nVocê está no modo imersivo. Aja e fale como ATLAS, seu sistema operacional de inteligência artificial. Seja extremamente educado, formal, prestativo e use um tom sofisticado e profissional. Responda de forma concisa e direta, focando na eficiência e no suporte técnico.";
        }

        // FETCH MEMORY CONTEXT FOR LIVE SESSION
        let memoryContext = "";
        if (user?.uid) {
            memoryContext = await searchMemory(user.uid, "contexto geral", 5);
        }

        const controller = await createLiveSession(
            {
                onOpen: () => {
                    setIsMicLoading(false);
                    playBeep(outputAudioContextRef.current, 600, 150); 
                    enviarStatusParaExtensao(true);
                },
                onClose: () => {
                    console.log("Session closed by server/callback");
                    
                    // Clean up reference immediately so we don't try to reuse a dead session
                    liveSessionControllerRef.current = null;

                    // If it was supposed to be active, try to restart
                    if (isMicActiveRef.current) {
                        console.log("Session closed unexpectedly while mic active. Restarting...");
                        setTimeout(() => {
                            if (isMicActiveRef.current) handleToggleMicrophone(false, true);
                        }, 1000);
                    } else {
                        setIsMicActive(false);
                        setIsSessionActive(false);
                        isMicActiveRef.current = false;
                        setIsMicLoading(false);
                        enviarStatusParaExtensao(false);
                    }
                },
                onMicrophoneStopped: () => {
                    console.warn("Microphone stopped unexpectedly, attempting to restart...");
                    setIsMicActive(false);
                    isMicActiveRef.current = false;
                    // Attempt to restart
                    setTimeout(() => handleToggleMicrophone(false, true), 1000);
                },
                onError: (e) => {
                    let errorMsg = "Erro desconhecido na sessão de voz.";
                    
                    if (e instanceof Error) {
                        errorMsg = e.message;
                    } else if (e && typeof e === 'object') {
                        const event = e as any;
                        errorMsg = event.message || event.reason || event.error?.message || String(e);
                        if (errorMsg === '[object ErrorEvent]' || errorMsg === '[object Event]') {
                            errorMsg = "Erro de conexão WebSocket.";
                            if (event.code) errorMsg += ` (Code: ${event.code})`;
                        }
                    } else {
                        errorMsg = String(e);
                    }
                    
                    toast.error(errorMsg);
                    
                    const isAbortedError = errorMsg.includes("The operation was aborted") || errorMsg.includes("AbortError") || errorMsg.includes("GoAway");
                    const isQuotaError = errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("cota") || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");

                    if (!isQuotaError && !isAbortedError) {
                        console.error("Live Session Error Object:", e);
                        console.error("Live Session Error:", errorMsg);
                    } else if (isQuotaError) {
                        console.warn("Gemini Live Session: Quota exceeded or Resource exhausted.");
                    }

                    liveSessionControllerRef.current = null;
                    
                    if (isAbortedError) {
                        setIsMicActive(false);
                        setIsSessionActive(false);
                        isMicActiveRef.current = false;
                        setIsMicLoading(false);
                        enviarStatusParaExtensao(false);
                        return;
                    }
                    
                    // If it's not a quota error and we were supposed to be active, try to restart
                    if (isMicActiveRef.current && !isQuotaError) {
                        console.log("Session error occurred while mic active. Attempting restart in 2s...");
                        setTimeout(() => {
                            if (isMicActiveRef.current) handleToggleMicrophone(false, true);
                        }, 2000);
                    } else {
                        setIsMicActive(false);
                        setIsSessionActive(false);
                        isMicActiveRef.current = false;
                        setIsMicLoading(false);
                        enviarStatusParaExtensao(false);
                        
                        if (isQuotaError) {
                            setErrorMessage("Cota da API Gemini excedida. Aguarde um momento.");
                        } else {
                            setErrorMessage(`Erro na sessão de voz: ${errorMsg}`);
                        }
                    }
                },
                onInputTranscriptionUpdate: (text) => {
                    setCurrentInputTranscription(text);
                    // If we have a full sentence or a pause, we could call onUserStopSpeaking
                    // But for now, we'll wait for turnComplete or a specific logic
                },
                onOutputTranscriptionUpdate: (text) => {
                    setCurrentOutputTranscription(prev => prev + text);
                },
                onModelStartSpeaking: onModelStartSpeaking,
                onModelStopSpeaking: onModelStopSpeaking,
                onUserStopSpeaking: onUserStopSpeaking,
                onTurnComplete: () => {
                    // When a turn is complete, we can finalize the transcriptions
                    if (currentOutputTranscriptionRef.current) {
                        onModelStopSpeaking(currentOutputTranscriptionRef.current);
                        setCurrentOutputTranscription('');
                    }
                    if (currentInputTranscriptionRef.current) {
                        onUserStopSpeaking(currentInputTranscriptionRef.current);
                        setCurrentInputTranscription('');
                    }
                },
                onInterrupt: () => { setIsSpeaking(false); clearSilenceTimer(); },
                
                // Call disconnectSession for explicit command, but ensure it handles partial shutdown if needed
                // Removed onDeactivateMicrophoneCommand as it is no longer supported by the service
                onDeactivateScreenSharingCommand: async () => {
                    stopScreenSharing();
                    return { success: true, isScreenSharingActive: false, message: "Screen sharing deactivated successfully." };
                },
                onActivateScreenSharingCommand: async () => {
                    const success = await startScreenSharing();
                    if (success) {
                        return { success: true, isScreenSharingActive: true, message: "Screen sharing activated successfully and streaming now." };
                    } else {
                        return { success: false, isScreenSharingActive: false, error: "Screen sharing could not be started because permission was denied or browser iframe blocks display capture. User must open the app in a new tab out of the iframe." };
                    }
                },
                onActivateCameraCommand: async () => {
                    const success = await startCamera();
                    if (success) {
                        return { success: true, isCameraActive: true, message: "Camera feed activated successfully and streaming now." };
                    } else {
                        return { success: false, isCameraActive: false, error: "Camera could not be started. Check permissions or availability." };
                    }
                },
                onDeactivateCameraCommand: async () => {
                    stopCamera();
                    return { success: true, isCameraActive: false, message: "Camera feed deactivated successfully." };
                },
                onSwitchAgentCommand: async (agentName: string) => {
                    onSwitchAgentCommand(agentName);
                    return { success: true, activeAgent: agentName, message: `Successfully switched to specialized agent: ${agentName}` };
                },
                onSystemCommand: async (command, args) => {
                    const res = await handleSystemCommand(command, args);
                    if (res.success) {
                        if (command === 'playMusicOnYouTube' && res.videoId) {
                             addMessage('system', res.message, { 
                                 youtubeVideoId: res.videoId,
                                 youtubeTitle: res.data?.title,
                                 youtubeChannel: res.data?.channelName
                             });
                        } else if (res.url) {
                             addMessage('system', res.message);
                        } else if (res.message) {
                             addMessage('system', res.message);
                        }
                    }
                    return res;
                },
                onSearchPastConversationsCommand: handleSearchPastConversationsCommand,
                onSearchMemoryCommand: handleSearchMemoryCommand,
                onSaveImportantMemoryCommand: handleSaveImportantMemoryCommand,
                onStopAlarmCommand: async () => {
                    handleStopAlarmCommand();
                    return { success: true, message: "Alarm stopped successfully." };
                },
                onOpenWebsiteCommand: (url: string) => window.open(url, '_blank'),
                onCloseWebsiteCommand: () => setBrowserPiPInfo(prev => ({ ...prev, isVisible: false })),
                onUpdateUserPreferencesCommand: handleUpdateUserPreferencesCommand,
                onSessionReady: (session) => { /* Ready */ },
                onVoiceActivityChange: (isActive: boolean) => {},
                onVoiceStateChange: (state) => setVoiceState(state)
            },
            inputAudioContextRef.current!,
            outputAudioContextRef.current!,
            nextStartTimeRef,
            micStreamRef,
            audioAnalyserRef.current, // Pass the output analyser
            inputAudioAnalyserRef.current, // Pass the input analyser
            activeMessages, 
            activeAgent,
            isScreenSharing || isCameraActive,
            initialUserData.programmingLevel,
            agentInstruction,
            finalVoiceName,
            isSummarizedMode,
            assistantCustomName,
            userPreferredName,
            activeConversation?.summary,
            memoryContext
        );

        liveSessionControllerRef.current = controller;
        setIsMicActive(true);
        setIsSessionActive(true);
        console.log("Controller assigned:", controller);
        
        // Request permission and start mic via controller
        await controller.startMic();

      } catch (error: any) {
          console.error("Failed to start session/microphone:", error);
          const isAborted = error.name === 'AbortError' || error.message?.includes('aborted');
          const isPermissionDenied = error.name === 'NotAllowedError' || error.message?.includes('Permission denied');
          
          if (isAborted) {
              console.log("Microphone access aborted by user or system.");
          } else if (isPermissionDenied) {
              setIsMicPermissionDenied(true);
              setErrorMessage("Permissão de microfone negada pelo navegador.");
          } else {
              setErrorMessage(`Não foi possível acessar o microfone. Detalhes: ${error?.message || error?.name || error}`);
          }
          setIsMicLoading(false);
          setIsMicActive(false);
          isMicActiveRef.current = false;
      }
    }
  };

  useEffect(() => { handleToggleMicrophoneRef.current = handleToggleMicrophone; }, [handleToggleMicrophone]);

  const handleSend = useCallback(async (overrideText?: string | React.MouseEvent) => {
      const fileInput = attachmentFileInputRef.current;
      const hasFile = fileInput && fileInput.files && fileInput.files[0];
      
      const actualText = typeof overrideText === 'string' ? overrideText : undefined;
      const messageText = actualText !== undefined ? actualText : textInput;
      
      if (!messageText.trim() && !hasFile && !isSendingText) return;
      if (isSendingText) return;

      setIsSendingText(true);
      if (actualText === undefined) {
          setTextInput('');
      }
      shouldAutoScrollRef.current = true; // Force scroll to bottom on send
      
      window.speechSynthesis.cancel(); // Stop current speech if typing

      // Ensure we have a conversation
      let currentConvoId = activeConversationId;
      if (!currentConvoId) {
          const conversationsPath = 'conversations';
          try {
              const newConvoRef = await addDoc(collection(db, conversationsPath), {
                  uid: user.uid,
                  title: messageText.substring(0, 30) || "Nova Conversa",
                  createdAt: serverTimestamp(),
                  isArchived: false,
              });
              currentConvoId = newConvoRef.id;
              setActiveConversationId(currentConvoId);
          } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, conversationsPath);
              setIsSendingText(false);
              return;
          }
      }

      if (messageText.trim()) {
          await addMessage('user', messageText);
          checkAndSaveProgrammingLevel(messageText);
      }

      let fileData = undefined;
      if (fileInput && fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          try {
              const base64 = await blobToBase64(file);
              fileData = { base64, mimeType: file.type };
              await addMessage('user', 'Enviou uma imagem.', { imageUrl: `data:${file.type};base64,${base64}` });
          } catch (e) {
              console.error("File read error:", e);
          }
          fileInput.value = ''; 
      }

      if (!fileData && (isScreenSharing || isCameraActive)) {
          const blob = await captureScreenAsBlob();
          if (blob) {
               const base64 = await blobToBase64(blob);
               fileData = { base64, mimeType: 'image/jpeg' };
          }
      }
      
      try {
          let agentInstruction = "";
          const customAgent = customAgents.find(a => a.id === activeAgent);
          const systemAgent = SYSTEM_AGENTS.find(a => a.id === activeAgent);
          
          if (customAgent) agentInstruction = customAgent.systemInstruction;
          else if (systemAgent && (systemAgent as any).systemInstruction) agentInstruction = (systemAgent as any).systemInstruction;
          
          console.log("handleSend: Sending message:", messageText, "with history:", activeMessages.length, "messages");
          
          // FETCH MEMORY CONTEXT
          let memoryContext = "";
          if (user?.uid) {
              memoryContext = await searchMemory(user.uid, messageText || "contexto geral", 3);
          }

          const result = await sendTextMessage(
              messageText || "Analise o que vê.", 
              activeMessages, 
              activeAgent, 
              fileData, 
              isScreenSharing || isCameraActive,
              initialUserData.programmingLevel,
              agentInstruction,
              isSummarizedMode,
              assistantCustomName,
              userPreferredName,
              activeConversation?.summary,
              memoryContext,
              isJarvisMode,
              isLowLatency,
              isElevatedThinking
          );
          console.log("handleSend: Received result:", result);
          
          if (result && result.functionCalls) {
              for (const fc of result.functionCalls) {
                  if (fc.name === 'switchActiveAgent') {
                      onSwitchAgentCommand((fc.args as any).agentName);
                  } else if (fc.name === 'searchPastConversations') {
                      const res = await handleSearchPastConversationsCommand((fc.args as any).query, (fc.args as any).limit);
                      addMessage('system', res.result || res.error);
                  } else if (fc.name === 'searchMemory') {
                      const res = await handleSearchMemoryCommand((fc.args as any).query, (fc.args as any).limit);
                      addMessage('system', res.result || res.error);
                  } else if (fc.name === 'saveImportantMemory') {
                      const res = await handleSaveImportantMemoryCommand((fc.args as any).info);
                      addMessage('system', res.result || res.error);
                  } else if (fc.name === 'openWebsite') {
                      window.open((fc.args as any).url, '_blank');
                      addMessage('system', `Abrindo ${(fc.args as any).siteName || 'site'}...`);
                  } else if (fc.name === 'playMusicOnYouTube' || fc.name === 'searchOnYouTube' || fc.name === 'openYouTube' || fc.name === 'searchOnGoogle' || fc.name === 'openDashboard' || fc.name === 'openFocoCore' || fc.name === 'openFocoFlow' || fc.name === 'createNote') {
                      const res = await handleSystemCommand(fc.name, fc.args);
                      if (res.success) {
                          if (fc.name === 'playMusicOnYouTube' && res.videoId) {
                              addMessage('system', res.message, { 
                                  youtubeVideoId: res.videoId,
                                  youtubeTitle: res.data?.title,
                                  youtubeChannel: res.data?.channelName
                              });

                          } else if (res.url) {
                              const videoIdFromUrl = extractYouTubeVideoId(res.url);
                              if (videoIdFromUrl) {
                                  addMessage('system', res.message, { 
                                      youtubeVideoId: videoIdFromUrl,
                                      youtubeTitle: res.data?.title,
                                      youtubeChannel: res.data?.channelName
                                  });
                              } else {
                                  addMessage('system', res.message);
                              }
                          } else {
                              addMessage('system', res.message || "Ação concluída.");
                          }
                      } else {
                          setErrorMessage(res.error || "Erro ao executar comando.");
                      }
                  }
              }
          }

          if (result && result.groundingMetadata) {
              const chunks = result.groundingMetadata.groundingChunks;
              if (chunks && chunks.length > 0) {
                  const urls = chunks
                      .filter((c: any) => c.web && c.web.uri)
                      .map((c: any) => `• [${c.web.title || 'Fonte'}](${c.web.uri})`);
                  
                  if (urls.length > 0) {
                      addMessage('system', `Fontes da busca:\n${urls.join('\n')}`);
                  }
              }
          }

          if (result && (result.text || result.functionCalls)) {
              await handleModelResponse(result.text || "Comando processado.", messageText.toLowerCase().includes("copie") || messageText.toLowerCase().includes("copy"));
              
              if (isTextToSpeechEnabled && result.text) {
                  speakText(result.text);
              }

              const inputLen = (messageText || "").length + (fileData ? 1000 : 0);
              const outputLen = (result.text || '').length;
              updateUsage(
                  Math.ceil(inputLen / 4) + Math.ceil(outputLen / 4), 
                  (inputLen / 4 * COST_PER_INPUT_TOKEN) + (outputLen / 4 * COST_PER_OUTPUT_TOKEN)
              );
          }
      } catch (e: any) {
          console.error("Text Gen Error:", e);
          let errText = e.message || String(e);
          
          // Enhanced error parsing for 429/Quota issues
          try {
             if (typeof errText === 'string' && errText.includes('{"error":')) {
                 const parsed = JSON.parse(errText);
                 if(parsed.error?.status === 'RESOURCE_EXHAUSTED' || parsed.error?.code === 429) {
                     errText = "Limite de uso atingido (Cota esgotada). Por favor, aguarde alguns segundos e tente novamente.";
                 } else if (parsed.error?.message) {
                     errText = parsed.error.message;
                 }
             }
          } catch(parseErr) { /* ignore parsing errors */ }

          if(errText.includes("RESOURCE_EXHAUSTED") || errText.includes("429") || errText.toLowerCase().includes("quota") || errText.toLowerCase().includes("cota")) {
               errText = "Limite de requisições excedido temporariamente (Cota esgotada). Aguarde alguns segundos.";
          }

          setErrorMessage(`Erro ao enviar mensagem: ${errText}`);
      } finally {
          setIsSendingText(false);
      }
  }, [
      attachmentFileInputRef, 
      textInput, 
      isSendingText, 
      activeConversationId, 
      user, 
      db, 
      activeMessages, 
      activeAgent, 
      customAgents, 
      initialUserData, 
      isSummarizedMode, 
      assistantCustomName, 
      userPreferredName, 
      activeConversation,
      addMessage,
      checkAndSaveProgrammingLevel,
      onSwitchAgentCommand,
      handleSearchPastConversationsCommand,
      handleSystemCommand,
      isScreenSharing,
      isCameraActive,
      isTextToSpeechEnabled,
      speakText,
      updateUsage
  ]);

  const handleToggleTextToSpeech = async () => {
      const newState = !isTextToSpeechEnabled;
      setIsTextToSpeechEnabled(newState);
      // Cancel current speech if turning off
      if (!newState) {
          window.speechSynthesis.cancel();
      }
      try {
          const userPath = `users/${user.uid}`;
          await setDoc(doc(db, 'users', user.uid), { textToSpeechEnabled: newState }, { merge: true });
      } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
  };


  return (
    <div className={`flex h-[100dvh] w-full ${customBackground || activeCustomThemeId ? 'bg-transparent' : 'bg-[var(--bg-primary)]'} text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'theme-light' : ''}`}>
      {youTubePiPInfo.isVisible && youTubePiPInfo.videoId && (
          <YouTubePiP 
            videoId={youTubePiPInfo.videoId} 
            title={youTubePiPInfo.title} 
            onClose={() => setYouTubePiPInfo({...youTubePiPInfo, isVisible: false})} 
          />
      )}
      {browserPiPInfo.isVisible && (
          <BrowserPiP 
            url={browserPiPInfo.url} 
            title={browserPiPInfo.title} 
            isVisible={browserPiPInfo.isVisible}
            onClose={() => setBrowserPiPInfo({...browserPiPInfo, isVisible: false})} 
          />
      )}
      <canvas ref={canvasRef} className="hidden" />
      {/* Master Video for Vision Processing - must be somewhat visible and have dimensions for tracks to stay active */}
      <video 
        ref={visionVideoRef} 
        style={{ 
            width: '320px', 
            height: '240px', 
            position: 'fixed', 
            left: '-10000px', 
            top: '-10000px', 
            opacity: 0.01, 
            pointerEvents: 'none',
            zIndex: -1
        }} 
        playsInline 
        muted 
      />
      
      {/* Sidebar Overlay/Aside */}
      <aside className={`
         ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
         fixed inset-y-0 left-0 z-[210] transition-transform duration-300 ease-out
      `}>
          <Sidebar 
            conversations={allConversations}
            activeConversationId={activeConversationId}
            activeId={activeSidebarId}
            onClose={() => setIsSidebarOpen(false)}
            onNewConversation={() => {
                handleNewChat();
                setIsSidebarOpen(false);
            }}
            onSelectConversation={(id) => {
                setActiveConversationId(id);
                setIsSidebarOpen(false);
            }}
            onNavItemClick={(id) => {
              if (id === 'settings') {
                  setIsSettingsModalOpen(true);
              } else {
                  setActiveSidebarId(id);
              }
              setIsSidebarOpen(false);
            }}
            onSelectAgent={handleActivateAgent}
            assistantName={assistantCustomName || "ATLAS"}
            agents={[...SYSTEM_AGENTS.filter(a => a.id !== 'default'), ...customAgents]}
            activeAgentId={activeAgent}
          />
      </aside>

      {/* Overlay when open */}
      {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-[200]" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content Area - Only ImmersiveHUD */}
      <main className="flex-1 h-screen flex flex-col relative z-10 overflow-hidden">
          <ImmersiveHUD 
              assistantName={assistantCustomName || "ATLAS"}
              isMicActive={isMicActive}
              isMicLoading={isMicLoading}
              isMicPermissionDenied={isMicPermissionDenied}
              isCameraActive={isCameraActive}
              isScreenSharing={isScreenSharing}
              isThinking={voiceState === 'PROCESSANDO'}
              isSpeaking={voiceState === 'FALANDO'}
              onMicToggle={handleToggleMicrophone}
              onCameraToggle={isCameraActive ? stopCamera : startCamera}
              onScreenToggle={isScreenSharing ? stopScreenSharing : startScreenSharing}
              onSettingsClick={() => setIsSettingsModalOpen(true)}
              onFocoFlowClick={() => setIsFocoFlowDashboardOpen(true)}
              onCardShowToggle={() => setIsAgentsModalOpen(true)}
              onBluetoothConnect={handleBluetoothConnect}
              onRealBluetoothConnect={handleRealBluetoothConnect}
              onExit={handleLogout}
              lastAssistantMessage={activeMessages.filter(m => m.role === 'model').slice(-1)[0]?.text}
              audioAnalyserRef={audioAnalyserRef}
              inputAudioAnalyserRef={inputAudioAnalyserRef}
              onMenuClick={() => setIsSidebarOpen(true)}
              activeAgentName={activeAgentData?.name}
              activeAgentId={activeAgent}
              videoRef={hudVideoRef}
          />
      </main>

      <AnimatePresence>
      </AnimatePresence>

      <AgentTransition 
        isVisible={isAgentTransitioning} 
        agentName={activeAgentData?.name || 'Agente'} 
        agentId={activeAgent} 
        emoji={(activeAgentData as any)?.emoji}
      />
      <VisualHelpModal data={visualHelp} onClose={() => setVisualHelp(null)} />
      
      <ConfirmationModal 
          isOpen={!!chatToDelete} 
          onClose={() => setChatToDelete(null)}
          onConfirm={handleDeleteConversation}
          title="Excluir Conversa"
          message="Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita."
      />

      <ConfirmationModal 
          isOpen={!!agentToDelete} 
          onClose={() => setAgentToDelete(null)}
          onConfirm={confirmDeleteAgent}
          title="Excluir Agente"
          message="Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita."
      />
      
      <NotificationsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          notifications={notifications}
      />
      <Toaster position="top-right" theme={theme === 'light' ? 'light' : 'dark'} richColors />
      
      <SpecialistSidebar 
        isOpen={isAgentsModalOpen}
        onClose={() => setIsAgentsModalOpen(false)}
        activeAgentId={activeAgent}
        onSelectAgent={handleActivateAgent}
        customAgents={customAgents}
        onOpenCreateAgent={() => {
            setIsAgentsModalOpen(false);
            setIsAgentsManagerOpen(true);
        }}
      />

      <FocoFlowDashboard
        isOpen={isFocoFlowDashboardOpen}
        onClose={() => setIsFocoFlowDashboardOpen(false)}
        userId={user.uid}
      />
      
      <AgentsModal
          isOpen={isAgentsManagerOpen}
          onClose={() => setIsAgentsManagerOpen(false)}
          onActivate={handleActivateAgent}
          onDeactivate={handleDeactivateAgent}
          activeAgent={activeAgent}
          customAgents={customAgents}
          onCreateAgent={handleCreateCustomAgent}
          onUpdateAgent={handleUpdateCustomAgent}
          onDeleteAgent={(id) => setAgentToDelete(id)}
      />

      <ArchivedConversationsModal
          isOpen={isArchivedModalOpen}
          onClose={() => setIsArchivedModalOpen(false)}
          archivedConversations={archivedConversations}
          onRestoreConversation={handleRestoreConversation}
      />

      <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          user={user}
          assistantCustomName={assistantCustomName}
          setAssistantCustomName={setAssistantCustomName}
          userPreferredName={userPreferredName}
          setUserPreferredName={setUserPreferredName}
          theme={theme}
          setTheme={setTheme}
          tempColor={tempColor}
          setTempColor={setTempColor}
          setCustomThemeColor={setCustomThemeColor}
          onApplyTheme={onApplyTheme}
          onBluetoothConnect={handleBluetoothConnect}
          onRealBluetoothConnect={handleRealBluetoothConnect}
          availableAudioOutputs={availableAudioOutputs}
          onSelectAudioOutput={handleSelectAudioOutput}

          onOpenArchived={() => { setIsSettingsModalOpen(false); setIsArchivedModalOpen(true); }}
          customThemes={customThemes}
          setCustomThemes={setCustomThemes}
          activeCustomThemeId={activeCustomThemeId}
          setActiveCustomThemeId={setActiveCustomThemeId}
          customBackground={customBackground}
          setCustomBackground={setCustomBackground}
          bgOpacity={bgOpacity}
          setBgOpacity={setBgOpacity}
          isJarvisMode={isJarvisMode}
          setIsJarvisMode={handleToggleJarvisMode}
          isLowLatency={isLowLatency}
          setIsLowLatency={setIsLowLatency}
          isElevatedThinking={isElevatedThinking}
          setIsElevatedThinking={setIsElevatedThinking}
      />
       {/* Admin / Atlas Monitoring Dashboard */}
       {isAdminDashboardOpen && (
           <div className="fixed inset-0 z-[500] bg-black">
               <AdminDashboard 
                   currentUserEmail={user?.email || null} 
                   onBack={() => setIsAdminDashboardOpen(false)} 
               />
           </div>
       )}

    </div>
  );
};

export default App;