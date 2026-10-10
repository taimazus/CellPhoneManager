import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  PhoneOff,
  MessageSquare, 
  Users, 
  UserPlus, 
  Search, 
  Send, 
  Trash2, 
  Edit3, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Mail, 
  FileText, 
  Delete, 
  X, 
  Filter, 
  Plus, 
  Smartphone,
  CheckCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Hash,
  Play,
  ArrowUpDown,
  CheckSquare,
  Square,
  ListChecks,
  GitMerge,
  Image as ImageIcon,
  MapPin,
  Cake,
  Globe,
  Briefcase,
  Tag,
  UploadCloud,
  Bookmark,
  Building,
  PhoneForwarded,
  Smile,
  ShieldAlert,
  CreditCard,
  Ban,
  Inbox,
  FileEdit,
  Copy,
  Check,
  Bluetooth,
  Headphones,
  Settings,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { Device } from '../types';
import { safeFetchJson } from '../utils/api';
import { LoadingSpinner, ActionOverlay } from './LoadingSpinner';
import { PaginationBar } from './PaginationBar';

export interface MessagesNavigationTarget {
  subTab?: 'calls' | 'contacts' | 'sms';
  searchQuery?: string;
  filter?: string;
  targetItemKey?: string;
  sender?: string;
  text?: string;
}

interface MessagesTabProps {
  device: Device | null;
  navigationTarget?: MessagesNavigationTarget | null;
  onClearNavigationTarget?: () => void;
}

interface Contact {
  id: string;
  rawContactId?: string;
  contactId?: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  notes?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  birthday?: string;
  website?: string;
  nickname?: string;
  relationship?: string;
  avatar?: string;
  accountName?: string;
  accountType?: string;
  sourceKey?: string;
  sourceLabel?: string;
  sourceIcon?: string;
}

interface CallLog {
  id: string;
  name: string;
  number: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'rejected';
  duration: string;
  timestamp: string;
  date?: string;
}

interface SmsMessage {
  id: string;
  threadId: string;
  sender: string;
  number: string;
  body: string;
  timestamp: string;
  type: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed';
  read?: boolean;
  isBank?: boolean;
  isOtp?: boolean;
  isSpam?: boolean;
  isBlocked?: boolean;
}

interface CallState {
  state: 'idle' | 'ringing' | 'offhook';
  incomingNumber: string;
  isRinging: boolean;
  isInCall: boolean;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({ device, navigationTarget, onClearNavigationTarget }) => {
  const isIos = device?.platform === 'ios' || device?.model?.toLowerCase().includes('iphone');
  const [subTab, setSubTab] = useState<'calls' | 'contacts' | 'sms'>('calls');
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  // --- Live Call Telephony State ---
  const [callState, setCallState] = useState<CallState>({
    state: 'idle',
    incomingNumber: '',
    isRinging: false,
    isInCall: false
  });
  const [callTimerSeconds, setCallTimerSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(false);
  const [selectedQuickSms, setSelectedQuickSms] = useState<string>('سلام، در جلسه هستم. بعداً تماس می‌گیرم.');
  const [showDtmfKeypad, setShowDtmfKeypad] = useState<boolean>(false);

  // --- Calls State ---
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [callFilter, setCallFilter] = useState<'all' | 'incoming' | 'outgoing' | 'missed'>('all');
  const [dialNumber, setDialNumber] = useState<string>('');
  const [callAudioMode, setCallAudioMode] = useState<'speaker' | 'bluetooth' | 'default'>('speaker');
  const [showBluetoothModal, setShowBluetoothModal] = useState<boolean>(false);
  const [bluetoothInfo, setBluetoothInfo] = useState<{
    loading: boolean;
    pc?: { available: boolean; hasAdapter: boolean; adapters: string[]; pairedDevices: any[]; message?: string };
    device?: { available: boolean; enabled: boolean; name: string; address: string; state: string };
  }>({ loading: false });
  const [autoPairingLoading, setAutoPairingLoading] = useState<boolean>(false);
  const [showDialerContactModal, setShowDialerContactModal] = useState<boolean>(false);
  const [dialerContactSearch, setDialerContactSearch] = useState<string>('');
  const [dialerContactName, setDialerContactName] = useState<string>('');
  const [dialerContactSourceFilter, setDialerContactSourceFilter] = useState<string>('all');

  // --- Contacts State ---
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState<string>('');
  const [contactSourceFilter, setContactSourceFilter] = useState<string>('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isContactSelectMode, setIsContactSelectMode] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactModalTab, setContactModalTab] = useState<'basic' | 'work' | 'personal'>('basic');
  const [contactPage, setContactPage] = useState<number>(1);
  const [contactPageSize, setContactPageSize] = useState<number>(60);
  const [callPage, setCallPage] = useState<number>(1);
  const [callPageSize, setCallPageSize] = useState<number>(50);
  const [actionProgress, setActionProgress] = useState<{
    active: boolean;
    title?: string;
    subtitle?: string;
    variant?: 'gold' | 'cyan' | 'purple' | 'emerald';
  }>({ active: false });
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    company: '',
    jobTitle: '',
    address: '',
    birthday: '',
    website: '',
    nickname: '',
    relationship: 'همکار',
    avatar: '',
    notes: '',
    accountType: ''
  });

  // --- SMS State ---
  const [smsList, setSmsList] = useState<SmsMessage[]>([]);
  const [smsSearch, setSmsSearch] = useState<string>('');
  const [smsCategoryFilter, setSmsCategoryFilter] = useState<'all' | 'inbox' | 'sent' | 'banking' | 'spam' | 'blocked' | 'drafts'>('all');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newSmsText, setNewSmsText] = useState<string>('');
  const [newSmsRecipient, setNewSmsRecipient] = useState<string>('');
  const [showNewSmsModal, setShowNewSmsModal] = useState<boolean>(false);
  const [selectedSmsThreads, setSelectedSmsThreads] = useState<string[]>([]);
  const [isSmsSelectMode, setIsSmsSelectMode] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // --- Sorting States ---
  const [callSort, setCallSort] = useState<'date_desc' | 'date_asc' | 'duration_desc' | 'name_asc'>('date_desc');
  const [contactSort, setContactSort] = useState<'name_asc' | 'name_desc' | 'phone_asc' | 'source_asc'>('name_asc');
  const [smsSort, setSmsSort] = useState<'date_desc' | 'date_asc'>('date_desc');

  // --- Dual SIM & USSD State ---
  const [preferredSim, setPreferredSim] = useState<number>(() => {
    if (!device) return 0;
    const saved = localStorage.getItem(`cpm_sim_pref_${device.id}`);
    return saved !== null ? parseInt(saved, 10) : 0; // 0 = SIM 1, 1 = SIM 2, -1 = System Default
  });
  const [ussdCode, setUssdCode] = useState<string>('');
  const [ussdDialog, setUssdDialog] = useState<{
    active: boolean;
    title?: string;
    message?: string;
    hasInput?: boolean;
    buttons?: string[];
  } | null>(null);
  const [ussdReplyText, setUssdReplyText] = useState<string>('');
  const [ussdLoading, setUssdLoading] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const prevWasInCallRef = useRef<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSetPreferredSim = async (slot: number) => {
    setPreferredSim(slot);
    if (device) {
      localStorage.setItem(`cpm_sim_pref_${device.id}`, String(slot));
      await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/telephony/default-sim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceSlot: slot, smsSlot: slot })
      });
      showToast(slot === -1 ? 'سیم‌کارت پیش‌فرض بر روی حالت خودکار سیستم قرار گرفت' : `سیم‌کارت ${slot + 1} به عنوان سیم‌کارت پیش‌فرض این گوشی ذخیره شد`, 'success');
    }
  };

  const handleCheckUssdDialog = async () => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/ussd/dialog`);
      if (data && data.dialog && data.dialog.active) {
        setUssdDialog(data.dialog);
        showToast('پاسخ پیام USSD از روی گوشی دریافت شد', 'success');
      } else {
        showToast('در حال حاضر پیامی روی صفحه گوشی یافت نشد', 'error');
      }
    } catch (err: any) {
      showToast(`خطا در بازخوانی پیام: ${err.message}`, 'error');
    }
  };

  const handleRunUssd = async (codeToRun?: string) => {
    if (!device) return;
    const code = codeToRun || ussdCode;
    if (!code || !code.trim()) {
      showToast('لطفاً کد دستوری USSD را وارد کنید (مثلاً *100# یا *555#)', 'error');
      return;
    }
    setUssdLoading(true);
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/ussd/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), simSlot: preferredSim })
      });
      if (data.success) {
        showToast(data.message || `کد دستوری ${code} با موفقیت ارسال شد`, 'success');
        if (data.dialog && data.dialog.active) {
          setUssdDialog(data.dialog);
        } else {
          // Poll once more after 2.5 seconds in case operator took longer
          setTimeout(async () => {
            try {
              const checkData = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/ussd/dialog`);
              if (checkData && checkData.dialog && checkData.dialog.active) {
                setUssdDialog(checkData.dialog);
              }
            } catch {
              // quiet
            } finally {
              setUssdLoading(false);
            }
          }, 2500);
          return;
        }
      } else {
        showToast(`خطا: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setUssdLoading(false);
    }
  };

  const handleReplyUssd = async () => {
    if (!device || !ussdReplyText.trim()) return;
    setUssdLoading(true);
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/ussd/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ussdReplyText.trim() })
      });
      if (data && data.dialog) {
        setUssdDialog(data.dialog);
        setUssdReplyText('');
        showToast('پاسخ ارسال شد و منوی بعدی دریافت گردید', 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setUssdLoading(false);
    }
  };

  const handleDismissUssd = async () => {
    if (!device) return;
    try {
      await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/ussd/dismiss`, { method: 'POST' });
      setUssdDialog(null);
      showToast('پیام USSD بسته شد', 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // --- 0. Poll Call State (Adaptive: 1s during active call/ringing, 2.5s idle) ---
  const pollCallState = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/calls/state`);
      const data = await res.json();
      if (data && data.state) {
        const isNowInCall = Boolean(data.isInCall || data.state === 'offhook');
        const isNowRinging = Boolean(data.isRinging || data.state === 'ringing');

        // Automatically detect call end / hangup on mobile:
        if (prevWasInCallRef.current && !isNowInCall && !isNowRinging) {
          fetchCalls(); // Immediately refresh call logs so finished call appears
          showToast('تماس به پایان رسید', 'info');
        }
        prevWasInCallRef.current = isNowInCall;

        setCallState(prev => ({
          state: data.state,
          incomingNumber: data.incomingNumber || (isNowInCall ? (prev.incomingNumber || 'تماس فعال') : ''),
          isRinging: isNowRinging,
          isInCall: isNowInCall
        }));
      }
    } catch {
      // ignore polling errors quietly
    }
  };

  useEffect(() => {
    if (!device) return;
    pollCallState();
    // Fast 1000ms polling when call is in progress or ringing so call end is caught instantly
    const intervalMs = (callState.isInCall || callState.isRinging) ? 1000 : 2500;
    const interval = setInterval(pollCallState, intervalMs);
    return () => clearInterval(interval);
  }, [device?.id, callState.isInCall, callState.isRinging]);

  // Handle in-call timer
  useEffect(() => {
    if (callState.isInCall) {
      timerRef.current = setInterval(() => {
        setCallTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallTimerSeconds(0);
      setIsMuted(false);
      setIsSpeaker(false);
    }
    return () => clearInterval(timerRef.current);
  }, [callState.isInCall]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Fetch Calls
  const fetchCalls = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/calls`);
      const data = await res.json();
      if (data && data.calls && Array.isArray(data.calls)) {
        setCallLogs(data.calls);
      }
    } catch (err: any) {
      showToast(`خطا در دریافت لاگ تماس: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Contacts
  const fetchContacts = async (showOverlay = false) => {
    if (!device) return;
    setLoading(true);
    if (showOverlay) {
      setActionProgress({
        active: true,
        title: 'در حال بارگذاری و تحلیل دفترچه مخاطبین...',
        subtitle: 'استخراج داده‌های سیم‌کارت، حافظه دستگاه و حساب‌های ابری',
        variant: 'cyan'
      });
    }
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/contacts`);
      const data = await res.json();
      if (data && data.contacts && Array.isArray(data.contacts)) {
        setContacts(data.contacts);
      }
    } catch (err: any) {
      showToast(`خطا در دریافت مخاطبین: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setActionProgress({ active: false });
    }
  };

  const pendingNavTargetRef = useRef<MessagesNavigationTarget | null>(null);

  const resolveSmsThread = (messages: SmsMessage[], target: MessagesNavigationTarget): boolean => {
    if (!messages || messages.length === 0) return false;

    const rawTargetId = target.targetItemKey ? String(target.targetItemKey).replace(/^(?:db_)?sms_/, '') : '';
    const cleanDigits = (s?: string) => (s ? s.replace(/[^\d]/g, '') : '');
    const targetDigits = cleanDigits(target.searchQuery || target.sender);
    const targetSender = (target.sender || target.searchQuery || '').trim().toLowerCase();
    const targetBodySnippet = (target.text || '').trim().slice(0, 35).toLowerCase();

    // 1. Direct ID / threadId match
    let matchedMsg = messages.find(m => {
      const idStr = String(m.id || '');
      const threadStr = String(m.threadId || '');
      return Boolean(rawTargetId && (idStr === rawTargetId || threadStr === rawTargetId));
    });

    // 2. Phone number match (matching last 7 digits)
    if (!matchedMsg && targetDigits.length >= 7) {
      const last7 = targetDigits.slice(-7);
      matchedMsg = messages.find(m => {
        const mDigits = cleanDigits(m.number);
        return mDigits.endsWith(last7) || (mDigits.length >= 7 && targetDigits.endsWith(mDigits.slice(-7)));
      });
    }

    // 3. Sender / Name match
    if (!matchedMsg && targetSender) {
      matchedMsg = messages.find(m => {
        const s = (m.sender || '').toLowerCase();
        const n = (m.number || '').toLowerCase();
        return (s && s.includes(targetSender)) || (n && n.includes(targetSender)) || (targetSender.includes(s) && s.length > 2);
      });
    }

    // 4. Message text snippet match
    if (!matchedMsg && targetBodySnippet) {
      matchedMsg = messages.find(m => m.body && m.body.toLowerCase().includes(targetBodySnippet));
    }

    if (matchedMsg) {
      const targetThreadKey = matchedMsg.threadId || matchedMsg.number;
      setSelectedThread(targetThreadKey);
      setHighlightedKey(String(matchedMsg.id));
      setSmsCategoryFilter('all');
      setSmsSearch(''); // Clear search filter so conversation list shows the thread
      return true;
    }

    return false;
  };

  // 3. Fetch SMS
  const fetchSms = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/sms`);
      const data = await res.json();
      if (data && data.messages && Array.isArray(data.messages)) {
        setSmsList(data.messages);
        if (pendingNavTargetRef.current) {
          const resolved = resolveSmsThread(data.messages, pendingNavTargetRef.current);
          if (resolved) {
            pendingNavTargetRef.current = null;
          }
        } else if (!selectedThread && data.messages.length > 0) {
          setSelectedThread(data.messages[0].threadId || data.messages[0].number);
        }
      }
    } catch (err: any) {
      showToast(`خطا در دریافت پیامک‌ها: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (device?.id) {
      fetchCalls();
      fetchContacts();
      fetchSms();
    }
  }, [device?.id]);

  useEffect(() => {
    if (subTab === 'calls') fetchCalls();
    if (subTab === 'contacts') fetchContacts();
    if (subTab === 'sms') fetchSms();
  }, [subTab]);

  // --- Deep Navigation from Notifications & Live Events ---
  const lastProcessedTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!navigationTarget) return;

    // Prevent duplicate re-execution of the same navigation target
    const targetKey = JSON.stringify(navigationTarget);
    if (lastProcessedTargetRef.current === targetKey) return;
    lastProcessedTargetRef.current = targetKey;

    if (navigationTarget.subTab) {
      setSubTab(navigationTarget.subTab);
    }

    if (navigationTarget.subTab === 'sms') {
      setSubTab('sms');
      setSmsCategoryFilter('all');
      setSmsSearch('');

      const resolved = resolveSmsThread(smsList, navigationTarget);
      if (!resolved) {
        pendingNavTargetRef.current = navigationTarget;
        fetchSms();
      }
    } else if (navigationTarget.subTab === 'calls') {
      if (navigationTarget.filter) {
        setCallFilter(navigationTarget.filter as any);
      }
      if (navigationTarget.searchQuery) {
        setDialNumber(navigationTarget.searchQuery);
        setHighlightedKey(navigationTarget.searchQuery);
      }
      if (navigationTarget.targetItemKey) {
        setHighlightedKey(String(navigationTarget.targetItemKey));
      }
    }

    // Immediately clear target in parent so user can freely navigate to contacts or sms
    if (onClearNavigationTarget) {
      onClearNavigationTarget();
    }

    const timer = setTimeout(() => {
      setHighlightedKey(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigationTarget, onClearNavigationTarget]);

  // --- Interactive Live Call Actions ---
  const handleAnswerCall = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/calls/answer`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('تماس با موفقیت پاسخ داده شد', 'success');
        setCallState(prev => ({ ...prev, isRinging: false, isInCall: true, state: 'offhook' }));
        fetchCalls();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا در پاسخ به تماس: ${err.message}`, 'error');
    }
  };

  const handleEndCall = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/calls/end`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('تماس قطع شد', 'success');
        setCallState({ state: 'idle', incomingNumber: '', isRinging: false, isInCall: false });
        fetchCalls();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleMute = async () => {
    if (!device) return;
    try {
      await fetch(`/api/devices/${device.id}/calls/mute`, { method: 'POST' });
      setIsMuted(prev => !prev);
      showToast(!isMuted ? 'میکروفون بی‌صدا شد' : 'میکروفون فعال شد', 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleSpeaker = async () => {
    if (!device) return;
    const targetRoute = isSpeaker ? 'earpiece' : 'speaker';
    try {
      await fetch(`/api/devices/${device.id}/calls/speaker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: targetRoute })
      });
      setIsSpeaker(prev => !prev);
      showToast(targetRoute === 'speaker' ? 'خروجی به اسپیکر/بلندگو تغییر یافت' : 'خروجی به گوشی تغییر یافت', 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const [isResettingAudio, setIsResettingAudio] = useState<boolean>(false);

  const handleResetCallAudio = async () => {
    if (!device) return;
    setIsResettingAudio(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/calls/reset-audio`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'مسیر صدای مکالمه با موفقیت بازنشانی شد و خروجی گوشی متصل گردید', 'success');
        setIsSpeaker(false);
        setIsMuted(false);
      } else {
        showToast(`خطا در بازنشانی صدا: ${data.error || 'ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setIsResettingAudio(false);
    }
  };

  const handleSendDtmf = async (digit: string) => {
    if (!device) return;
    try {
      await fetch(`/api/devices/${device.id}/calls/dtmf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digit })
      });
      showToast(`کلید تن صوتی ${digit} ارسال شد`, 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleRejectWithQuickSms = async () => {
    if (!device) return;
    const targetNum = callState.incomingNumber || dialNumber;
    try {
      const res = await fetch(`/api/devices/${device.id}/calls/reject-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: targetNum, message: selectedQuickSms })
      });
      const data = await res.json();
      if (data.success) {
        showToast('تماس رد شد و پیامک سریع ارسال گردید', 'success');
        setCallState({ state: 'idle', incomingNumber: '', isRinging: false, isInCall: false });
        fetchCalls();
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleSimulateIncomingCall = async () => {
    if (!device) return;
    try {
      await fetch(`/api/devices/${device.id}/calls/mock-incoming`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: '09129876543' })
      });
      setCallState({
        state: 'ringing',
        incomingNumber: '09129876543 (مهندس رادمنش)',
        isRinging: true,
        isInCall: false
      });
      showToast('تماس ورودی شبیه‌سازی شد! اکنون می‌توانید پاسخ دهید یا رد کنید.', 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // --- Call Actions ---
  const handleLaunchDialer = async (numToDial = dialNumber) => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/telephony/launch-dialer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: numToDial })
      });
      if (data.success) {
        showToast('برنامه شماره‌گیر روی گوشی باز شد', 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // --- Bluetooth Call & Audio Helpers ---
  const fetchBluetoothStatus = async () => {
    if (!device) return;
    setBluetoothInfo(prev => ({ ...prev, loading: true }));
    try {
      const res = await safeFetchJson(`/api/bluetooth/status?deviceId=${encodeURIComponent(device.id)}`);
      if (res && res.success) {
        setBluetoothInfo({
          loading: false,
          pc: res.pc,
          device: res.device
        });
      } else {
        setBluetoothInfo(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      setBluetoothInfo(prev => ({ ...prev, loading: false }));
    }
  };

  const handleAutoPairBluetooth = async () => {
    if (!device) return;
    setAutoPairingLoading(true);
    try {
      const res = await safeFetchJson('/api/bluetooth/auto-pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: device.id })
      });
      if (res.success) {
        showToast(res.message || 'جفت‌سازی آغاز شد', 'success');
        await fetchBluetoothStatus();
      } else {
        showToast(res.message || res.error || 'خطا در جفت‌سازی', 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setAutoPairingLoading(false);
    }
  };

  const handleOpenPcBluetoothSettings = async () => {
    try {
      await safeFetchJson('/api/bluetooth/open-pc-settings', { method: 'POST' });
      showToast('تنظیمات بلوتوث ویندوز باز شد', 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleOpenPcSoundSettings = async () => {
    try {
      await safeFetchJson('/api/bluetooth/open-pc-sound', { method: 'POST' });
      showToast('تنظیمات صدای ویندوز باز شد', 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleMakeCall = async (numberToCall: string, name = 'تماس') => {
    if (!device || !numberToCall.trim()) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/calls/make`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: numberToCall,
          name,
          simSlot: preferredSim,
          mode: callAudioMode,
          speakerphone: callAudioMode === 'speaker'
        })
      });
      const data = await res.json();
      if (data.success) {
        const modeLabel = callAudioMode === 'speaker' ? ' (با بلندگوی خودکار)' : (callAudioMode === 'bluetooth' ? ' (هندزفری بلوتوث کامپیوتر)' : '');
        showToast(`در حال برقراری تماس با ${numberToCall}${modeLabel}...`, 'success');
        setCallState({
          state: 'offhook',
          incomingNumber: numberToCall,
          isRinging: false,
          isInCall: true
        });
        fetchCalls();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleDeleteCall = async (callId: string) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/calls/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('تماس از تاریخچه حذف شد', 'success');
        fetchCalls();
      } else {
        showToast(`خطا: ${data.error || 'عملیات ناموفق بود'}`, 'error');
        fetchCalls();
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
      fetchCalls();
    }
  };

  const handleClearAllCalls = async () => {
    if (!device) return;
    if (!confirm('آیا از پاکسازی کل تاریخچه تماس‌های دستگاه اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/calls/clear`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('کل تاریخچه تماس‌ها با موفقیت پاک شد', 'success');
        setCallLogs([]);
        fetchCalls();
      } else {
        showToast(`خطا: ${data.error || 'پاکسازی ناموفق بود'}`, 'error');
        fetchCalls();
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
      fetchCalls();
    }
  };

  // --- Contact Actions ---
  const handleSaveContact = async () => {
    if (!device || !contactForm.name.trim() || !contactForm.phone.trim()) {
      showToast('نام و شماره تلفن مخاطب الزامی است', 'error');
      return;
    }

    try {
      if (editingContact) {
        // Edit existing contact
        const res = await fetch(`/api/devices/${device.id}/contacts/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId: editingContact.id,
            rawContactId: editingContact.rawContactId,
            ...contactForm
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast('اطلاعات مخاطب با موفقیت ویرایش شد', 'success');
          setContacts(contacts.map(c => 
            c.id === editingContact.id 
              ? { ...c, ...contactForm }
              : c
          ));
          setShowContactModal(false);
          setEditingContact(null);
          resetContactForm();
        } else {
          showToast(`خطا: ${data.error || 'ناشناخته'}`, 'error');
        }
      } else {
        // Add new contact
        const res = await fetch(`/api/devices/${device.id}/contacts/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactForm)
        });
        const data = await res.json();
        if (data.success) {
          showToast('مخاطب با موفقیت به گوشی افزوده شد', 'success');
          setShowContactModal(false);
          resetContactForm();
          fetchContacts();
        } else {
          showToast(`خطا: ${data.error || 'ناشناخته'}`, 'error');
        }
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const resetContactForm = () => {
    setContactForm({
      name: '',
      phone: '',
      secondaryPhone: '',
      email: '',
      company: '',
      jobTitle: '',
      address: '',
      birthday: '',
      website: '',
      nickname: '',
      relationship: 'همکار',
      avatar: '',
      notes: '',
      accountType: ''
    });
    setContactModalTab('basic');
  };

  const handleOpenEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name || '',
      phone: contact.phone || '',
      secondaryPhone: contact.secondaryPhone || '',
      email: contact.email || '',
      company: contact.company || '',
      jobTitle: contact.jobTitle || '',
      address: contact.address || '',
      birthday: contact.birthday || '',
      website: contact.website || '',
      nickname: contact.nickname || '',
      relationship: contact.relationship || 'همکار',
      avatar: contact.avatar || '',
      notes: contact.notes || '',
      accountType: contact.accountType || ''
    });
    setContactModalTab('basic');
    setShowContactModal(true);
  };

  const handleDeleteContact = async (contactId: string, name: string, rawContactId?: string) => {
    if (!device) return;
    if (!confirm(`آیا از حذف مخاطب "${name}" اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/devices/${device.id}/contacts/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, rawContactId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('مخاطب با موفقیت حذف گردید', 'success');
        setContacts(contacts.filter(c => c.id !== contactId && c.rawContactId !== contactId));
        setSelectedContacts(prev => prev.filter(id => id !== contactId));
      } else {
        showToast(`خطا در حذف مخاطب: ${data.error || 'ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleDeleteSelectedContacts = async () => {
    if (!device || selectedContacts.length === 0) return;
    if (!confirm(`آیا از حذف ${selectedContacts.length} مخاطب انتخاب‌شده اطمینان دارید؟`)) return;

    setActionProgress({
      active: true,
      title: `در حال حذف گروهی ${selectedContacts.length} مخاطب...`,
      subtitle: 'ارسال فرمان حذف به ارائه‌دهنده مخاطبین گوشی و پاکسازی رکوردها',
      variant: 'cyan'
    });

    try {
      const selectedRawIds = contacts
        .filter(c => selectedContacts.includes(c.id))
        .map(c => c.rawContactId || c.id);

      const res = await fetch(`/api/devices/${device.id}/contacts/delete-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedContacts, rawContactIds: selectedRawIds })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${selectedContacts.length} مخاطب با موفقیت حذف شدند`, 'success');
        setContacts(contacts.filter(c => !selectedContacts.includes(c.id)));
        setSelectedContacts([]);
        setIsContactSelectMode(false);
      } else {
        showToast(`خطا در حذف گروهی: ${data.error || 'ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setActionProgress({ active: false });
    }
  };

  const handleClearAllContacts = async () => {
    if (!device) return;
    if (!confirm('⚠️ آیا از پاکسازی کامل تمامی مخاطبین گوشی اطمینان دارید؟ این عملیات تمام مخاطبین را حذف خواهد کرد.')) return;

    setActionProgress({
      active: true,
      title: 'در حال پاکسازی کامل دفترچه مخاطبین...',
      subtitle: 'حذف تمامی مخاطبین سیم‌کارت و حافظه دستگاه',
      variant: 'cyan'
    });

    try {
      const res = await fetch(`/api/devices/${device.id}/contacts/clear`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('تمامی مخاطبین با موفقیت پاکسازی شدند', 'success');
        setContacts([]);
        setSelectedContacts([]);
        setIsContactSelectMode(false);
      } else {
        showToast(`خطا: ${data.error || 'ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setActionProgress({ active: false });
    }
  };

  const toggleSelectContact = (contactId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedContacts(prev => 
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const handleMergeGroup = async (group: DuplicateGroup) => {
    if (!device || group.contacts.length < 2) return;
    const [primary, ...duplicates] = group.contacts;

    setActionProgress({
      active: true,
      title: `در حال ادغام دسته «${group.label}»...`,
      subtitle: 'یکپارچه‌سازی شماره‌ها و حذف موارد تکراری از گوشی',
      variant: 'gold'
    });

    const merged: Contact = {
      ...primary,
      name: primary.name || duplicates.find(d => d.name)?.name || 'مخاطب ادغام شده',
      phone: primary.phone || duplicates.find(d => d.phone)?.phone || '',
      secondaryPhone: primary.secondaryPhone || duplicates.find(d => d.phone && d.phone !== primary.phone)?.phone || duplicates.find(d => d.secondaryPhone)?.secondaryPhone || '',
      email: primary.email || duplicates.find(d => d.email)?.email || '',
      company: primary.company || duplicates.find(d => d.company)?.company || '',
      jobTitle: primary.jobTitle || duplicates.find(d => d.jobTitle)?.jobTitle || '',
      address: primary.address || duplicates.find(d => d.address)?.address || '',
      birthday: primary.birthday || duplicates.find(d => d.birthday)?.birthday || '',
      website: primary.website || duplicates.find(d => d.website)?.website || '',
      nickname: primary.nickname || duplicates.find(d => d.nickname)?.nickname || '',
      relationship: primary.relationship || duplicates.find(d => d.relationship)?.relationship || 'همکار',
      avatar: primary.avatar || duplicates.find(d => d.avatar)?.avatar || '',
      notes: Array.from(new Set([primary.notes, ...duplicates.map(d => d.notes)].filter(Boolean))).join(' | ')
    };

    const duplicateIds = duplicates.map(d => d.id || d.rawContactId).filter(Boolean);

    try {
      const res = await fetch(`/api/devices/${device.id}/contacts/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetContact: merged, duplicateIds })
      });
      const data = await res.json();
      if (data.success) {
        showToast('مخاطبین مشترک با موفقیت ادغام شدند', 'success');
        fetchContacts();
      } else {
        showToast(`خطا: ${data.error || 'ادغام ناموفق بود'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setActionProgress({ active: false });
    }
  };

  const handleMergeAllDuplicates = async () => {
    if (!device || findDuplicates.length === 0) return;
    if (!confirm(`آیا از ادغام خودکار تمام ${findDuplicates.length} دسته مخاطب تکراری اطمینان دارید؟`)) return;

    setActionProgress({
      active: true,
      title: `در حال ادغام خودکار ${findDuplicates.length} دسته مخاطب تکراری...`,
      subtitle: 'لطفاً چند لحظه شکیبا باشید. تجمیع مشخصات و حذف رکوردهای مشترک در حال انجام است.',
      variant: 'gold'
    });

    try {
      for (const group of findDuplicates) {
        await handleMergeGroup(group);
      }
      showToast('تمامی مخاطبین تکراری با موفقیت ادغام و یکپارچه شدند', 'success');
      setShowMergeModal(false);
    } finally {
      setActionProgress({ active: false });
    }
  };

  const handleSelectAllContacts = (targetList: Contact[]) => {
    if (selectedContacts.length === targetList.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(targetList.map(c => c.id));
    }
  };

  const handleExportContacts = (format: 'vcf' | 'json' | 'csv' = 'vcf') => {
    if (contacts.length === 0) return;

    if (format === 'json') {
      const jsonStr = JSON.stringify(contacts, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contacts_Backup_${Date.now()}.json`;
      a.click();
      showToast('پشتیبان JSON مخاطبین با موفقیت دانلود شد', 'success');
      return;
    }

    if (format === 'csv') {
      let csv = 'Name,Phone,SecondaryPhone,Email,Company,JobTitle,Address,Birthday,Website,Nickname,Relationship,Notes,Source\n';
      contacts.forEach(c => {
        csv += `"${(c.name || '').replace(/"/g, '""')}","${c.phone || ''}","${c.secondaryPhone || ''}","${c.email || ''}","${(c.company || '').replace(/"/g, '""')}","${(c.jobTitle || '').replace(/"/g, '""')}","${(c.address || '').replace(/"/g, '""')}","${c.birthday || ''}","${c.website || ''}","${(c.nickname || '').replace(/"/g, '""')}","${c.relationship || ''}","${(c.notes || '').replace(/"/g, '""')}","${c.sourceLabel || ''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contacts_Backup_${Date.now()}.csv`;
      a.click();
      showToast('خروجی CSV مخاطبین با موفقیت دانلود شد', 'success');
      return;
    }

    // Default VCF 3.0 Rich Spec
    let vcfData = '';
    contacts.forEach(c => {
      vcfData += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL;TYPE=CELL:${c.phone}\n`;
      if (c.secondaryPhone) vcfData += `TEL;TYPE=WORK:${c.secondaryPhone}\n`;
      if (c.email) vcfData += `EMAIL:${c.email}\n`;
      if (c.company) vcfData += `ORG:${c.company}\n`;
      if (c.jobTitle) vcfData += `TITLE:${c.jobTitle}\n`;
      if (c.address) vcfData += `ADR;TYPE=HOME:;;${c.address};;;;\n`;
      if (c.birthday) vcfData += `BDAY:${c.birthday}\n`;
      if (c.website) vcfData += `URL:${c.website}\n`;
      if (c.nickname) vcfData += `NICKNAME:${c.nickname}\n`;
      if (c.notes) vcfData += `NOTE:${c.notes}\n`;
      vcfData += `END:VCARD\n\n`;
    });

    const blob = new Blob([vcfData], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contacts_Backup_${Date.now()}.vcf`;
    a.click();
    showToast('فایل VCF جامع مخاطبین با موفقیت دانلود شد', 'success');
  };

  // --- SMS Actions ---
  const handleSendSms = async (recipient: string, messageText: string) => {
    if (!device || !recipient.trim() || !messageText.trim()) return;

    try {
      const res = await fetch(`/api/devices/${device.id}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: recipient, body: messageText, simSlot: preferredSim })
      });
      const data = await res.json();
      if (data.success) {
        showToast('پیامک با موفقیت ارسال شد', 'success');
        setNewSmsText('');
        setShowNewSmsModal(false);
        fetchSms();
      } else {
        showToast(`خطا در ارسال پیامک: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleOpenSmsApp = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/sms/open-app`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('برنامه پیام‌ها در صفحه گوشی باز شد', 'success');
      } else {
        showToast(`خطا: ${data.error || 'ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا در باز کردن برنامه پیام‌ها: ${err.message}`, 'error');
    }
  };

  const handleDeleteSms = async (messageId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!device) return;
    if (!confirm('آیا از حذف این پیامک اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/sms/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('پیامک با موفقیت حذف شد', 'success');
        setSmsList(prev => prev.filter(m => m.id !== messageId));
        fetchSms();
      } else {
        showToast(data.error || 'خطا در حذف پیامک', 'error');
        fetchSms();
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
      fetchSms();
    }
  };

  const handleDeleteThread = async (threadKey: string, number?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!device) return;
    const displayName = number || threadKey;
    if (!confirm(`آیا از حذف کل این گفتگو (${displayName}) اطمینان دارید؟`)) return;
    try {
      const msgs = smsThreads[threadKey] || [];
      const messageIds = msgs.map(m => m.id).filter(Boolean);
      const actualThreadId = msgs[0]?.threadId || threadKey;

      const res = await fetch(`/api/devices/${device.id}/sms/delete-thread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadKey: actualThreadId, number, messageIds })
      });
      const data = await res.json();
      if (data.success) {
        showToast('گفتگو با موفقیت حذف شد', 'success');
        setSmsList(prev => prev.filter(m => {
          if (messageIds.includes(m.id)) return false;
          if (actualThreadId && m.threadId === actualThreadId) return false;
          if (number && m.number === number) return false;
          return true;
        }));
        if (selectedThread === threadKey || selectedThread === actualThreadId) {
          setSelectedThread(null);
        }
        fetchSms();
      } else {
        showToast(data.error || 'خطا در حذف گفتگو', 'error');
        fetchSms();
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
      fetchSms();
    }
  };

  const handleDeleteSelectedThreads = async () => {
    if (!device || selectedSmsThreads.length === 0) return;
    if (!confirm(`آیا از حذف ${selectedSmsThreads.length} گفتگوی انتخاب‌شده اطمینان دارید؟`)) return;
    try {
      const numbersToDelete: string[] = [];
      const threadKeysToDelete: string[] = [];
      const messageIdsToDelete: (string | number)[] = [];

      selectedSmsThreads.forEach(key => {
        const msgs = smsThreads[key] || [];
        msgs.forEach(m => {
          if (m.id) messageIdsToDelete.push(m.id);
        });
        if (msgs && msgs[0]) {
          if (msgs[0].threadId) threadKeysToDelete.push(msgs[0].threadId);
          if (msgs[0].number) numbersToDelete.push(msgs[0].number);
        } else {
          threadKeysToDelete.push(key);
        }
      });

      const res = await fetch(`/api/devices/${device.id}/sms/delete-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadKeys: threadKeysToDelete,
          numbers: numbersToDelete,
          messageIds: messageIdsToDelete
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${selectedSmsThreads.length} گفتگو با موفقیت حذف شدند`, 'success');
        setSmsList(prev => prev.filter(m => {
          if (messageIdsToDelete.includes(m.id)) return false;
          if (threadKeysToDelete.includes(m.threadId)) return false;
          if (m.number && numbersToDelete.includes(m.number)) return false;
          return true;
        }));
        if (selectedThread && selectedSmsThreads.includes(selectedThread)) {
          setSelectedThread(null);
        }
        setSelectedSmsThreads([]);
        setIsSmsSelectMode(false);
        fetchSms();
      } else {
        showToast(data.error || 'خطا در حذف گروهی', 'error');
        fetchSms();
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
      fetchSms();
    }
  };

  const handleClearAllSms = async () => {
    if (!device) return;
    if (!confirm('⚠️ آیا از پاکسازی کامل کلیه پیامک‌های دستگاه مطمئن هستید؟ این عملیات غیرقابل بازگشت است.')) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/sms/clear`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('تمامی پیامک‌ها با موفقیت پاکسازی شدند', 'success');
        setSmsList([]);
        setSelectedThread(null);
        setSelectedSmsThreads([]);
        setIsSmsSelectMode(false);
        fetchSms();
      } else {
        showToast(data.error || 'خطا در پاکسازی (محدودیت امنیتی اندروید)', 'error');
        fetchSms();
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
      fetchSms();
    }
  };

  const toggleSelectThread = (threadKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSmsThreads(prev => 
      prev.includes(threadKey) ? prev.filter(k => k !== threadKey) : [...prev, threadKey]
    );
  };

  const handleSelectAllThreads = (allKeys: string[]) => {
    if (selectedSmsThreads.length === allKeys.length) {
      setSelectedSmsThreads([]);
    } else {
      setSelectedSmsThreads([...allKeys]);
    }
  };

  const handleExportSms = () => {
    if (smsList.length === 0) return;
    const jsonStr = JSON.stringify(smsList, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SMS_Backup_${Date.now()}.json`;
    a.click();
    showToast('پشتیبان‌گیری پیامک‌ها با موفقیت دانلود شد', 'success');
  };

  const handleCopyMessageText = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    showToast('متن پیامک در کلیپ‌بورد کپی شد', 'success');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Helper to extract numeric epoch ms from various call/sms date representations
  const getCallTimeValue = (c: any): number => {
    if (c.rawDate && !isNaN(Number(c.rawDate))) return Number(c.rawDate);
    if (c.isoDate) {
      const t = new Date(c.isoDate).getTime();
      if (!isNaN(t)) return t;
    }
    if (c.date) {
      const t = new Date(c.date).getTime();
      if (!isNaN(t)) return t;
    }
    // If date is localized string with time (e.g. timestamp "12:12")
    if (c.timestamp && typeof c.timestamp === 'string') {
      const parts = c.timestamp.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
        const m = parseInt(parts[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
        if (!isNaN(h) && !isNaN(m)) return (h * 60 + m) * 60 * 1000;
      }
    }
    if (c.id && !isNaN(Number(c.id))) return Number(c.id);
    return 0;
  };

  const getCallDurationSec = (c: any): number => {
    if (c.rawDuration !== undefined && !isNaN(Number(c.rawDuration))) return Number(c.rawDuration);
    if (c.duration && typeof c.duration === 'string') {
      const clean = c.duration.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
      const mMatch = clean.match(/(\d+)\s*m/);
      const sMatch = clean.match(/(\d+)\s*s/);
      const m = mMatch ? parseInt(mMatch[1], 10) : 0;
      const s = sMatch ? parseInt(sMatch[1], 10) : 0;
      return m * 60 + s;
    }
    return 0;
  };

  // Filters & Sorting
  const filteredCalls = callLogs.filter(c => {
    if (callFilter === 'all') return true;
    return c.type === callFilter;
  }).sort((a, b) => {
    if (callSort === 'date_desc') {
      const timeDiff = getCallTimeValue(b) - getCallTimeValue(a);
      if (timeDiff !== 0) return timeDiff;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    }
    if (callSort === 'date_asc') {
      const timeDiff = getCallTimeValue(a) - getCallTimeValue(b);
      if (timeDiff !== 0) return timeDiff;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    }
    if (callSort === 'duration_desc') {
      return getCallDurationSec(b) - getCallDurationSec(a);
    }
    if (callSort === 'name_asc') {
      return (a.name || a.number || '').localeCompare(b.name || b.number || '', 'fa');
    }
    return 0;
  });

  // Contact Sources Stats Breakdown
  const contactSources = useMemo(() => [
    { key: 'all', label: 'همه منابع (تجمعی)', count: contacts.length },
    { key: 'google', label: 'حساب گوگل (Google)', count: contacts.filter(c => c.sourceKey === 'google').length },
    { key: 'xiaomi', label: 'شیائومی (Mi Cloud)', count: contacts.filter(c => c.sourceKey === 'xiaomi').length },
    { key: 'sim', label: 'سیم‌کارت (SIM)', count: contacts.filter(c => c.sourceKey === 'sim').length },
    { key: 'device', label: 'حافظه داخلی گوشی', count: contacts.filter(c => c.sourceKey === 'device').length },
    { key: 'messengers', label: 'پیام‌رسان‌ها (واتساپ/تلگرام/ایتا)', count: contacts.filter(c => ['whatsapp', 'whatsapp_business', 'telegram', 'eitaa', 'meet'].includes(c.sourceKey || '')).length },
    { key: 'other', label: 'سایر حساب‌ها', count: contacts.filter(c => c.sourceKey === 'other').length },
  ].filter(s => s.key === 'all' || s.count > 0), [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts
      .filter(c => {
        // Source filter
        if (contactSourceFilter !== 'all') {
          if (contactSourceFilter === 'messengers') {
            if (!['whatsapp', 'whatsapp_business', 'telegram', 'eitaa', 'meet'].includes(c.sourceKey || '')) return false;
          } else if (c.sourceKey !== contactSourceFilter) {
            return false;
          }
        }
        // Search term
        if (contactSearch.trim()) {
          const q = contactSearch.toLowerCase();
          return (
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.company && c.company.toLowerCase().includes(q)) ||
            (c.accountName && c.accountName.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (contactSort === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'fa');
        if (contactSort === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'fa');
        if (contactSort === 'phone_asc') return (a.phone || '').localeCompare(b.phone || '');
        if (contactSort === 'source_asc') return (a.sourceLabel || '').localeCompare(b.sourceLabel || '', 'fa');
        return 0;
      });
  }, [contacts, contactSourceFilter, contactSearch, contactSort]);

  // Paginated contacts for ultra-fast DOM rendering
  const totalContactPages = Math.ceil(filteredContacts.length / contactPageSize) || 1;
  const safeContactPage = Math.min(Math.max(1, contactPage), totalContactPages);
  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice(
      (safeContactPage - 1) * contactPageSize,
      safeContactPage * contactPageSize
    );
  }, [filteredContacts, safeContactPage, contactPageSize]);

  // Paginated calls for fast log rendering
  const totalCallPages = Math.ceil(filteredCalls.length / callPageSize) || 1;
  const safeCallPage = Math.min(Math.max(1, callPage), totalCallPages);
  const paginatedCalls = useMemo(() => {
    return filteredCalls.slice(
      (safeCallPage - 1) * callPageSize,
      safeCallPage * callPageSize
    );
  }, [filteredCalls, safeCallPage, callPageSize]);

  // Quick dialer auto-complete matches (when typing phone or name in dialer)
  const dialerMatches = useMemo(() => {
    if (!dialNumber || dialNumber.trim().length < 2) return [];
    const q = dialNumber.trim().toLowerCase();
    const cleanDigits = q.replace(/[^0-9+]/g, '');
    return contacts.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const phoneClean = (c.phone || '').replace(/[^0-9+]/g, '');
      const phoneMatch = cleanDigits.length >= 2 && phoneClean.includes(cleanDigits);
      return nameMatch || phoneMatch;
    }).slice(0, 5);
  }, [dialNumber, contacts]);

  // Dialer Contact Picker Modal Filtered List
  const dialerModalContacts = useMemo(() => {
    return contacts.filter(c => {
      if (dialerContactSourceFilter !== 'all') {
        if (dialerContactSourceFilter === 'messengers') {
          if (!['whatsapp', 'whatsapp_business', 'telegram', 'eitaa', 'meet'].includes(c.sourceKey || '')) return false;
        } else if (c.sourceKey !== dialerContactSourceFilter) {
          return false;
        }
      }
      if (dialerContactSearch.trim()) {
        const q = dialerContactSearch.toLowerCase().trim();
        const cleanDigits = q.replace(/[^0-9+]/g, '');
        const nameMatch = (c.name || '').toLowerCase().includes(q);
        const phoneClean = (c.phone || '').replace(/[^0-9+]/g, '');
        const phoneMatch = cleanDigits.length >= 2 && phoneClean.includes(cleanDigits);
        const emailMatch = (c.email || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch;
      }
      return true;
    }).slice(0, 150);
  }, [contacts, dialerContactSourceFilter, dialerContactSearch]);

  // High-Speed O(N) Duplicate Contacts Detection
  interface DuplicateGroup {
    key: string;
    label: string;
    reason: 'phone' | 'name';
    contacts: Contact[];
  }

  const findDuplicates = useMemo((): DuplicateGroup[] => {
    if (contacts.length === 0) return [];
    const groups: DuplicateGroup[] = [];
    const phoneMap = new Map<string, Contact[]>();
    const nameMap = new Map<string, Contact[]>();

    const cleanPhone = (num: string) => {
      let c = (num || '').replace(/[^0-9]/g, '');
      if (c.startsWith('98') && c.length === 12) c = '0' + c.slice(2);
      return c;
    };

    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      const p = cleanPhone(c.phone);
      if (p.length >= 7) {
        const list = phoneMap.get(p) || [];
        list.push(c);
        phoneMap.set(p, list);
      }
      const n = (c.name || '').trim().toLowerCase();
      if (n && n !== 'مخاطب بدون نام' && n.length >= 2) {
        const list = nameMap.get(n) || [];
        list.push(c);
        nameMap.set(n, list);
      }
    }

    const processedGroupSignatures = new Set<string>();

    phoneMap.forEach((list, phone) => {
      if (list.length > 1) {
        const sig = list.map(c => c.id || c.phone).sort().join('|');
        processedGroupSignatures.add(sig);
        groups.push({
          key: `phone_${phone}`,
          label: `شماره تلفن یکسان (${list[0].phone})`,
          reason: 'phone',
          contacts: list
        });
      }
    });

    nameMap.forEach((list, name) => {
      if (list.length > 1) {
        const sig = list.map(c => c.id || c.phone).sort().join('|');
        if (!processedGroupSignatures.has(sig)) {
          processedGroupSignatures.add(sig);
          groups.push({
            key: `name_${name}`,
            label: `نام مشترک (${list[0].name})`,
            reason: 'name',
            contacts: list
          });
        }
      }
    });

    return groups;
  }, [contacts]);

  // Filter SMS by Category (Inbox, Sent, Banking, Spam, Blocked, Drafts)
  const filteredSmsList = useMemo(() => {
    return smsList.filter(m => {
      if (smsCategoryFilter === 'inbox') return m.type === 'inbox' && !m.isSpam && !m.isBlocked;
      if (smsCategoryFilter === 'sent') return m.type === 'sent';
      if (smsCategoryFilter === 'banking') return m.isBank || m.isOtp;
      if (smsCategoryFilter === 'spam') return m.isSpam;
      if (smsCategoryFilter === 'blocked') return m.isBlocked;
      if (smsCategoryFilter === 'drafts') return m.type === 'draft' || m.type === 'outbox' || m.type === 'failed';
      return true;
    });
  }, [smsList, smsCategoryFilter]);

  // Group SMS by threadId or number
  const smsThreads: { [key: string]: SmsMessage[] } = useMemo(() => {
    const map: { [key: string]: SmsMessage[] } = {};
    filteredSmsList.forEach(m => {
      const threadKey = m.threadId || m.number;
      if (!map[threadKey]) map[threadKey] = [];
      map[threadKey].push(m);
    });
    return map;
  }, [filteredSmsList]);

  const filteredThreadKeys = useMemo(() => {
    return Object.keys(smsThreads).filter(threadKey => {
      if (!smsSearch.trim()) return true;
      const msgs = smsThreads[threadKey];
      const q = smsSearch.toLowerCase();
      return msgs.some(m => 
        (m.sender && m.sender.toLowerCase().includes(q)) ||
        (m.number && m.number.includes(q)) ||
        (m.body && m.body.toLowerCase().includes(q))
      );
    });
  }, [smsThreads, smsSearch]);

  // SMS Categories stats
  const smsCategoryCounts = useMemo(() => {
    return {
      all: smsList.length,
      inbox: smsList.filter(m => m.type === 'inbox' && !m.isSpam && !m.isBlocked).length,
      sent: smsList.filter(m => m.type === 'sent').length,
      banking: smsList.filter(m => m.isBank || m.isOtp).length,
      spam: smsList.filter(m => m.isSpam).length,
      blocked: smsList.filter(m => m.isBlocked).length,
      drafts: smsList.filter(m => m.type === 'draft' || m.type === 'outbox' || m.type === 'failed').length
    };
  }, [smsList]);

  const activeThreadMessages = selectedThread && smsThreads[selectedThread] ? smsThreads[selectedThread] : [];
  const activeThreadRecipient = activeThreadMessages[0]?.number || '';

  // Quick SMS Templates
  const quickSmsTemplates = [
    'سلام، در جلسه هستم. بعداً تماس می‌گیرم.',
    'در حال رانندگی هستم، لطفاً پیامک بدهید.',
    'الان امکان پاسخگویی ندارم، به زودی با شما تماس خواهم گرفت.',
    'لطفاً موضوع را در پیامک بفرمایید.'
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🔴 LIVE INCOMING CALL OVERLAY / HUD */}
      {/* ========================================================= */}
      {callState.isRinging && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-rose-950/80 border-2 border-emerald-500/60 p-6 shadow-2xl shadow-emerald-500/20 animate-pulse">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-right">
            {/* Caller Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-lg shadow-emerald-500/30 animate-bounce">
                <PhoneIncoming className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                    تماس ورودی هم‌اکنون در حال زنگ خوردن...
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  {callState.incomingNumber || 'شماره ناشناس'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  گوشی در حال زنگ خوردن است. از همینجا پاسخ دهید یا رد کنید.
                </p>
              </div>
            </div>

            {/* In-Call Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Answer Button */}
              <button
                onClick={handleAnswerCall}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/40 transition-all active:scale-95"
              >
                <PhoneCall className="w-5 h-5" />
                <span>پاسخ دادن به تماس (Answer)</span>
              </button>

              {/* End/Reject Button */}
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all active:scale-95"
              >
                <PhoneOff className="w-5 h-5" />
                <span>رد تماس (Decline)</span>
              </button>

              {/* Quick Reject with SMS */}
              <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700">
                <select
                  value={selectedQuickSms}
                  onChange={(e) => setSelectedQuickSms(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none px-2 py-1 max-w-[200px]"
                >
                  {quickSmsTemplates.map((t, idx) => (
                    <option key={idx} value={t} className="bg-slate-900 text-slate-200">
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRejectWithQuickSms}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700"
                  title="رد تماس و ارسال خودکار پیامک"
                >
                  رد با پیامک
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🟢 ACTIVE IN-CALL CONTROL STUDIO CARD */}
      {/* ========================================================= */}
      {callState.isInCall && (
        <div className="rounded-3xl glass-panel border-2 border-cyan-500/50 p-6 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 shadow-2xl shadow-cyan-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Call State & Elapsed Timer */}
            <div className="flex items-center gap-4 text-right">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-lg shadow-cyan-500/30">
                <PhoneCall className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs font-bold text-emerald-400">تماس فعال (مکالمه در جریان)</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs">
                    ⏱️ {formatTimer(callTimerSeconds)}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  {callState.incomingNumber || 'مخاطب'}
                </h3>
              </div>
            </div>

            {/* In-Call Controls Deck */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Mute Button */}
              <button
                onClick={handleToggleMute}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all border ${
                  isMuted 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4 text-cyan-400" />}
                <span>{isMuted ? 'میکروفون قطع است' : 'میکروفون وصل'}</span>
              </button>

              {/* Speakerphone Button */}
              <button
                onClick={handleToggleSpeaker}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all border ${
                  isSpeaker 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isSpeaker ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                <span>{isSpeaker ? 'خروجی بلندگو' : 'خروجی گوشی'}</span>
              </button>

              {/* Reset Call Audio (Earpiece Unmute / Fix) Button */}
              <button
                onClick={handleResetCallAudio}
                disabled={isResettingAudio}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all border bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                title="اگر صدای طرف مقابل شنیده نمی‌شود، برای اتصال فوری و خروج از حالت بی‌صدا کلیک کنید"
              >
                <RotateCcw className={`w-4 h-4 text-emerald-400 ${isResettingAudio ? 'animate-spin' : ''}`} />
                <span>رفع قطعی صدای مکالمه</span>
              </button>

              {/* Toggle DTMF Keypad */}
              <button
                onClick={() => setShowDtmfKeypad(!showDtmfKeypad)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all border ${
                  showDtmfKeypad ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>شماره‌گیر گویا (DTMF)</span>
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-xl shadow-rose-600/40 transition-all active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>قطع تماس (Hang Up)</span>
              </button>

              {/* Dismiss / Close Studio Card */}
              <button
                onClick={() => {
                  setCallState({ state: 'idle', incomingNumber: '', isRinging: false, isInCall: false });
                  fetchCalls();
                }}
                className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-bold transition-all"
                title="بستن پنل مکالمه (در صورتی که تماس روی گوشی پایان یافته است)"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>بستن پنل</span>
              </button>
            </div>
          </div>

          {/* Expanded DTMF Dialpad in Call */}
          {showDtmfKeypad && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 max-w-sm mx-auto text-center space-y-3 animate-fadeIn">
              <p className="text-xs text-slate-400">
                کلیدهای عددی زیر را جهت انتخاب گزینه‌های تلفن گویا (IVR) یا کدهای دستوری لمس کنید:
              </p>
              <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleSendDtmf(k)}
                    className="h-11 rounded-xl bg-slate-900 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/50 text-base font-mono font-bold text-cyan-300 transition-all active:scale-95 shadow-sm"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Header & Subtab Switcher */}
      <div className="rounded-2xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-cyan-400" />
            <span>مدیریت و کنترل تماس‌ها، مخاطبین و پیامک‌ها</span>
          </h2>
          <p className="text-xs text-slate-400">
            {isIos
              ? 'برقراری تماس مستقیم و هدایت به هندزفری بلوتوث کامپیوتر، شماره‌گیری سریع و مدیریت اطلاعات آیفون'
              : 'پاسخ‌دهی و برقراری تماس مستقیم از ویندوز، بی‌صدا کردن میکروفون، تعویض بلندگو، شماره‌گیر تلفن گویا، ویرایش مخاطبین و پیامک‌ها'}
          </p>
        </div>

        {/* Subtabs Switcher & Simulator button */}
        <div className="flex items-center gap-2">
          {!isIos && (!callState.isRinging && !callState.isInCall) && (
            <button
              onClick={handleSimulateIncomingCall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all shadow-sm"
              title="تست و شبیه‌سازی زنگ خوردن تماس ورودی روی گوشی"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>تست زنگ تماس</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setSubTab('calls')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'calls' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>تماس‌ها ({callLogs.length})</span>
            </button>

            <button
              onClick={() => setSubTab('contacts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'contacts' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>مخاطبین ({contacts.length})</span>
            </button>

            <button
              onClick={() => setSubTab('sms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'sms' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>پیامک‌ها ({smsList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Notice Banner */}
      {isIos && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center gap-3 text-xs text-slate-300">
          <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong>دستگاه متصل: Apple iPhone (iOS)</strong> — به دلیل پروتکل‌های امنیتی اپل، شماره‌گیری از طریق هدایت تماس و هندزفری بلوتوث کامپیوتر فعال است. برای استخراج و پشتیبان‌گیری ساختاریافته از تمامی مخاطبین، پیام‌ها و فایل‌ها می‌توانید از تب <strong>«پشتیبان‌گیری و بازیابی جامع»</strong> و <strong>«استودیو اختصاصی آیفون»</strong> استفاده فرمایید.
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. CALLS & DIALER VIEW */}
      {/* ========================================================= */}
      {subTab === 'calls' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dialpad Card */}
          {/* Dialpad & Quick USSD Card */}
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span>شماره‌گیر مستقیم و کدهای دستوری</span>
                </h3>
                <button
                  type="button"
                  onClick={handleResetCallAudio}
                  disabled={isResettingAudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  title="بازنشانی مسیر صدای مکالمه و رفع بی‌صدا شدن تماس‌های دریافتی بدون نیاز به ریستارت گوشی"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-emerald-400 ${isResettingAudio ? 'animate-spin' : ''}`} />
                  <span>تعمیر صدای تماس</span>
                </button>
              </div>

              {/* SIM Card Preference Selector */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    سیم‌کارت پیش‌فرض تماس و پیامک:
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {preferredSim === -1 ? 'خودکار سیستم' : `سیم‌کارت ${preferredSim + 1}`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetPreferredSim(-1)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      preferredSim === -1
                        ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    خودکار (Auto)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPreferredSim(0)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      preferredSim === 0
                        ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    سیم ۱ (SIM 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPreferredSim(1)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      preferredSim === 1
                        ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    سیم ۲ (SIM 2)
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  انتخاب سیم‌کارت به صورت پیش‌فرض برای این گوشی ذخیره می‌شود تا هنگام تماس یا ارسال پیامک سوال مجدد پرسیده نشود.
                </p>
              </div>

              {/* Call Audio Routing Mode Selector */}
              <div className="p-3 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    مسیر انتقال صدا و مکالمه:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      fetchBluetoothStatus();
                      setShowBluetoothModal(true);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded-lg border border-cyan-500/30 transition-all"
                    title="راهنمای اتصال و جفت‌سازی بلوتوث با کامپیوتر"
                  >
                    <Bluetooth className="w-3 h-3 text-cyan-400" />
                    <span>دستیار بلوتوث</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCallAudioMode('speaker')}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      callAudioMode === 'speaker'
                        ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                        : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                    }`}
                    title="به محض شماره‌گیری، بلندگوی گوشی خودکار روشن می‌شود"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="text-[11px] leading-none">اسپیکرفون خودکار</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCallAudioMode('bluetooth')}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      callAudioMode === 'bluetooth'
                        ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                        : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                    }`}
                    title="مکالمه مستقیم با میکروفون و هدست/اسپیکر ویندوز از طریق بلوتوث"
                  >
                    <Headphones className="w-4 h-4" />
                    <span className="text-[11px] leading-none">هندزفری ویندوز</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCallAudioMode('default')}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      callAudioMode === 'default'
                        ? 'bg-gradient-to-b from-emerald-500 to-green-600 text-slate-950 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                        : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                    }`}
                    title="تماس به شیوه معمولی گوشی (گوشی نزدیک گوش)"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[11px] leading-none">گوشی معمولی</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/50 flex items-start gap-1.5">
                  {callAudioMode === 'speaker' && (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>صدای مکالمه بلافاصله از بلندگوی گوشی پخش می‌شود و نیازی به لمس گوشی نخواهید داشت.</span>
                    </>
                  )}
                  {callAudioMode === 'bluetooth' && (
                    <>
                      <Bluetooth className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>صدا و میکروفون کامپیوتر به عنوان هندزفری عمل کرده و مکالمه مستقیماً از پشت سیستم انجام می‌شود.</span>
                    </>
                  )}
                  {callAudioMode === 'default' && (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>تماس خروجی شماره‌گیری شده و صدا روی بلندگوی مکالمه داخلی گوشی قرار می‌گیرد.</span>
                    </>
                  )}
                </div>
              </div>

              {/* Number Input Screen with Contact Picker & Autocomplete */}
              <div className="relative">
                {dialerContactName && (
                  <div className="text-center text-xs text-cyan-400 font-bold mb-1.5 flex items-center justify-center gap-1.5 bg-cyan-950/60 py-1 px-3 rounded-xl border border-cyan-500/30 max-w-fit mx-auto shadow-sm animate-fadeIn">
                    <Users className="w-3.5 h-3.5 text-cyan-300" />
                    <span>مخاطب: {dialerContactName}</span>
                    <button 
                      type="button"
                      onClick={() => setDialerContactName('')} 
                      className="text-slate-400 hover:text-rose-400 mr-1 transition-colors"
                      title="پاک کردن برچسب مخاطب"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="شماره تماس یا جستجوی مخاطب..."
                    value={dialNumber}
                    onChange={(e) => {
                      setDialNumber(e.target.value);
                      if (!e.target.value) setDialerContactName('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleMakeCall(dialNumber, dialerContactName || 'تماس')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-12 pl-12 py-3 text-lg font-mono font-bold text-cyan-300 text-center tracking-wider focus:outline-none focus:border-cyan-500 shadow-inner"
                  />

                  {/* Pick from contacts modal button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDialerContactSearch('');
                      setShowDialerContactModal(true);
                    }}
                    className="absolute right-2 p-2 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700 transition-all shadow-sm"
                    title="انتخاب از دفترچه مخاطبین گوشی"
                  >
                    <Users className="w-4 h-4" />
                  </button>

                  {/* Delete / Clear button */}
                  {dialNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        setDialNumber('');
                        setDialerContactName('');
                      }}
                      className="absolute left-2 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 transition-all"
                      title="پاک کردن شماره"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Instant Matching Contacts Dropdown */}
                {dialerMatches.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-[#0c142b]/95 border border-cyan-500/40 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md divide-y divide-slate-800/60 max-h-48 overflow-y-auto animate-fadeIn">
                    <div className="px-2.5 py-1 text-[10px] text-slate-400 flex items-center justify-between font-sans">
                      <span className="font-semibold text-slate-300">مخاطبین منطبق ({dialerMatches.length}):</span>
                      <span className="text-cyan-400 text-[10px]">لمس جهت انتخاب</span>
                    </div>
                    {dialerMatches.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setDialNumber(c.phone || '');
                          setDialerContactName(c.name);
                        }}
                        className="p-2 hover:bg-cyan-500/15 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-colors text-right"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-xs font-bold font-sans">
                            {(c.name || 'م')[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white truncate max-w-[130px] font-sans">{c.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono text-left" dir="ltr">{c.phone}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 font-sans">
                          {c.sourceLabel || 'مخاطب'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      if (callState.isInCall) {
                        handleSendDtmf(k);
                      } else {
                        setDialNumber(prev => prev + k);
                      }
                    }}
                    className="h-11 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-lg font-mono font-bold text-slate-200 transition-all active:scale-95"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Call Action Buttons */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleMakeCall(dialNumber)}
                  disabled={!dialNumber.trim()}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50 ${
                    callAudioMode === 'speaker'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                      : (callAudioMode === 'bluetooth'
                         ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20'
                         : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 shadow-emerald-500/20')
                  }`}
                  title={
                    callAudioMode === 'speaker'
                      ? 'برقراری تماس مستقیم و فعال‌سازی خودکار بلندگوی گوشی'
                      : (callAudioMode === 'bluetooth'
                         ? 'برقراری تماس و مکالمه از طریق بلوتوث و هندزفری ویندوز'
                         : 'برقراری تماس مستقیم به حالت معمولی گوشی')
                  }
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>
                    {callAudioMode === 'speaker'
                      ? 'تماس با اسپیکرفون خودکار'
                      : (callAudioMode === 'bluetooth'
                         ? 'تماس با هندزفری ویندوز'
                         : 'برقراری تماس مستقیم')}
                  </span>
                </button>

                <button
                  onClick={() => handleLaunchDialer(dialNumber)}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700 hover:border-cyan-500/40 text-xs font-bold transition-all"
                  title="باز کردن شماره‌گیر پیش‌فرض روی صفحه نمایش گوشی"
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>باز کردن شماره‌گیر در گوشی</span>
                </button>
              </div>

              {/* Quick USSD Section */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-cyan-400" />
                    کدهای دستوری و شارژ سریع (USSD):
                  </span>
                  <button
                    onClick={handleCheckUssdDialog}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20"
                    title="بررسی و بازخوانی آخرین پیام دریافتی از شبکه"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>بررسی پیام شبکه</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5" dir="ltr">
                  <button
                    onClick={() => handleRunUssd()}
                    disabled={ussdLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold transition-all border border-cyan-500/30 disabled:opacity-50 flex items-center gap-1"
                  >
                    <span>ارسال USSD</span>
                  </button>
                  <input
                    type="text"
                    placeholder="*100# or *555#..."
                    value={ussdCode}
                    onChange={(e) => setUssdCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunUssd()}
                    dir="ltr"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-left placeholder:text-right"
                  />
                </div>

                {/* Preset USSD Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1" dir="rtl">
                  {[
                    { label: 'اینترنت همراه اول', code: '*100#' },
                    { label: 'شارژ ایرانسل', code: '*140*11#' },
                    { label: 'منوی ایرانسل', code: '*555#' },
                    { label: 'آپ (۷۳۳)', code: '*733#' },
                    { label: 'هفت هشتاد', code: '*788#' },
                    { label: 'سیمکارت رایتل', code: '*140#' }
                  ].map((chip) => (
                    <button
                      key={chip.code}
                      onClick={() => handleRunUssd(chip.code)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-cyan-500/10 text-[11px] text-slate-300 hover:text-cyan-300 border border-slate-800 transition-all flex items-center gap-1.5"
                    >
                      <span className="text-cyan-400 font-mono font-bold" dir="ltr">{chip.code}</span>
                      <span className="text-slate-400 font-sans">({chip.label})</span>
                    </button>
                  ))}
                </div>

                {/* Live USSD Result & Dialog Box */}
                {ussdDialog && ussdDialog.active && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-b from-[#0a1835] to-[#050e20] border border-cyan-500/40 shadow-xl space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {ussdDialog.title || 'پاسخ پیام شبکه (USSD Result)'}
                      </span>
                      <button
                        onClick={handleDismissUssd}
                        className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                        title="بستن پیام"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 max-h-48 overflow-y-auto">
                      {ussdDialog.message}
                    </div>

                    {/* Interactive USSD Reply Input */}
                    {ussdDialog.hasInput && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="پاسخ منو (مثلاً ۱ یا ۲)..."
                            value={ussdReplyText}
                            onChange={(e) => setUssdReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleReplyUssd()}
                            className="flex-1 bg-slate-900 border border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                          />
                          <button
                            onClick={handleReplyUssd}
                            disabled={!ussdReplyText.trim() || ussdLoading}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            ارسال پاسخ
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={handleDismissUssd}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
                      >
                        بستن پیام (تایید)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Call Logs List Card */}
          <div className="lg:col-span-2 rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">تاریخچه و گزارش مکالمات (Call Logs)</h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Sorting */}
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                  <select
                    value={callSort}
                    onChange={(e) => setCallSort(e.target.value as any)}
                    className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-1 text-xs"
                  >
                    <option value="date_desc" className="bg-slate-900 text-slate-200">جدیدترین</option>
                    <option value="date_asc" className="bg-slate-900 text-slate-200">قدیمی‌ترین</option>
                    <option value="duration_desc" className="bg-slate-900 text-slate-200">طولانی‌ترین</option>
                    <option value="name_asc" className="bg-slate-900 text-slate-200">نام مخاطب</option>
                  </select>
                </div>

                {/* Filters */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  {[
                    { id: 'all', label: 'همه' },
                    { id: 'incoming', label: 'ورودی' },
                    { id: 'outgoing', label: 'خروجی' },
                    { id: 'missed', label: 'بی‌پاسخ' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setCallFilter(f.id as any)}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        callFilter === f.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Refresh Call Logs */}
                <button
                  onClick={fetchCalls}
                  disabled={loading}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-all disabled:opacity-50"
                  title="بروزرسانی و همگام‌سازی تاریخچه تماس‌ها"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
                </button>

                {/* Clear All Calls */}
                <button
                  onClick={handleClearAllCalls}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                  title="پاکسازی کامل لاگ تماس‌ها"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <LoadingSpinner
                  size="md"
                  variant="cyan"
                  text="در حال بارگذاری تاریخچه مکالمات..."
                />
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                هیچ تماسی در این دسته یافت نشد.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-slate-800/60 max-h-[480px] overflow-y-auto pr-1 font-sans text-xs">
                  {paginatedCalls.map((call) => {
                    const isCallHighlighted = highlightedKey && (
                      highlightedKey === call.id || 
                      (call.number && (call.number.includes(highlightedKey) || highlightedKey.includes(call.number))) ||
                      (call.name && (call.name.includes(highlightedKey) || highlightedKey.includes(call.name)))
                    );

                    const isIncoming = call.type === 'incoming';
                    const isOutgoing = call.type === 'outgoing';
                    const isMissed = call.type === 'missed';
                    const isRejected = call.type === 'rejected';

                    const callTheme = isIncoming
                      ? {
                          container: 'bg-emerald-950/25 hover:bg-emerald-900/35 border-r-4 border-r-emerald-500 border border-emerald-500/25',
                          iconBox: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10',
                          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                          label: 'تماس دریافتی',
                          Icon: PhoneIncoming
                        }
                      : isOutgoing
                      ? {
                          container: 'bg-cyan-950/25 hover:bg-cyan-900/35 border-r-4 border-r-cyan-500 border border-cyan-500/25',
                          iconBox: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10',
                          badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
                          label: 'تماس خروجی (ارسالی)',
                          Icon: PhoneOutgoing
                        }
                      : isMissed
                      ? {
                          container: 'bg-rose-950/25 hover:bg-rose-900/35 border-r-4 border-r-rose-500 border border-rose-500/25',
                          iconBox: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10',
                          badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                          label: 'تماس بی‌پاسخ',
                          Icon: PhoneMissed
                        }
                      : {
                          container: 'bg-amber-950/25 hover:bg-amber-900/35 border-r-4 border-r-amber-500 border border-amber-500/25',
                          iconBox: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10',
                          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                          label: 'تماس رد شده',
                          Icon: PhoneOff
                        };

                    const DirectionIcon = callTheme.Icon;

                    return (
                      <div 
                        key={call.id} 
                        className={`flex items-center justify-between p-3.5 my-1.5 transition-all group rounded-2xl ${
                          isCallHighlighted 
                            ? 'animate-highlightGlow bg-amber-500/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20' 
                            : callTheme.container
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Direction Icon */}
                          <div className={`p-2.5 rounded-xl border ${callTheme.iconBox}`}>
                            <DirectionIcon className="w-4 h-4" />
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-xs">{call.name}</h4>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${callTheme.badge}`}>
                                <DirectionIcon className="w-2.5 h-2.5" />
                                <span>{callTheme.label}</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5 text-left" dir="ltr">{call.number}</p>
                          </div>
                        </div>

                      <div className="flex items-center gap-4">
                        <div className="text-left text-[11px] text-slate-400 font-mono">
                          <div>{call.timestamp}</div>
                          <div className="text-[10px] text-slate-500">{call.duration}</div>
                        </div>

                        {/* Quick Call Action */}
                        <button
                          onClick={() => handleMakeCall(call.number, call.name)}
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
                          title="تماس مجدد"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Action */}
                        <button
                          onClick={() => handleDeleteCall(call.id)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                          title="حذف از تاریخچه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>

                {filteredCalls.length > callPageSize && (
                  <PaginationBar
                    currentPage={safeCallPage}
                    totalPages={totalCallPages}
                    totalItems={filteredCalls.length}
                    pageSize={callPageSize}
                    onPageChange={setCallPage}
                    onPageSizeChange={(newSize) => {
                      setCallPageSize(newSize);
                      setCallPage(1);
                    }}
                    itemLabel="تماس"
                    variant="cyan"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CONTACTS VIEW */}
      {/* ========================================================= */}
      {subTab === 'contacts' && (
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-5">
          {/* Header and Controls */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">دفترچه مخاطبین (Contacts Manager)</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-xs border border-cyan-500/20">
                    {filteredContacts.length} از {contacts.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  نمایش و مدیریت کامل مخاطبین به تفکیک منابع (گوگل، شیائومی، سیم‌کارت، پیام‌رسان‌ها و حافظه)
                </p>
              </div>
            </div>

            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو در نام، شماره یا منبع..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {contactSearch && (
                  <button
                    onClick={() => setContactSearch('')}
                    className="absolute left-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-2 rounded-xl border border-slate-800 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={contactSort}
                  onChange={(e) => setContactSort(e.target.value as any)}
                  className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-1 text-xs"
                >
                  <option value="name_asc" className="bg-slate-900 text-slate-200">الفبا (الف - ی)</option>
                  <option value="name_desc" className="bg-slate-900 text-slate-200">الفبا (ی - الف)</option>
                  <option value="phone_asc" className="bg-slate-900 text-slate-200">شماره تلفن</option>
                  <option value="source_asc" className="bg-slate-900 text-slate-200">مرجع / منبع حساب</option>
                </select>
              </div>

              {/* Merge Duplicates Button */}
              {findDuplicates.length > 0 && (
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-yellow-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm group hover-lift animate-pulse-glow"
                  title="شناسایی و ادغام هوشمند مخاطبین تکراری و مشترک"
                >
                  <GitMerge className="w-4 h-4 text-yellow-400 group-hover:rotate-180 transition-transform duration-300" />
                  <span>ادغام تکراری‌ها</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold font-mono text-[10px]">
                    {findDuplicates.length}
                  </span>
                </button>
              )}

              {/* Toggle Multi-Select Mode */}
              <button
                onClick={() => {
                  setIsContactSelectMode(!isContactSelectMode);
                  if (isContactSelectMode) setSelectedContacts([]);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isContactSelectMode 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
                title="حالت انتخاب چندتایی مخاطبین"
              >
                <ListChecks className="w-4 h-4" />
                <span className="hidden sm:inline">انتخاب گروهی</span>
              </button>

              {/* Add New Contact */}
              <button
                onClick={() => {
                  setEditingContact(null);
                  resetContactForm();
                  setShowContactModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all whitespace-nowrap hover-lift"
              >
                <UserPlus className="w-4 h-4" />
                <span>مخاطب جدید</span>
              </button>

              {/* Export Dropdown / Buttons */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => handleExportContacts('vcf')}
                  className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white text-xs font-medium hover:bg-slate-800"
                  title="دانلود فایل VCF مخاطبین"
                >
                  VCF
                </button>
                <button
                  onClick={() => handleExportContacts('csv')}
                  className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white text-xs font-medium hover:bg-slate-800"
                  title="دانلود فایل CSV مخاطبین"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExportContacts('json')}
                  className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white text-xs font-medium hover:bg-slate-800"
                  title="دانلود فایل JSON مخاطبین"
                >
                  JSON
                </button>
              </div>

              {/* Clear All Contacts */}
              <button
                onClick={handleClearAllContacts}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                title="پاکسازی کامل تمامی مخاطبین گوشی (Clear All Contacts)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Account & Source Filters (تفکیک و تجمعی) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 text-[11px] whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>فیلتر منبع:</span>
            </span>
            {contactSources.map(src => {
              const isActive = contactSourceFilter === src.key;
              return (
                <button
                  key={src.key}
                  onClick={() => setContactSourceFilter(src.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border ${
                    isActive 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/10' 
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>{src.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                    isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {src.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Multi-Selection Action Toolbar */}
          {(isContactSelectMode || selectedContacts.length > 0) && (
            <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between animate-fadeIn text-xs">
              <button
                onClick={() => handleSelectAllContacts(filteredContacts)}
                className="flex items-center gap-2 text-cyan-300 font-bold hover:text-cyan-200"
              >
                {selectedContacts.length === filteredContacts.length && filteredContacts.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>{selectedContacts.length === filteredContacts.length ? 'لغو انتخاب همه' : 'انتخاب همه مخاطبین این بخش'}</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-xs">
                  {selectedContacts.length} مخاطب انتخاب شده
                </span>
                {selectedContacts.length > 0 && (
                  <button
                    onClick={handleDeleteSelectedContacts}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/30"
                    title="حذف مخاطبین انتخاب شده"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف انتخابی ({selectedContacts.length})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Contacts Pagination Bar (Top) */}
          {filteredContacts.length > contactPageSize && (
            <PaginationBar
              currentPage={safeContactPage}
              totalPages={totalContactPages}
              totalItems={filteredContacts.length}
              pageSize={contactPageSize}
              onPageChange={setContactPage}
              onPageSizeChange={(newSize) => {
                setContactPageSize(newSize);
                setContactPage(1);
              }}
              itemLabel="مخاطب"
              variant="cyan"
            />
          )}

          {/* Contacts Cards Grid */}
          {loading ? (
            <div className="p-16 text-center">
              <LoadingSpinner
                size="lg"
                variant="cyan"
                text="در حال بارگذاری دفترچه مخاطبین از گوشی..."
                subtext="تفکیک حساب‌ها و استخراج شماره‌ها"
              />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              {contactSearch || contactSourceFilter !== 'all' 
                ? 'مخاطبی مطابق با فیلتر یا جستجوی انتخابی یافت نشد.' 
                : 'هیچ مخاطبی در دستگاه یافت نشد.'}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                {paginatedContacts.map((contact) => {
                  const isChecked = selectedContacts.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => {
                        if (isContactSelectMode) toggleSelectContact(contact.id);
                      }}
                      className={`p-4 rounded-2xl bg-slate-900/70 border hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 ${
                        isChecked 
                          ? 'ring-1 ring-cyan-500/60 bg-cyan-950/30 border-cyan-500/40' 
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox (in selection mode) */}
                        {isContactSelectMode && (
                          <div 
                            onClick={(e) => toggleSelectContact(contact.id, e)} 
                            className="pt-1 text-cyan-400 cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                            )}
                          </div>
                        )}

                        {/* Avatar Image or Initial */}
                        {contact.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="w-11 h-11 rounded-xl object-cover border border-cyan-500/40 shadow-md shadow-cyan-500/20 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 font-bold text-slate-950 flex items-center justify-center text-base shadow-md shadow-cyan-500/20 flex-shrink-0">
                            {contact.name ? contact.name.charAt(0) : '؟'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 text-right space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-white text-xs truncate max-w-[140px] flex items-center gap-1">
                              <span>{contact.name}</span>
                              {contact.nickname && (
                                <span className="text-[10px] text-amber-300/80 font-normal">({contact.nickname})</span>
                              )}
                            </h4>
                            {contact.sourceLabel && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-sans bg-slate-800 text-slate-400 border border-slate-700/60 truncate max-w-[100px]" title={contact.sourceLabel}>
                                {contact.sourceLabel}
                              </span>
                            )}
                          </div>

                          {/* Phone & Secondary Phone */}
                          <div className="space-y-0.5">
                            <p className="text-xs text-cyan-400 font-mono select-text text-left" dir="ltr">{contact.phone}</p>
                            {contact.secondaryPhone && (
                              <p className="text-[10px] text-slate-400 font-mono text-left flex items-center gap-1" dir="ltr">
                                <PhoneForwarded className="w-2.5 h-2.5 text-slate-500" />
                                <span>{contact.secondaryPhone}</span>
                              </p>
                            )}
                          </div>

                          {/* Company & Job Title */}
                          {(contact.company || contact.jobTitle) && (
                            <p className="text-[10px] text-amber-200/80 font-sans truncate flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-amber-400/70 shrink-0" />
                              <span>{[contact.jobTitle, contact.company].filter(Boolean).join(' • ')}</span>
                            </p>
                          )}

                          {/* Email */}
                          {contact.email && (
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{contact.email}</span>
                            </p>
                          )}

                          {/* Address or Birthday Extra Badges */}
                          {(contact.address || contact.birthday || contact.relationship) && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {contact.relationship && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 text-[9px] border border-cyan-500/30">
                                  {contact.relationship}
                                </span>
                              )}
                              {contact.birthday && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 text-[9px] border border-purple-500/30 flex items-center gap-1">
                                  <Cake className="w-2.5 h-2.5" />
                                  <span>{contact.birthday}</span>
                                </span>
                              )}
                              {contact.address && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] truncate max-w-[140px] flex items-center gap-1" title={contact.address}>
                                  <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                  <span className="truncate">{contact.address}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {contact.notes && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-sans">
                              {contact.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMakeCall(contact.phone, contact.name);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
                            title="تماس صوتی"
                          >
                            <Phone className="w-3 h-3" />
                            <span>تماس</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewSmsRecipient(contact.phone);
                              setShowNewSmsModal(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
                            title="ارسال پیامک"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>پیامک</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Edit Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditContact(contact);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700/60 transition-all"
                            title="ویرایش اطلاعات مخاطب"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContact(contact.id, contact.name, contact.rawContactId);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-all"
                            title="حذف مخاطب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contacts Pagination Bar (Bottom) */}
              {filteredContacts.length > contactPageSize && (
                <PaginationBar
                  currentPage={safeContactPage}
                  totalPages={totalContactPages}
                  totalItems={filteredContacts.length}
                  pageSize={contactPageSize}
                  onPageChange={setContactPage}
                  onPageSizeChange={(newSize) => {
                    setContactPageSize(newSize);
                    setContactPage(1);
                  }}
                  itemLabel="مخاطب"
                  variant="cyan"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SMS & MESSAGES VIEW */}
      {/* ========================================================= */}
      {subTab === 'sms' && (
        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-3 min-h-[580px]">
          {/* Left Column: Threads List & Controls */}
          <div className="border-l border-slate-800 p-4 space-y-3 bg-[#080d1a]/80 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header & Main Actions */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>گفتگوها (SMS)</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-cyan-300">
                    {filteredThreadKeys.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* New SMS */}
                  <button
                    onClick={() => {
                      setNewSmsRecipient('');
                      setShowNewSmsModal(true);
                    }}
                    className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all"
                    title="ارسال پیامک جدید"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Toggle Multi-Select Mode */}
                  <button
                    onClick={() => {
                      setIsSmsSelectMode(!isSmsSelectMode);
                      if (isSmsSelectMode) setSelectedSmsThreads([]);
                    }}
                    className={`p-1.5 rounded-lg transition-all border ${
                      isSmsSelectMode 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                    title={isSmsSelectMode ? 'خروج از حالت انتخاب' : 'حالت انتخاب چندتایی'}
                  >
                    <ListChecks className="w-4 h-4" />
                  </button>

                  {/* Refresh SMS */}
                  <button
                    onClick={fetchSms}
                    disabled={loading}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-all disabled:opacity-50"
                    title="بروزرسانی و همگام‌سازی پیامک‌ها"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>

                  {/* Export Backup JSON */}
                  <button
                    onClick={handleExportSms}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
                    title="پشتیبان JSON پیامک‌ها"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Open SMS app on Phone */}
                  <button
                    onClick={handleOpenSmsApp}
                    className="p-1.5 rounded-lg bg-slate-900 text-cyan-400 hover:text-cyan-200 border border-slate-800 transition-all"
                    title="باز کردن برنامه پیام‌ها روی صفحه گوشی"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>

                  {/* Clear All SMS */}
                  <button
                    onClick={handleClearAllSms}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                    title="پاکسازی کامل تمام پیامک‌ها (Clear All SMS)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* SMS Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="جستجو در نام، شماره یا متن پیام..."
                  value={smsSearch}
                  onChange={(e) => setSmsSearch(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800/80 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                {smsSearch && (
                  <button
                    onClick={() => setSmsSearch('')}
                    className="absolute left-2.5 top-2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* SMS Category Filter Bar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                {[
                  { id: 'all', label: 'همه', count: smsCategoryCounts.all, icon: MessageSquare },
                  { id: 'inbox', label: 'ورودی', count: smsCategoryCounts.inbox, icon: Inbox },
                  { id: 'sent', label: 'ارسال‌شده', count: smsCategoryCounts.sent, icon: Send },
                  { id: 'banking', label: 'بانکی و رمز', count: smsCategoryCounts.banking, icon: CreditCard },
                  { id: 'spam', label: 'اسپم و تبلیغات', count: smsCategoryCounts.spam, icon: ShieldAlert },
                  { id: 'blocked', label: 'مسدودشده', count: smsCategoryCounts.blocked, icon: Ban },
                  { id: 'drafts', label: 'پیش‌نویس', count: smsCategoryCounts.drafts, icon: FileEdit }
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isActive = smsCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSmsCategoryFilter(cat.id as any);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all border ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{cat.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] ${
                        isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Multi-Selection Action Toolbar */}
              {(isSmsSelectMode || selectedSmsThreads.length > 0) && (
                <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-2 flex items-center justify-between animate-fadeIn text-xs">
                  <button
                    onClick={() => handleSelectAllThreads(filteredThreadKeys)}
                    className="flex items-center gap-1.5 text-cyan-300 font-semibold hover:text-cyan-200"
                  >
                    {selectedSmsThreads.length === filteredThreadKeys.length && filteredThreadKeys.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{selectedSmsThreads.length === filteredThreadKeys.length ? 'لغو انتخاب همه' : 'انتخاب همه'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {selectedSmsThreads.length} مورد انتخاب شد
                    </span>
                    {selectedSmsThreads.length > 0 && (
                      <button
                        onClick={handleDeleteSelectedThreads}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-all shadow-md shadow-rose-600/20"
                        title="حذف گفتگوهای انتخاب شده"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف انتخابی</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Threads Scroll List */}
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredThreadKeys.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    {smsSearch ? 'موردی مطابق با جستجوی شما یافت نشد.' : 'هیچ پیامکی در این دسته‌بندی یافت نشد.'}
                  </div>
                ) : (
                  filteredThreadKeys.map((threadKey) => {
                    const msgs = smsThreads[threadKey];
                    const lastMsg = msgs[0];
                    const isSelected = selectedThread === threadKey;
                    const isItemChecked = selectedSmsThreads.includes(threadKey);
                    const isThreadHighlighted = highlightedKey && (
                      highlightedKey === threadKey || 
                      (lastMsg?.number && (lastMsg.number.includes(highlightedKey) || highlightedKey.includes(lastMsg.number))) ||
                      (lastMsg?.sender && (lastMsg.sender.includes(highlightedKey) || highlightedKey.includes(lastMsg.sender)))
                    );

                    return (
                      <div
                        key={threadKey}
                        onClick={() => {
                          if (isSmsSelectMode) {
                            toggleSelectThread(threadKey);
                          } else {
                            setSelectedThread(threadKey);
                          }
                        }}
                        className={`group relative p-3 rounded-xl cursor-pointer transition-all border text-right flex items-start justify-between gap-2 ${
                          isThreadHighlighted
                            ? 'animate-highlightGlow bg-amber-500/20 border-2 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20'
                            : isSelected 
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' 
                            : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                        } ${isItemChecked ? 'ring-1 ring-cyan-500/60 bg-cyan-950/30' : ''}`}
                      >
                        {/* Checkbox (in selection mode or always toggleable) */}
                        {isSmsSelectMode && (
                          <div 
                            onClick={(e) => toggleSelectThread(threadKey, e)}
                            className="pt-0.5 text-cyan-400"
                          >
                            {isItemChecked ? (
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                            )}
                          </div>
                        )}

                        {/* Thread Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white text-xs truncate max-w-[130px]">
                              {lastMsg.sender || lastMsg.number}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {lastMsg.timestamp}
                            </span>
                          </div>

                          {/* Category & Direction Tag Badges */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* Direction: Received vs Sent */}
                            {lastMsg.type === 'inbox' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-sans font-bold border border-emerald-500/35 flex items-center gap-0.5">
                                <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-400" />
                                <span>دریافتی</span>
                              </span>
                            ) : lastMsg.type === 'sent' ? (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-sans font-bold border border-cyan-500/35 flex items-center gap-0.5">
                                <ArrowUpRight className="w-2.5 h-2.5 text-cyan-400" />
                                <span>ارسالی</span>
                              </span>
                            ) : null}

                            {lastMsg.isBank && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-sans border border-amber-500/30">
                                💳 بانکی
                              </span>
                            )}
                            {lastMsg.isOtp && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-sans border border-emerald-500/30">
                                🔑 رمز موقت
                              </span>
                            )}
                            {lastMsg.isSpam && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-sans border border-rose-500/30">
                                🛡️ اسپم
                              </span>
                            )}
                            {lastMsg.isBlocked && (
                              <span className="px-1.5 py-0.2 rounded bg-red-950/60 text-red-300 text-[9px] font-sans border border-red-700/60">
                                🚫 مسدود
                              </span>
                            )}
                            {lastMsg.type === 'draft' && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-sans border border-purple-500/30">
                                📝 پیش‌نویس
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 truncate max-w-full font-sans leading-snug" dir="auto">
                            {lastMsg.body || '(پیام بدون متن)'}
                          </p>
                        </div>

                        {/* Message Count & Quick Delete Thread Button */}
                        <div className="flex items-center gap-1.5 self-center">
                          {msgs.length > 1 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400">
                              {msgs.length}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleDeleteThread(threadKey, lastMsg.number, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="حذف کل این گفتگو"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Active Thread Chat */}
          <div className="lg:col-span-2 flex flex-col justify-between bg-[#050914] p-4">
            {selectedThread && activeThreadMessages.length > 0 ? (
              <>
                {/* Active Chat Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-right">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">
                        {activeThreadMessages[0]?.sender || activeThreadRecipient}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-[10px] font-mono text-cyan-400 border border-cyan-500/20">
                        {activeThreadMessages.length} پیام
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{activeThreadRecipient}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Instant Call */}
                    <button
                      onClick={() => handleMakeCall(activeThreadRecipient)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
                      title="تماس مستقیم با این شماره"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>تماس</span>
                    </button>

                    {/* Delete Thread */}
                    <button
                      onClick={(e) => handleDeleteThread(selectedThread, activeThreadRecipient, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
                      title="حذف این گفتگو"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف گفتگو</span>
                    </button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3.5 max-h-[380px] my-2 bg-slate-950/40 rounded-2xl border border-slate-900/80">
                  {activeThreadMessages.map((msg, idx) => {
                    const isSent = msg.type === 'sent';
                    const isMsgHighlighted = Boolean(highlightedKey && (
                      highlightedKey === String(msg.id) ||
                      (msg.number && highlightedKey.includes(msg.number))
                    ));
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isSent ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`relative group/msg max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md transition-all ${
                            isMsgHighlighted
                              ? 'ring-4 ring-amber-400 shadow-2xl shadow-amber-400/40 animate-highlightGlow'
                              : ''
                          } ${
                            isSent
                              ? 'bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-600 text-slate-950 font-medium rounded-br-none shadow-cyan-600/25 border border-cyan-400/40'
                              : 'bg-gradient-to-br from-emerald-950/70 via-slate-900/90 to-teal-950/50 text-emerald-50 rounded-bl-none border border-emerald-500/40 shadow-emerald-950/40'
                          }`}
                        >
                          {/* Direction Header Indicator */}
                          <div className={`flex items-center justify-between gap-1.5 text-[10px] font-bold mb-1.5 pb-1 border-b ${
                            isSent ? 'text-slate-950 border-slate-950/20' : 'text-emerald-400 border-emerald-500/25'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              {isSent ? (
                                <>
                                  <ArrowUpRight className="w-3 h-3 text-slate-950" />
                                  <span>پیامک ارسالی (خروجی)</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                                  <span>پیامک دریافتی (ورودی)</span>
                                </>
                              )}
                            </div>
                            {isMsgHighlighted && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] shadow-sm animate-pulse">
                                ⭐ پیام بازشده از اعلان
                              </span>
                            )}
                          </div>

                          {/* Tags Indicator */}
                          {(msg.isBank || msg.isOtp || msg.isSpam || msg.isBlocked || msg.type === 'draft') && (
                            <div className={`flex items-center gap-1.5 mb-2 flex-wrap pb-1.5 border-b ${
                              isSent ? 'border-slate-950/20' : 'border-emerald-500/20'
                            }`}>
                              {msg.isBank && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-sans border border-amber-500/30 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3 text-amber-400" />
                                  <span>تراکنش بانکی</span>
                                </span>
                              )}
                              {msg.isOtp && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-sans border border-emerald-500/30 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  <span>رمز یکبار مصرف / OTP</span>
                                </span>
                              )}
                              {msg.isSpam && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-sans border border-rose-500/30 flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                                  <span>پیامک تبلیغاتی / اسپم</span>
                                </span>
                              )}
                              {msg.isBlocked && (
                                <span className="px-2 py-0.5 rounded-md bg-red-900/60 text-red-200 text-[10px] font-sans border border-red-700/60 flex items-center gap-1">
                                  <Ban className="w-3 h-3 text-red-300" />
                                  <span>شماره مسدودشده</span>
                                </span>
                              )}
                              {msg.type === 'draft' && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-sans border border-purple-500/30 flex items-center gap-1">
                                  <FileEdit className="w-3 h-3 text-purple-400" />
                                  <span>پیش‌نویس</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Full Message Text Body */}
                          <p className={`whitespace-pre-wrap select-text font-sans break-words text-right leading-relaxed ${
                            isSent ? 'text-slate-950 font-medium' : 'text-slate-100'
                          }`} dir="auto">
                            {msg.body || '(بدون محتوا)'}
                          </p>

                          {/* Bottom Message Info & 1-Click Copy */}
                          <div className={`flex items-center justify-between gap-3 mt-2.5 pt-1.5 border-t text-[10px] ${
                            isSent ? 'border-slate-950/20' : 'border-emerald-500/20'
                          }`}>
                            <div className={`flex items-center gap-1 font-mono ${isSent ? 'text-slate-950/90 font-bold' : 'text-emerald-300/80'}`}>
                              <span>{msg.timestamp}</span>
                              {isSent && <CheckCheck className="w-3 h-3 inline text-slate-950 font-bold" />}
                            </div>

                            {/* Copy Message Button */}
                            {msg.body && (
                              <button
                                onClick={() => handleCopyMessageText(msg.id, msg.body)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all border ${
                                  isSent
                                    ? 'bg-slate-950/20 text-slate-950 border-slate-950/30 hover:bg-slate-950/30'
                                    : 'bg-slate-900/80 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                                }`}
                                title="کپی متن کامل پیامک"
                              >
                                {copiedMsgId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 text-[9px] font-bold">کپی شد</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span className="text-[9px]">کپی متن</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Send Reply Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <input
                    type="text"
                    value={newSmsText}
                    onChange={(e) => setNewSmsText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendSms(activeThreadRecipient, newSmsText);
                      }
                    }}
                    placeholder="پاسخ به این گفتگو..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleSendSms(activeThreadRecipient, newSmsText)}
                    disabled={!newSmsText.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
                <MessageSquare className="w-12 h-12 stroke-[1.5] text-slate-700" />
                <p className="text-xs">یک گفتگو را از لیست سمت راست انتخاب کنید یا پیامک جدید ارسال نمایید.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADD / EDIT CONTACT MODAL WITH AVATAR & ADVANCED FIELDS --- */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0c142b] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-lg text-right space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {editingContact ? (
                  <Edit3 className="w-5 h-5 text-cyan-400" />
                ) : (
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                )}
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingContact ? 'ویرایش جامع مشخصات مخاطب' : 'افزودن مخاطب جدید با تمام مشخصات'}
                  </h3>
                  {editingContact?.sourceLabel && (
                    <span className="text-[10px] text-cyan-400 font-sans block">
                      مرجع ذخیره: {editingContact.sourceLabel}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowContactModal(false);
                  setEditingContact(null);
                }} 
                className="text-slate-400 hover:text-slate-200 p-1"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Section Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setContactModalTab('basic')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all ${
                  contactModalTab === 'basic' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                اطلاعات پایه و تماس
              </button>
              <button
                type="button"
                onClick={() => setContactModalTab('work')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all ${
                  contactModalTab === 'work' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                شغل و سازمان
              </button>
              <button
                type="button"
                onClick={() => setContactModalTab('personal')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all ${
                  contactModalTab === 'personal' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                مشخصات تکمیلی و آدرس
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 text-xs pr-1">
              {/* 1. Basic Info & Avatar Tab */}
              {contactModalTab === 'basic' && (
                <div className="space-y-3">
                  {/* Avatar Picker */}
                  <div className="flex items-center gap-4 p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                    <div className="relative group">
                      {contactForm.avatar ? (
                        <img
                          src={contactForm.avatar}
                          alt="Avatar"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-slate-950 shadow-md">
                          {contactForm.name ? contactForm.name.charAt(0) : '👤'}
                        </div>
                      )}
                      {contactForm.avatar && (
                        <button
                          type="button"
                          onClick={() => setContactForm({ ...contactForm, avatar: '' })}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow"
                          title="حذف تصویر آواتار"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <span className="text-xs font-bold text-white block">تصویر پروفایل و آواتار مخاطب:</span>
                      <p className="text-[10px] text-slate-400">انتخاب عکس دلخواه از روی سیستم یا فایل‌ها</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold cursor-pointer border border-slate-700 transition-all">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>آپلود عکس آواتار</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setContactForm({ ...contactForm, avatar: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">نام و نام خانوادگی:*</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="مثال: مهندس علی رضایی"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">شماره تماس اصلی (موبایل):*</label>
                      <input
                        type="text"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="09121234567"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-cyan-300 text-left focus:outline-none focus:border-cyan-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">شماره دوم (منزل / محل کار):</label>
                      <input
                        type="text"
                        value={contactForm.secondaryPhone}
                        onChange={(e) => setContactForm({ ...contactForm, secondaryPhone: e.target.value })}
                        placeholder="02188776655"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-300 text-left focus:outline-none focus:border-cyan-500"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">پست الکترونیکی (ایمیل):</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 text-left focus:outline-none focus:border-cyan-500"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* 2. Work & Organization Tab */}
              {contactModalTab === 'work' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 block mb-1">شرکت، سازمان یا دانشگاه:</label>
                    <input
                      type="text"
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="مثال: شرکت راهکار الکترونیک سهند"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">عنوان شغلی و سمت:</label>
                    <input
                      type="text"
                      value={contactForm.jobTitle}
                      onChange={(e) => setContactForm({ ...contactForm, jobTitle: e.target.value })}
                      placeholder="مثال: مدیر فنی / کارشناس ارشد"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">وب‌سایت یا لینک شبکه اجتماعی:</label>
                    <input
                      type="text"
                      value={contactForm.website}
                      onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })}
                      placeholder="https://irres.ir"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-cyan-300 text-left focus:outline-none focus:border-cyan-500"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* 3. Personal & Extended Info Tab */}
              {contactModalTab === 'personal' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">نام مستعار یا کوتاه:</label>
                      <input
                        type="text"
                        value={contactForm.nickname}
                        onChange={(e) => setContactForm({ ...contactForm, nickname: e.target.value })}
                        placeholder="علی، دکتر..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">دسته‌بندی و نسبت:</label>
                      <select
                        value={contactForm.relationship}
                        onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="همکار">همکار (Colleague)</option>
                        <option value="خانواده">خانواده (Family)</option>
                        <option value="دوست">دوست (Friend)</option>
                        <option value="مشتری">مشتری (Client)</option>
                        <option value="ویژه / VIP">ویژه / VIP</option>
                        <option value="سایر">سایر</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">تاریخ تولد یا سالگرد:</label>
                      <input
                        type="text"
                        value={contactForm.birthday}
                        onChange={(e) => setContactForm({ ...contactForm, birthday: e.target.value })}
                        placeholder="مثال: ۱۳۷۰/۰۵/۱۵"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">آدرس محل سکونت / کار:</label>
                      <input
                        type="text"
                        value={contactForm.address}
                        onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                        placeholder="تهران، خیابان..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">یادداشت‌ها و توضیحات اختصاصی:</label>
                    <textarea
                      rows={2}
                      value={contactForm.notes}
                      onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                      placeholder="توضیحات و نکات تکمیلی در مورد مخاطب..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>بخش فعال: {contactModalTab === 'basic' ? 'اطلاعات پایه' : contactModalTab === 'work' ? 'شغل و سازمان' : 'مشخصات فردی'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setEditingContact(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSaveContact}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
                >
                  {editingContact ? 'ذخیره تغییرات' : 'ذخیره در گوشی'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MERGE DUPLICATE CONTACTS MODAL --- */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0c142b] border border-amber-500/40 rounded-3xl p-6 w-full max-w-2xl text-right space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-yellow-300">
                  <GitMerge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    ادغام و یکپارچه‌سازی مخاطبین مشترک
                  </h3>
                  <p className="text-xs text-amber-200/70 mt-0.5">
                    شناسایی {findDuplicates.length} دسته مخاطب با شماره یا نام مشترک
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowMergeModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/25 flex items-center justify-between gap-3 text-xs">
              <span className="text-amber-200">
                با ادغام، شماره‌های فرعی، ایمیل‌ها و یادداشت‌های هر گروه در یک مخاطب جامع تجمیع شده و رکوردهای تکراری حذف خواهند شد.
              </span>
              <button
                onClick={handleMergeAllDuplicates}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 whitespace-nowrap shrink-0 hover-lift"
              >
                ادغام خودکار همه ({findDuplicates.length})
              </button>
            </div>

            {/* Duplicates Groups List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/60 max-h-[420px]">
              {findDuplicates.map((group) => (
                <div key={group.key} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>{group.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({group.contacts.length} مورد مشابه)</span>
                    </span>

                    <button
                      onClick={() => handleMergeGroup(group)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold transition-all border border-cyan-500/30"
                      title="ادغام این گروه"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>ادغام این دسته</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.contacts.map((c, idx) => (
                      <div key={c.id + idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {idx === 0 ? 'اصلی' : `#${idx + 1}`}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-white truncate">{c.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{c.phone}</div>
                          </div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                          {c.sourceLabel || 'مخاطب'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- COMPOSE NEW SMS MODAL --- */}
      {showNewSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0c142b] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-md text-right space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                <span>ارسال پیامک جدید</span>
              </h3>
              <button onClick={() => setShowNewSmsModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">شماره مقصد:</label>
                <input
                  type="text"
                  value={newSmsRecipient}
                  onChange={(e) => setNewSmsRecipient(e.target.value)}
                  placeholder="09121234567"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">متن پیامک:</label>
                <textarea
                  rows={4}
                  value={newSmsText}
                  onChange={(e) => setNewSmsText(e.target.value)}
                  placeholder="متن پیامک..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewSmsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              >
                انصراف
              </button>
              <button
                onClick={() => handleSendSms(newSmsRecipient, newSmsText)}
                disabled={!newSmsRecipient.trim() || !newSmsText.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                ارسال پیامک
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DIALER CONTACT PICKER MODAL --- */}
      {showDialerContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0c142b] border border-cyan-500/40 rounded-3xl p-6 w-full max-w-lg text-right space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>انتخاب مخاطب برای تماس ({contacts.length} مخاطب)</span>
              </h3>
              <button 
                onClick={() => setShowDialerContactModal(false)} 
                className="text-slate-400 hover:text-slate-200 p-1"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar in Modal */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="جستجو بر اساس نام، شماره تلفن، شرکت یا ایمیل..."
                value={dialerContactSearch}
                onChange={(e) => setDialerContactSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-9 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
              />
              {dialerContactSearch && (
                <button
                  onClick={() => setDialerContactSearch('')}
                  className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Source Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {contactSources.map((source) => (
                <button
                  key={source.key}
                  type="button"
                  onClick={() => setDialerContactSourceFilter(source.key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                    dialerContactSourceFilter === source.key
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{source.label}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                    dialerContactSourceFilter === source.key ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {source.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Contacts Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[380px] divide-y divide-slate-800/40">
              {dialerModalContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-sans">
                  مخاطبی مطابق با جستجوی شما یافت نشد.
                </div>
              ) : (
                dialerModalContacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setDialNumber(c.phone || '');
                      setDialerContactName(c.name);
                      setShowDialerContactModal(false);
                    }}
                    className="p-3 hover:bg-cyan-500/10 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition-all border border-transparent hover:border-cyan-500/30 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm">
                        {(c.name || 'م')[0]}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {c.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-cyan-400 font-mono" dir="ltr">{c.phone}</span>
                          {c.company && (
                            <span className="text-[10px] text-slate-500">({c.company})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                        {c.sourceLabel || 'مخاطب'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMakeCall(c.phone, c.name);
                          setShowDialerContactModal(false);
                        }}
                        className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 transition-all border border-emerald-500/30"
                        title="برقراری تماس مستقیم"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDialerContactModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BLUETOOTH HANDSFREE ASSISTANT MODAL --- */}
      {showBluetoothModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0c142b] border border-cyan-500/40 rounded-3xl p-6 w-full max-w-xl text-right space-y-4 shadow-2xl animate-fadeInScale max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 text-cyan-400">
                  <Bluetooth className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">دستیار جفت‌سازی بلوتوث و مکالمه مستقیم ویندوز</h3>
                  <p className="text-[11px] text-slate-400">اتصال صوتی دوطرفه (میکروفون و بلندگو) جهت مکالمه بدون لمس گوشی</p>
                </div>
              </div>
              <button
                onClick={() => setShowBluetoothModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bluetoothInfo.loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="md" variant="cyan" text="در حال ارزیابی وضعیت سخت‌افزار بلوتوث سیستم و گوشی..." />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Windows PC Bluetooth Status Card */}
                <div className={`p-4 rounded-2xl border ${
                  bluetoothInfo.pc?.hasAdapter
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                } space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span>وضعیت سخت‌افزار بلوتوث ویندوز (PC):</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      bluetoothInfo.pc?.hasAdapter
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}>
                      {bluetoothInfo.pc?.hasAdapter ? 'سخت‌افزار آماده است' : 'عدم شناسایی سخت‌افزار بلوتوث'}
                    </span>
                  </div>

                  {bluetoothInfo.pc?.hasAdapter ? (
                    <div className="text-[11px] text-slate-300 space-y-1">
                      <p>آداپتور شناسایی شده: <span className="text-white font-mono">{bluetoothInfo.pc.adapters?.join(', ')}</span></p>
                      {bluetoothInfo.pc.pairedDevices && bluetoothInfo.pc.pairedDevices.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-emerald-500/20">
                          <p className="text-[10px] text-slate-400 mb-1">دستگاه‌های شناخته‌شده ویندوز:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {bluetoothInfo.pc.pairedDevices.map((d: any, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-900/90 text-cyan-300 text-[10px] border border-slate-800 font-mono">
                                {d.FriendlyName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-200/90 space-y-1">
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>کامپیوتر شما فاقد دانگل یا سخت‌افزار بلوتوث داخلی است. برای مکالمه مستقیم با میکروفون سیستم، یک دانگل بلوتوث USB متصل نمایید یا از گزینه «اسپیکرفون خودکار گوشی» استفاده کنید.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Device Bluetooth Status Card */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <span>وضعیت بلوتوث تلفن همراه (گوشی):</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      bluetoothInfo.device?.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {bluetoothInfo.device?.enabled ? 'روشن (ON)' : 'خاموش (OFF)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                    <div>نام بلوتوث دستگاه: <span className="text-white font-bold">{bluetoothInfo.device?.name || 'گوشی همراه'}</span></div>
                    <div>آدرس مک: <span className="text-cyan-400 font-mono" dir="ltr">{bluetoothInfo.device?.address || '00:00:00:00:00:00'}</span></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleAutoPairBluetooth}
                    disabled={autoPairingLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Bluetooth className={`w-4 h-4 ${autoPairingLoading ? 'animate-spin' : ''}`} />
                    <span>{autoPairingLoading ? 'در حال آماده‌سازی و جفت‌سازی...' : '⚡ جفت‌سازی خودکار و آماده‌سازی مکالمه ویندوز'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleOpenPcBluetoothSettings}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>تنظیمات بلوتوث ویندوز</span>
                    </button>

                    <button
                      onClick={handleOpenPcSoundSettings}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold transition-all"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>تنظیمات صدای سیستم</span>
                    </button>
                  </div>
                </div>

                {/* Step-by-Step Educational Guide */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>راهنمای ۳ مرحله‌ای مکالمه مستقیم بدون لمس گوشی:</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed pr-1">
                    <li>روی دکمه <strong className="text-cyan-300">جفت‌سازی خودکار</strong> بالا کلیک کنید تا بلوتوث گوشی و صفحه بلوتوث ویندوز باز شود.</li>
                    <li>در ویندوز روی <strong className="text-white">Add device</strong> کلیک کرده و نام گوشی‌تان (<strong className="text-white">{bluetoothInfo.device?.name}</strong>) را انتخاب و Pair کنید.</li>
                    <li>در گوشی در بخش تنظیمات دستگاه جفت‌شده، گزینه <strong className="text-emerald-400">Phone Calls (تماس‌ها)</strong> را فعال کنید.</li>
                  </ol>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    💡 نکته: در صورتی که کامپیوتر فاقد دانگل بلوتوث است، با انتخاب گزینه <strong className="text-amber-400">«اسپیکرفون خودکار»</strong> در شماره‌گیر، به محض تماس صدای بلندگوی گوشی روشن شده و باز هم نیازی به برداشتن گوشی نخواهید داشت.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBluetoothModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
              >
                متوجه شدم و بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Animated Action Overlay (Anti-Freeze & Multi-Click Lock) */}
      <ActionOverlay
        isOpen={actionProgress.active}
        title={actionProgress.title}
        subtitle={actionProgress.subtitle}
        variant={actionProgress.variant || 'cyan'}
      />
    </div>
  );
};
