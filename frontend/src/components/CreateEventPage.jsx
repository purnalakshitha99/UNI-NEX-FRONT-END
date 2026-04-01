import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import EventService from '../services/eventService';

// ─────────────────────────────────────────────
// ROLE GUARD — only organizer & admin can access
// ─────────────────────────────────────────────
const useCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
};

const ALLOWED_ROLES = ['organizer', 'admin'];

// ─────────────────────────────────────────────
// ICON HELPER
// ─────────────────────────────────────────────
const Icon = ({ d, className = 'w-4 h-4', stroke = 2 }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d={d} />
    </svg>
);

const IC = {
    back:     'M10 19l-7-7m0 0l7-7m-7 7h18',
    title:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    pin:      'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
    desc:     'M4 6h16M4 12h16M4 18h7',
    image:    'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    ticket:   'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
    users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    plus:     'M12 4v16m8-8H4',
    trash:    'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    check:    'M5 13l4 4L19 7',
    next:     'M14 5l7 7m0 0l-7 7m7-7H3',
    globe:    'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9',
    tag:      'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 8V5a2 2 0 012-2z',
    lock:     'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    spin:     '',
};

// ─────────────────────────────────────────────
// REUSABLE FIELD LABEL
// ─────────────────────────────────────────────
const FieldLabel = ({ icon, children }) => (
    <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">
        <Icon d={IC[icon]} className="w-3 h-3 text-blue-500" stroke={2.5} />
        {children}
    </label>
);

// ─────────────────────────────────────────────
// INPUT CLASSES
// ─────────────────────────────────────────────
const inp = 'w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:border-blue-400/70 focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all text-sm text-slate-800 placeholder:text-slate-300 font-medium';

// ─────────────────────────────────────────────
// SECTION CARD WRAPPER
// ─────────────────────────────────────────────
const Section = ({ title, subtitle, icon, children, accent = 'blue' }) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className={`px-7 py-5 border-b border-slate-100 flex items-center gap-4 bg-gradient-to-r from-${accent}-50/60 to-white`}>
            <div className={`w-10 h-10 bg-${accent}-100 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                <Icon d={IC[icon]} className={`w-5 h-5 text-${accent}-600`} stroke={1.8} />
            </div>
            <div>
                <h3 className="text-sm font-black text-slate-800">{title}</h3>
                {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="px-7 py-6 space-y-5">
            {children}
        </div>
    </div>
);

// ─────────────────────────────────────────────
// TICKET ROW
// ─────────────────────────────────────────────
const TicketRow = ({ t, i, onChange, onRemove, isLast }) => (
    <div className={`group grid grid-cols-[1fr_140px_140px_40px] gap-3 items-center p-4 rounded-2xl border-2 transition-all ${isLast && i === 0 ? 'border-slate-100 bg-slate-50/50' : 'border-slate-100 bg-slate-50/50 hover:border-blue-100 hover:bg-blue-50/20'}`}>
        <input
            value={t.name} onChange={e => onChange(i, 'name', e.target.value)}
            placeholder="e.g. General Admission, VIP, Early Bird"
            className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
        />
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">LKR</span>
            <input
                type="number" value={t.price} onChange={e => onChange(i, 'price', e.target.value)}
                placeholder="0"
                className="w-full bg-white border-2 border-slate-100 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
        </div>
        <div className="relative">
            <input
                type="number" value={t.qty} onChange={e => onChange(i, 'qty', e.target.value)}
                placeholder="Unlimited"
                className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
        </div>
        <button
            type="button" onClick={() => onRemove(i)}
            disabled={i === 0}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:pointer-events-none"
        >
            <Icon d={IC.trash} className="w-4 h-4" />
        </button>
    </div>
);

// ─────────────────────────────────────────────
// ACCESS DENIED SCREEN
// ─────────────────────────────────────────────
const AccessDenied = ({ onBack }) => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Icon d={IC.lock} className="w-9 h-9 text-red-400" stroke={1.8} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Access Restricted</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Only <span className="font-bold text-slate-600">Organizers</span> and <span className="font-bold text-slate-600">Admins</span> can create events. Please contact your administrator if you need access.
            </p>
            <button
                onClick={onBack}
                className="px-8 py-3 bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-700 transition-all shadow-lg"
            >
                ← Go Back
            </button>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// SUCCESS SCREEN
// ─────────────────────────────────────────────
const SuccessScreen = ({ title, onDashboard, onNew }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center font-sans">
        <div className="text-center max-w-sm animate-pop-in">
            <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 bg-blue-200 rounded-3xl animate-ping opacity-30" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(37,99,235,0.5)]">
                    <Icon d={IC.check} className="w-11 h-11 text-white" stroke={2.5} />
                </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Event Published!</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-2">
                <span className="font-bold text-blue-600">"{title}"</span> has been created and is now live.
            </p>
            <p className="text-slate-400 text-xs mb-10">Attendees can now discover and register for your event.</p>
            <div className="flex gap-3 justify-center">
                <button
                    onClick={onDashboard}
                    className="px-7 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                    Dashboard
                </button>
                <button
                    onClick={onNew}
                    className="px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_8px_24px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_30px_-4px_rgba(37,99,235,0.55)] hover:-translate-y-0.5 transition-all"
                >
                    + New Event
                </button>
            </div>
        </div>
        <style>{`
            @keyframes popIn {
                0%   { opacity:0; transform: scale(0.85) translateY(20px); }
                100% { opacity:1; transform: scale(1)    translateY(0);    }
            }
            .animate-pop-in { animation: popIn 0.7s cubic-bezier(0.19,1,0.22,1) both; }
        `}</style>
    </div>
);

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
const CreateEventPage = ({ onBack }) => {
    const navigate  = useNavigate();
    const user      = useCurrentUser();
    const role      = (user?.user?.role || user?.role || '').toLowerCase();
    const fileRef   = useRef();
    const goBack    = onBack || (() => navigate('/dashboard'));

    const [preview,    setPreview]    = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted,  setSubmitted]  = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [ownerEvents, setOwnerEvents] = useState([]);
    const [scanEventId, setScanEventId] = useState('');
    const [scanStats, setScanStats] = useState({ totalRegistrations: 0, attendedCount: 0, absentCount: 0 });
    const [scanMessage, setScanMessage] = useState('');
    const [scanLoading, setScanLoading] = useState(false);
    const [scanRunning, setScanRunning] = useState(false);
    const [scanPopup, setScanPopup] = useState({ show: false, text: '', type: 'info' });

    const scanContainerId = 'creator-ticket-scanner';
    const scannerRef = useRef(null);
    const scanBusyRef = useRef(false);
    const popupTimerRef = useRef(null);
    const audioContextRef = useRef(null);

    const emptyForm = () => ({
        title: '', category: '', description: '',
        startDate: '', endDate: '', startTime: '', endTime: '',
        isOnline: false, venue: '', address: '', meetLink: '',
        capacity: '', deadline: '', visibility: 'public',
        coverImage: null,
        tickets: [{ name: 'General Admission', price: '', qty: '' }],
        tags: '',
    });

    const [form, setForm] = useState(emptyForm());
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const showScanPopup = (text, type = 'info') => {
        if (popupTimerRef.current) {
            clearTimeout(popupTimerRef.current);
        }
        setScanPopup({ show: true, text, type });
        popupTimerRef.current = setTimeout(() => {
            setScanPopup(prev => ({ ...prev, show: false }));
        }, 2200);
    };

    const playScanSound = async (type) => {
        const audioCtx = audioContextRef.current;
        if (!audioCtx) return;

        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const beep = (frequency, startOffset, duration, volume = 0.07) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + startOffset);
            gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + startOffset);
            gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + startOffset + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + startOffset + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + startOffset);
            osc.stop(audioCtx.currentTime + startOffset + duration + 0.02);
        };

        if (type === 'success') {
            beep(880, 0, 0.12);
            beep(1175, 0.14, 0.14);
            return;
        }

        beep(300, 0, 0.14);
        beep(220, 0.16, 0.16);
    };

    const loadOwnerEvents = async () => {
        try {
            const res = await EventService.getMyEvents();
            const events = res?.data?.events || [];
            setOwnerEvents(events);

            if (!scanEventId && events.length > 0) {
                setScanEventId(events[0]._id);
            }
        } catch (error) {
            setScanMessage(error?.response?.data?.message || 'Failed to load your events for scanner');
        }
    };

    const loadScanStats = async (eventId) => {
        if (!eventId) return;
        setScanLoading(true);
        try {
            const res = await EventService.getAdminEventAttendance(eventId);
            setScanStats(
                res?.data?.stats ||
                { totalRegistrations: 0, attendedCount: 0, absentCount: 0 }
            );
        } catch (error) {
            setScanMessage(error?.response?.data?.message || 'Failed to load attendance stats');
        } finally {
            setScanLoading(false);
        }
    };

    const stopScanEngine = async () => {
        if (scannerRef.current && scanRunning) {
            try {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
            } catch {
                // ignore cleanup errors
            }
        }
        scannerRef.current = null;
        setScanRunning(false);
    };

    const handleTicketScan = async (decodedText) => {
        if (scanBusyRef.current || !scanEventId) return;
        scanBusyRef.current = true;

        let qrMeta = null;
        try {
            qrMeta = JSON.parse(decodedText);
        } catch {
            qrMeta = null;
        }

        try {
            const res = await EventService.markAttendanceByQr({
                qrContent: decodedText,
                eventId: scanEventId,
            });
            const reg = res?.data?.registration;
            const student = `${reg?.student?.firstName || ''} ${reg?.student?.lastName || ''}`.trim();
            const successText = `Valid QR. Attendance marked for ${student || 'student'}.`;
            setScanMessage(successText);
            showScanPopup(successText, 'success');
            playScanSound('success');
            loadScanStats(scanEventId);
        } catch (error) {
            const apiMessage = error?.response?.data?.message || '';
            const isWrongEvent = apiMessage === 'This ticket does not belong to the selected event';
            const isAlreadyScanned = apiMessage === 'Already scanned for this event';
            const belongsTitle = error?.response?.data?.belongsToEventTitle || qrMeta?.eventTitle;
            const invalidText =
                isAlreadyScanned
                    ? 'Already scanned for this event.'
                    : isWrongEvent
                    ? `Not valid for this event.${belongsTitle ? ` This QR belongs to ${belongsTitle}.` : ''}`
                    : apiMessage || 'Not valid QR for this event';

            setScanMessage(invalidText);
            showScanPopup(invalidText, 'error');
            playScanSound('error');
        } finally {
            setTimeout(() => {
                scanBusyRef.current = false;
            }, 350);
        }
    };

    const startScanEngine = async () => {
        if (!scanEventId || scanRunning) return;

        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioContextRef.current = new AudioContextClass();
            }
        }

        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const scanner = new Html5Qrcode(scanContainerId);
        scannerRef.current = scanner;
        try {
            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 20,
                    qrbox: { width: 260, height: 260 },
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    rememberLastUsedCamera: true,
                    disableFlip: false,
                },
                (decodedText) => {
                    handleTicketScan(decodedText);
                },
                () => {}
            );
            setScanRunning(true);
            const infoText = 'Scanner started. Scan attendee ticket QR for selected event.';
            setScanMessage(infoText);
            showScanPopup(infoText, 'info');
        } catch {
            const errorText = 'Could not start camera scanner. Please allow camera permissions.';
            setScanMessage(errorText);
            showScanPopup(errorText, 'error');
            playScanSound('error');
            scannerRef.current = null;
        }
    };

    useEffect(() => {
        loadOwnerEvents();
    }, []);

    useEffect(() => {
        if (scanEventId) {
            loadScanStats(scanEventId);
        }
    }, [scanEventId]);

    useEffect(() => {
        return () => {
            stopScanEngine();
            if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [scanRunning]);

    const handleImage = e => {
        const file = e.target.files[0];
        if (!file) return;
        set('coverImage', file);
        setPreview(URL.createObjectURL(file));
    };

    const addTicket    = () => setForm(f => ({ ...f, tickets: [...f.tickets, { name: '', price: '', qty: '' }] }));
    const removeTicket = i  => setForm(f => ({ ...f, tickets: f.tickets.filter((_, idx) => idx !== i) }));
    const updateTicket = (i, k, v) => setForm(f => {
        const tix = [...f.tickets];
        tix[i] = { ...tix[i], [k]: v };
        return { ...f, tickets: tix };
    });

    const handleSubmit = async e => {
        e.preventDefault();
        setSubmitError('');
        setSubmitting(true);
        try {
            const payload = {
                title: form.title,
                category: form.category,
                description: form.description,
                startDate: form.startDate,
                endDate: form.endDate || null,
                startTime: form.startTime,
                endTime: form.endTime || '',
                isOnline: form.isOnline,
                venue: form.venue,
                address: form.address,
                meetLink: form.meetLink,
                capacity: form.capacity,
                deadline: form.deadline || null,
                visibility: form.visibility,
                tickets: form.tickets,
                tags: form.tags,
                coverImage: form.coverImage,
            };

            const response = await EventService.createEvent(payload);
            if (response?.data?.success) {
                setSubmitted(true);
            } else {
                setSubmitError(response?.data?.message || 'Failed to create event');
            }
        } catch (error) {
            setSubmitError(error?.response?.data?.message || 'Failed to create event');
        } finally {
            setSubmitting(false);
        }
    };

    const resetAndNew = () => {
        setSubmitted(false);
        setSubmitError('');
        setForm(emptyForm());
        setPreview(null);
    };

    // ── Role guard ──
    if (!ALLOWED_ROLES.includes(role)) {
        return <AccessDenied onBack={goBack} />;
    }

    // ── Success ──
    if (submitted) {
        return <SuccessScreen title={form.title} onDashboard={goBack} onNew={resetAndNew} />;
    }

    const CATEGORIES = ['Conference','Workshop','Seminar','Concert','Sports','Exhibition','Networking','Hackathon','Cultural','Other'];

    return (
        <div className="min-h-screen bg-[#f7f8fc] font-sans">

            {scanPopup.show && (
                <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center px-4">
                    <div
                        className={`pointer-events-auto w-full max-w-xl rounded-2xl border px-6 py-5 text-center shadow-2xl ${
                            scanPopup.type === 'success'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : scanPopup.type === 'error'
                                ? 'border-rose-300 bg-rose-50 text-rose-800'
                                : 'border-blue-300 bg-blue-50 text-blue-800'
                        }`}
                    >
                        <p className="text-lg font-black tracking-tight">{scanPopup.text}</p>
                    </div>
                </div>
            )}

            {/* ════════════════════════════
                STICKY TOP NAVBAR
            ════════════════════════════ */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-[0_1px_12px_-2px_rgba(0,0,0,0.06)]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                    {/* Left */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={goBack}
                            className="group flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <span className="w-8 h-8 bg-slate-100 group-hover:bg-slate-200 rounded-xl flex items-center justify-center transition-all group-hover:-translate-x-0.5">
                                <Icon d={IC.back} className="w-4 h-4" />
                            </span>
                            <span className="text-sm font-bold hidden sm:block">Back</span>
                        </button>

                        <div className="h-5 w-px bg-slate-200" />

                        {/* Logo */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-white font-black text-sm">E</span>
                            </div>
                            <span className="text-slate-900 text-sm tracking-tight">
                                <span className="font-extrabold">Event</span>
                                <span className="font-light text-slate-400">Manager</span>
                            </span>
                        </div>
                    </div>

                    {/* Centre breadcrumb */}
                    <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={goBack}>Dashboard</span>
                        <span>/</span>
                        <span className="text-slate-700 font-bold">Create Event</span>
                    </div>

                    {/* Right — role badge */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/my-events"
                            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            My Events
                        </Link>
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                            {role || 'organizer'}
                        </span>
                    </div>
                </div>
            </header>

            {/* ════════════════════════════
                PAGE BODY
            ════════════════════════════ */}
            <div className="max-w-7xl mx-auto px-6 py-10">

                <Section
                    title="Ticket Scan & Attendance"
                    subtitle="Scan attendee QR codes for your events and mark attendance instantly"
                    icon="ticket"
                    accent="emerald"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                        <div>
                            <FieldLabel icon="title">Select Your Event</FieldLabel>
                            <select
                                value={scanEventId}
                                onChange={e => setScanEventId(e.target.value)}
                                className={inp}
                            >
                                <option value="">Choose an event...</option>
                                {ownerEvents.map(ev => (
                                    <option key={ev._id} value={ev._id}>
                                        {ev.title}
                                    </option>
                                ))}
                            </select>

                            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-xl bg-slate-50 border border-slate-100 py-3 px-2">
                                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Registered</p>
                                    <p className="mt-1 text-lg font-black text-slate-800">{scanStats.totalRegistrations}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 border border-emerald-100 py-3 px-2">
                                    <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500">Present</p>
                                    <p className="mt-1 text-lg font-black text-emerald-700">{scanStats.attendedCount}</p>
                                </div>
                                <div className="rounded-xl bg-rose-50 border border-rose-100 py-3 px-2">
                                    <p className="text-[10px] uppercase tracking-widest font-black text-rose-500">Absent</p>
                                    <p className="mt-1 text-lg font-black text-rose-700">{scanStats.absentCount}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <button
                                    type="button"
                                    onClick={startScanEngine}
                                    disabled={!scanEventId || scanRunning}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Start Scanner
                                </button>
                                <button
                                    type="button"
                                    onClick={stopScanEngine}
                                    disabled={!scanRunning}
                                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Stop Scanner
                                </button>
                                {scanLoading && (
                                    <span className="text-xs font-bold text-slate-400">Refreshing stats...</span>
                                )}
                            </div>

                            <div id={scanContainerId} className="min-h-65 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-2" />

                            {scanMessage && (
                                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
                                    {scanMessage}
                                </div>
                            )}
                        </div>
                    </div>
                </Section>

                {/* Page heading */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Create New <span className="text-blue-600">Event</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Fill in all sections below and publish when ready.</p>
                </div>

                {submitError && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="flex gap-8 items-start">

                        {/* ════ LEFT COLUMN — main form ════ */}
                        <div className="flex-1 min-w-0 space-y-6">

                            {/* ── 1. BASIC INFORMATION ── */}
                            <Section title="Basic Information" subtitle="Core details about your event" icon="title">

                                {/* Title */}
                                <div>
                                    <FieldLabel icon="title">Event Title</FieldLabel>
                                    <input
                                        type="text"
                                        placeholder="e.g. International Tech Summit 2026"
                                        value={form.title}
                                        onChange={e => set('title', e.target.value)}
                                        className={inp}
                                        required
                                    />
                                </div>

                                {/* Category + Visibility */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <FieldLabel icon="tag">Category</FieldLabel>
                                        <select value={form.category} onChange={e => set('category', e.target.value)} className={inp} required>
                                            <option value="">Select category...</option>
                                            {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <FieldLabel icon="globe">Visibility</FieldLabel>
                                        <select value={form.visibility} onChange={e => set('visibility', e.target.value)} className={inp}>
                                            <option value="public">Public — Anyone can see</option>
                                            <option value="private">Private — Hidden from search</option>
                                            <option value="invite-only">Invite Only</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <FieldLabel icon="desc">Description</FieldLabel>
                                    <textarea
                                        placeholder="Describe your event — agenda, speakers, what attendees can expect..."
                                        value={form.description}
                                        onChange={e => set('description', e.target.value)}
                                        rows={5}
                                        className={inp + ' resize-none'}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-300 mt-1.5 pl-1 text-right">{form.description.length} / 2000</p>
                                </div>

                                {/* Tags */}
                                <div>
                                    <FieldLabel icon="tag">Tags <span className="normal-case font-medium text-slate-400">(comma separated)</span></FieldLabel>
                                    <input
                                        type="text"
                                        placeholder="e.g. technology, networking, colombo"
                                        value={form.tags}
                                        onChange={e => set('tags', e.target.value)}
                                        className={inp}
                                    />
                                    {form.tags && (
                                        <div className="flex flex-wrap gap-2 mt-2.5">
                                            {form.tags.split(',').map((t, i) => t.trim() && (
                                                <span key={i} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold rounded-full">
                                                    #{t.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {/* ── 2. COVER IMAGE ── */}
                            <Section title="Cover Image" subtitle="Recommended 1200 × 630px, max 5MB" icon="image" accent="violet">
                                <div
                                    onClick={() => fileRef.current.click()}
                                    className={`relative w-full h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden group
                                        ${preview ? 'border-blue-300' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 bg-slate-50'}`}
                                >
                                    {preview ? (
                                        <>
                                            <img src={preview} alt="cover" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                                <Icon d={IC.image} className="w-8 h-8 text-white" />
                                                <span className="text-white text-xs font-bold uppercase tracking-widest">Change Image</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                <Icon d={IC.image} className="w-7 h-7 text-blue-500" stroke={1.5} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-500">Click to upload cover image</p>
                                                <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP — Recommended 1200×630px</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                            </Section>

                            {/* ── 3. DATE, TIME & LOCATION ── */}
                            <Section title="Date, Time & Location" subtitle="When and where the event takes place" icon="calendar" accent="emerald">

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <FieldLabel icon="calendar">Start Date</FieldLabel>
                                        <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inp} required />
                                    </div>
                                    <div>
                                        <FieldLabel icon="calendar">End Date <span className="normal-case font-medium text-slate-400">(optional)</span></FieldLabel>
                                        <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inp} />
                                    </div>
                                </div>

                                {/* Times */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <FieldLabel icon="clock">Start Time</FieldLabel>
                                        <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={inp} required />
                                    </div>
                                    <div>
                                        <FieldLabel icon="clock">End Time <span className="normal-case font-medium text-slate-400">(optional)</span></FieldLabel>
                                        <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={inp} />
                                    </div>
                                </div>

                                {/* Online toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">This is an online event</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Attendees join via a virtual meeting link</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => set('isOnline', !form.isOnline)}
                                        className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${form.isOnline ? 'bg-blue-600' : 'bg-slate-200'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${form.isOnline ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                </div>

                                {form.isOnline ? (
                                    <div>
                                        <FieldLabel icon="globe">Meeting / Stream Link</FieldLabel>
                                        <input
                                            type="url"
                                            placeholder="https://meet.google.com/abc-defg-hij"
                                            value={form.meetLink}
                                            onChange={e => set('meetLink', e.target.value)}
                                            className={inp}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <FieldLabel icon="pin">Venue Name</FieldLabel>
                                            <input
                                                type="text"
                                                placeholder="e.g. BMICH, Waters Edge, Cinnamon Grand"
                                                value={form.venue}
                                                onChange={e => set('venue', e.target.value)}
                                                className={inp}
                                                required={!form.isOnline}
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel icon="pin">Full Address</FieldLabel>
                                            <input
                                                type="text"
                                                placeholder="Street, City, Province, Sri Lanka"
                                                value={form.address}
                                                onChange={e => set('address', e.target.value)}
                                                className={inp}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Section>

                            {/* ── 4. CAPACITY & REGISTRATION ── */}
                            <Section title="Capacity & Registration" subtitle="Control attendee limits and deadlines" icon="users" accent="orange">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <FieldLabel icon="users">Maximum Capacity</FieldLabel>
                                        <input
                                            type="number"
                                            placeholder="Leave blank for unlimited"
                                            value={form.capacity}
                                            onChange={e => set('capacity', e.target.value)}
                                            min="1"
                                            className={inp}
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel icon="calendar">Registration Deadline</FieldLabel>
                                        <input
                                            type="date"
                                            value={form.deadline}
                                            onChange={e => set('deadline', e.target.value)}
                                            className={inp}
                                        />
                                    </div>
                                </div>

                                {/* Capacity bar indicator */}
                                {form.capacity && (
                                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[11px] font-bold text-orange-700">Capacity limit set</span>
                                            <span className="text-[11px] font-black text-orange-600">{Number(form.capacity).toLocaleString()} seats</span>
                                        </div>
                                        <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                                            <div className="h-full w-0 bg-orange-500 rounded-full" />
                                        </div>
                                        <p className="text-[10px] text-orange-400 mt-1.5">0% filled · {form.capacity} seats remaining</p>
                                    </div>
                                )}
                            </Section>

                            {/* ── 5. TICKETS ── */}
                            <Section title="Ticket Types & Pricing" subtitle="Add one or more ticket tiers for your event" icon="ticket">

                                {/* Column headers */}
                                <div className="grid grid-cols-[1fr_140px_140px_40px] gap-3 px-4 pb-1">
                                    {['Ticket Name', 'Price', 'Qty Available', ''].map((h, i) => (
                                        <span key={i} className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</span>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    {form.tickets.map((t, i) => (
                                        <TicketRow
                                            key={i} t={t} i={i}
                                            onChange={updateTicket}
                                            onRemove={removeTicket}
                                            isLast={form.tickets.length === 1}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={addTicket}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-2xl text-slate-400 hover:text-blue-500 text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    <Icon d={IC.plus} className="w-4 h-4" stroke={2.5} />
                                    Add Another Ticket Tier
                                </button>

                                <p className="text-[11px] text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    💡 Set price to <strong>0</strong> for free tickets. Leave qty blank for unlimited seats per tier.
                                </p>
                            </Section>

                            {/* ── SUBMIT BAR ── */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] px-7 py-5 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-slate-800">Ready to publish?</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Your event will be visible based on the visibility setting above.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex items-center gap-2.5 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_8px_24px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_30px_-4px_rgba(37,99,235,0.55)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:pointer-events-none"
                                    >
                                        {submitting ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                                Publishing...
                                            </>
                                        ) : (
                                            <>
                                                <Icon d={IC.check} className="w-4 h-4" stroke={2.5} />
                                                Publish Event
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ════ RIGHT COLUMN — sticky preview ════ */}
                        <div className="w-72 flex-shrink-0 hidden lg:block">
                            <div className="sticky top-24 space-y-4">

                                {/* Live card preview */}
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
                                    <div className={`relative h-36 ${preview ? '' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                                        {preview
                                            ? <img src={preview} alt="cover" className="w-full h-full object-cover" />
                                            : <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                                <Icon d={IC.image} className="w-10 h-10 text-white" />
                                              </div>
                                        }
                                        {form.visibility && (
                                            <span className="absolute top-3 right-3 px-2 py-1 bg-black/30 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                                                {form.visibility}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {form.category && (
                                            <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase tracking-widest mb-2 border border-blue-100">
                                                {form.category}
                                            </span>
                                        )}
                                        <h3 className="text-sm font-black text-slate-800 leading-snug mb-1.5">
                                            {form.title || <span className="text-slate-300">Your event title...</span>}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                                            {form.description || 'Description will appear here...'}
                                        </p>

                                        <div className="mt-3 space-y-1.5">
                                            {(form.startDate || form.startTime) && (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                                    <Icon d={IC.calendar} className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                                    <span>{form.startDate} {form.startTime && `· ${form.startTime}`}</span>
                                                </div>
                                            )}
                                            {(form.venue || form.isOnline) && (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                                    <Icon d={IC.pin} className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                                    <span className="truncate">{form.isOnline ? 'Online Event' : form.venue}</span>
                                                </div>
                                            )}
                                            {form.capacity && (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                                    <Icon d={IC.users} className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                                    <span>{Number(form.capacity).toLocaleString()} seats</span>
                                                </div>
                                            )}
                                        </div>

                                        {form.tickets.some(t => t.name) && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">From</span>
                                                <span className="text-sm font-black text-blue-600">
                                                    {form.tickets.filter(t => t.price).length > 0
                                                        ? `LKR ${Math.min(...form.tickets.filter(t => t.price).map(t => Number(t.price))).toLocaleString()}`
                                                        : 'Free'
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Completion checklist */}
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] p-5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Completion</p>
                                    {[
                                        { label: 'Title added',             done: !!form.title },
                                        { label: 'Category selected',       done: !!form.category },
                                        { label: 'Description written',     done: form.description.length > 20 },
                                        { label: 'Cover image uploaded',    done: !!preview },
                                        { label: 'Start date & time set',   done: !!form.startDate && !!form.startTime },
                                        { label: 'Location set',            done: !!(form.venue || form.isOnline) },
                                        { label: 'Ticket type added',       done: form.tickets.some(t => t.name) },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${item.done ? 'bg-emerald-500 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.4)]' : 'border-2 border-slate-200'}`}>
                                                {item.done && <Icon d={IC.check} className="w-2.5 h-2.5 text-white" stroke={3} />}
                                            </div>
                                            <span className={`text-[11px] font-medium transition-colors ${item.done ? 'text-slate-500 line-through' : 'text-slate-400'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Overall progress */}
                                    {(() => {
                                        const items = [!!form.title, !!form.category, form.description.length > 20, !!preview, !!form.startDate && !!form.startTime, !!(form.venue || form.isOnline), form.tickets.some(t => t.name)];
                                        const done  = items.filter(Boolean).length;
                                        const pct   = Math.round((done / items.length) * 100);
                                        return (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                                    <span className={`text-[11px] font-black ${pct === 100 ? 'text-emerald-500' : 'text-blue-500'}`}>{pct}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventPage;