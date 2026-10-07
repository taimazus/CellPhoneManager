import React, { useState, useEffect, useRef } from 'react';
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
  ArrowUpDown
} from 'lucide-react';
import { Device } from '../types';

interface MessagesTabProps {
  device: Device | null;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
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
  type: 'inbox' | 'sent';
  read?: boolean;
}

interface CallState {
  state: 'idle' | 'ringing' | 'offhook';
  incomingNumber: string;
  isRinging: boolean;
  isInCall: boolean;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({ device }) => {
  const [subTab, setSubTab] = useState<'calls' | 'contacts' | 'sms'>('calls');
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  // --- Contacts State ---
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState<string>('');
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', notes: '' });

  // --- SMS State ---
  const [smsList, setSmsList] = useState<SmsMessage[]>([]);
  const [smsSearch, setSmsSearch] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newSmsText, setNewSmsText] = useState<string>('');
  const [newSmsRecipient, setNewSmsRecipient] = useState<string>('');
  const [showNewSmsModal, setShowNewSmsModal] = useState<boolean>(false);

  // --- Sorting States ---
  const [callSort, setCallSort] = useState<'date_desc' | 'date_asc' | 'duration_desc' | 'name_asc'>('date_desc');
  const [contactSort, setContactSort] = useState<'name_asc' | 'name_desc' | 'phone_asc'>('name_asc');
  const [smsSort, setSmsSort] = useState<'date_desc' | 'date_asc'>('date_desc');

  const timerRef = useRef<any>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- 0. Poll Call State (Every 2.5 seconds) ---
  const pollCallState = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/calls/state`);
      const data = await res.json();
      if (data && data.state) {
        setCallState({
          state: data.state,
          incomingNumber: data.incomingNumber || '',
          isRinging: data.isRinging || data.state === 'ringing',
          isInCall: data.isInCall || data.state === 'offhook'
        });
      }
    } catch {
      // ignore polling errors quietly
    }
  };

  useEffect(() => {
    if (!device) return;
    pollCallState();
    const interval = setInterval(pollCallState, 2500);
    return () => clearInterval(interval);
  }, [device?.id]);

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
      const res = await fetch(`/api/devices/${device.id}/calls`);
      const data = await res.json();
      if (data.calls) setCallLogs(data.calls);
    } catch (err: any) {
      showToast(`خطا در دریافت لاگ تماس: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Contacts
  const fetchContacts = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/contacts`);
      const data = await res.json();
      if (data.contacts) setContacts(data.contacts);
    } catch (err: any) {
      showToast(`خطا در دریافت مخاطبین: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch SMS
  const fetchSms = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/sms`);
      const data = await res.json();
      if (data.messages) {
        setSmsList(data.messages);
        if (!selectedThread && data.messages.length > 0) {
          setSelectedThread(data.messages[0].threadId);
        }
      }
    } catch (err: any) {
      showToast(`خطا در دریافت پیامک‌ها: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'calls') fetchCalls();
    if (subTab === 'contacts') fetchContacts();
    if (subTab === 'sms') fetchSms();
  }, [device?.id, subTab]);

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
  const handleMakeCall = async (numberToCall: string, name = 'تماس') => {
    if (!device || !numberToCall.trim()) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/calls/make`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: numberToCall, name })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`در حال برقراری تماس با ${numberToCall}...`, 'success');
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
        setCallLogs(callLogs.filter(c => c.id !== callId));
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
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
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // --- Contact Actions ---
  const handleSaveContact = async () => {
    if (!device || !contactForm.name.trim() || !contactForm.phone.trim()) {
      showToast('نام و شماره تلفن الزامی است', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/devices/${device.id}/contacts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('مخاطب با موفقیت ذخیره شد', 'success');
        setShowContactModal(false);
        setContactForm({ name: '', phone: '', email: '', notes: '' });
        fetchContacts();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleDeleteContact = async (contactId: string, name: string) => {
    if (!device) return;
    if (!confirm(`آیا از حذف مخاطب "${name}" اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/devices/${device.id}/contacts/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('مخاطب حذف شد', 'success');
        setContacts(contacts.filter(c => c.id !== contactId));
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleExportContacts = () => {
    if (contacts.length === 0) return;
    let vcfData = '';
    contacts.forEach(c => {
      vcfData += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL;TYPE=CELL:${c.phone}\nEMAIL:${c.email || ''}\nNOTE:${c.notes || ''}\nEND:VCARD\n\n`;
    });

    const blob = new Blob([vcfData], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contacts_Backup_${Date.now()}.vcf`;
    a.click();
    showToast('فایل VCF مخاطبین با موفقیت دانلود شد', 'success');
  };

  // --- SMS Actions ---
  const handleSendSms = async (recipient: string, messageText: string) => {
    if (!device || !recipient.trim() || !messageText.trim()) return;

    try {
      const res = await fetch(`/api/devices/${device.id}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: recipient, body: messageText })
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

  const handleDeleteSms = async (messageId: string) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/sms/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('پیامک حذف شد', 'success');
        setSmsList(smsList.filter(s => s.id !== messageId));
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
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

  // Filters & Sorting
  const filteredCalls = callLogs.filter(c => {
    if (callFilter === 'all') return true;
    return c.type === callFilter;
  }).sort((a, b) => {
    if (callSort === 'date_desc') return (new Date(b.date || 0).getTime()) - (new Date(a.date || 0).getTime());
    if (callSort === 'date_asc') return (new Date(a.date || 0).getTime()) - (new Date(b.date || 0).getTime());
    if (callSort === 'duration_desc') return (parseInt(b.duration || '0', 10)) - (parseInt(a.duration || '0', 10));
    if (callSort === 'name_asc') return (a.name || a.number || '').localeCompare(b.name || b.number || '', 'fa');
    return 0;
  });

  const filteredContacts = contacts
    .filter(c => 
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) || 
      c.phone.includes(contactSearch)
    )
    .sort((a, b) => {
      if (contactSort === 'name_asc') return a.name.localeCompare(b.name, 'fa');
      if (contactSort === 'name_desc') return b.name.localeCompare(a.name, 'fa');
      if (contactSort === 'phone_asc') return a.phone.localeCompare(b.phone);
      return 0;
    });

  // Group SMS by threadId or number
  const smsThreads: { [key: string]: SmsMessage[] } = {};
  smsList.forEach(m => {
    const threadKey = m.threadId || m.number;
    if (!smsThreads[threadKey]) smsThreads[threadKey] = [];
    smsThreads[threadKey].push(m);
  });

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
            <span>مدیریت و کنترل کامل تماس‌ها، مخاطبین و پیامک‌ها</span>
          </h2>
          <p className="text-xs text-slate-400">
            پاسخ‌دهی و برقراری تماس مستقیم از ویندوز، بی‌صدا کردن میکروفون، تعویض بلندگو، شماره‌گیر تلفن گویا، ویرایش مخاطبین و پیامک‌ها
          </p>
        </div>

        {/* Subtabs Switcher & Simulator button */}
        <div className="flex items-center gap-2">
          {(!callState.isRinging && !callState.isInCall) && (
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

      {/* ========================================================= */}
      {/* 1. CALLS & DIALER VIEW */}
      {/* ========================================================= */}
      {subTab === 'calls' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dialpad Card */}
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span>شماره‌گیر مستقیم (Phone Dialer)</span>
                </h3>
              </div>

              {/* Number Input Screen */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="شماره تماس..."
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMakeCall(dialNumber)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-lg font-mono font-bold text-cyan-300 text-center tracking-wider focus:outline-none focus:border-cyan-500 shadow-inner"
                />
                {dialNumber && (
                  <button
                    onClick={() => setDialNumber('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
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
                    className="h-12 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-lg font-mono font-bold text-slate-200 transition-all active:scale-95"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Call Action Button */}
            <button
              onClick={() => handleMakeCall(dialNumber)}
              disabled={!dialNumber.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <PhoneCall className="w-5 h-5" />
              <span>برقراری تماس با گوشی</span>
            </button>
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
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                <span className="text-xs">در حال بارگذاری لاگ تماس‌ها...</span>
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                هیچ تماسی در این دسته یافت نشد.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-[480px] overflow-y-auto pr-1 font-sans text-xs">
                {filteredCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors group">
                    <div className="flex items-center gap-3">
                      {/* Direction Icon */}
                      <div className={`p-2.5 rounded-xl border ${
                        call.type === 'incoming' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : call.type === 'outgoing'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {call.type === 'incoming' && <PhoneIncoming className="w-4 h-4" />}
                        {call.type === 'outgoing' && <PhoneOutgoing className="w-4 h-4" />}
                        {(call.type === 'missed' || call.type === 'rejected') && <PhoneMissed className="w-4 h-4" />}
                      </div>

                      <div className="text-right">
                        <h4 className="font-bold text-white text-xs">{call.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{call.number}</p>
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
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CONTACTS VIEW */}
      {/* ========================================================= */}
      {subTab === 'contacts' && (
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">دفترچه مخاطبین (Contacts Manager)</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو در نام یا شماره..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
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
                </select>
              </div>

              <button
                onClick={() => {
                  setContactForm({ name: '', phone: '', email: '', notes: '' });
                  setShowContactModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>مخاطب جدید</span>
              </button>

              <button
                onClick={handleExportContacts}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
                title="دانلود فایل VCF مخاطبین"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">پشتیبان VCF</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
              <span className="text-xs">در حال بارگذاری لیست مخاطبین...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              مخاطبی با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar Initial */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 font-bold text-slate-950 flex items-center justify-center text-base shadow-md shadow-cyan-500/20 flex-shrink-0">
                      {contact.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0 text-right">
                      <h4 className="font-bold text-white text-sm truncate">{contact.name}</h4>
                      <p className="text-xs text-cyan-400 font-mono mt-0.5">{contact.phone}</p>
                      {contact.email && (
                        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{contact.email}</span>
                        </p>
                      )}
                      {contact.notes && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-sans">
                          {contact.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleMakeCall(contact.phone, contact.name)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
                      title="تماس با مخاطب"
                    >
                      <Phone className="w-3 h-3" />
                      <span>تماس</span>
                    </button>

                    <button
                      onClick={() => {
                        setNewSmsRecipient(contact.phone);
                        setShowNewSmsModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
                      title="ارسال پیامک"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>پیامک</span>
                    </button>

                    <button
                      onClick={() => handleDeleteContact(contact.id, contact.name)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                      title="حذف مخاطب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SMS & MESSAGES VIEW */}
      {/* ========================================================= */}
      {subTab === 'sms' && (
        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-3 min-h-[560px]">
          {/* Left Column: Threads List */}
          <div className="border-l border-slate-800 p-4 space-y-3 bg-[#080d1a]/80">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>گفتگوها (SMS Chats)</span>
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setNewSmsRecipient('');
                    setShowNewSmsModal(true);
                  }}
                  className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
                  title="پیام جدید"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExportSms}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  title="پشتیبان JSON پیامک‌ها"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Threads List */}
            <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
              {Object.keys(smsThreads).length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  هیچ پیامکی در صندوق پیام یافت نشد.
                </div>
              ) : (
                Object.keys(smsThreads).map((threadKey) => {
                  const msgs = smsThreads[threadKey];
                  const lastMsg = msgs[0];
                  const isSelected = selectedThread === threadKey;

                  return (
                    <div
                      key={threadKey}
                      onClick={() => setSelectedThread(threadKey)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border text-right ${
                        isSelected 
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' 
                          : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs truncate max-w-[130px]">
                          {lastMsg.sender || lastMsg.number}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {lastMsg.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-full font-sans">
                        {lastMsg.body}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Thread Chat */}
          <div className="lg:col-span-2 flex flex-col justify-between bg-[#050914] p-4">
            {selectedThread && activeThreadMessages.length > 0 ? (
              <>
                {/* Active Chat Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-right">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {activeThreadMessages[0]?.sender || activeThreadRecipient}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">{activeThreadRecipient}</p>
                  </div>
                  <button
                    onClick={() => handleMakeCall(activeThreadRecipient)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>تماس فوری</span>
                  </button>
                </div>

                {/* Messages Bubbles Scroll */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[380px] px-2 flex flex-col-reverse">
                  {activeThreadMessages.map((msg) => {
                    const isMe = msg.type === 'sent';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[75%] rounded-2xl p-3.5 text-xs select-text leading-relaxed ${
                          isMe 
                            ? 'mr-auto bg-cyan-600 text-slate-950 rounded-br-none shadow-md shadow-cyan-950/40 font-medium' 
                            : 'ml-auto bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-slate-950/70' : 'text-slate-500'} font-mono justify-end`}>
                          <span>{msg.timestamp}</span>
                          {isMe && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Send SMS Input Form */}
                <div className="pt-3 border-t border-slate-800/80 flex gap-2">
                  <input
                    type="text"
                    placeholder="متن پیامک را اینجا بنویسید..."
                    value={newSmsText}
                    onChange={(e) => setNewSmsText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendSms(activeThreadRecipient, newSmsText)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleSendSms(activeThreadRecipient, newSmsText)}
                    disabled={!newSmsText.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                    <span>ارسال</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                <MessageSquare className="w-12 h-12 text-slate-700 mb-2" />
                <p>یک گفتگو را از لیست سمت چپ انتخاب کنید یا پیام جدیدی ارسال نمایید.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADD/EDIT CONTACT MODAL --- */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0c142b] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-md text-right space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>افزودن مخاطب جدید به گوشی</span>
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">نام و نام خانوادگی:*</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="مثال: علی رضایی"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">شماره تماس (موبایل):*</label>
                <input
                  type="text"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="09121234567"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ایمیل (اختیاری):</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">یادداشت یا برچسب:</label>
                <input
                  type="text"
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  placeholder="همکار، دوست، خانواده..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveContact}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
              >
                ذخیره در گوشی
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
    </div>
  );
};
