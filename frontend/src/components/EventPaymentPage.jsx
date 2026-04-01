import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import AuthService from '../services/authService';
import EventService from '../services/eventService';
import PaymentSlipService from '../services/paymentSlipService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition';

const sanitizeBankName = (value) => value.replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ');
const isValidBankName = (value) => /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(value.trim());
const sanitizeCardHolderName = (value) => value.replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ');
const isValidCardHolderName = (value) => /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(value.trim());

/* ─── Tab IDs ─── */
const TAB_CARD = 'card';
const TAB_SLIP = 'slip';

const EventPaymentPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  /* ─── event data ─── */
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  /* ─── shared ─── */
  const [registration, setRegistration] = useState(null);   // card registration
  const [slipRegistration, setSlipRegistration] = useState(null); // slip registration
  const [ticketName, setTicketName] = useState('');
  const [activeTab, setActiveTab] = useState(TAB_CARD);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  /* ─── card payment ─── */
  const [paymentDetails, setPaymentDetails] = useState({
    bankName: '', cardHolderName: '', cardNumber: '',
    expiryMonth: '', expiryYear: '', cvv: '',
  });
  const [confirmPayment, setConfirmPayment] = useState(false);

  /* ─── slip upload ─── */
  const fileInputRef = useRef(null);
  const [slipForm, setSlipForm] = useState({
    bankName: '', amount: '', depositDate: '', qty: 1, notes: '',
  });
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [slipError, setSlipError] = useState('');
  const [slipProcessing, setSlipProcessing] = useState(false);
  const [showSlipConfirm, setShowSlipConfirm] = useState(false);

  const role = (currentUser?.user?.role || currentUser?.role || '').toLowerCase();
  const isStudent = role === 'student';

  /* ─── load event ─── */
  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await EventService.getEventById(eventId);
        const loaded = response?.data?.event;
        setEvent(loaded);
        if (loaded?.tickets?.length > 0) {
          setTicketName(loaded.tickets[0].name);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    if (eventId) loadEvent();
  }, [eventId]);

  /* ─── load existing registrations ─── */
  useEffect(() => {
    const loadExistingRegistrations = async () => {
      if (!isStudent || !eventId) return;
      try {
        // Check card registrations
        const cardRes = await EventService.getMyRegistrations();
        const existingCard = (cardRes?.data?.registrations || []).find(
          (item) => item?.event?._id === eventId
        );
        if (existingCard) setRegistration(existingCard);

        // Check slip registrations
        const slipRes = await PaymentSlipService.getMyPaymentSlips();
        const existingSlip = (slipRes?.data?.data || []).find(
          (item) => item?.eventId?._id === eventId
        );
        if (existingSlip) setSlipRegistration(existingSlip);
      } catch {
        // silent
      }
    };
    loadExistingRegistrations();
  }, [eventId, isStudent]);

  const selectedTicket = useMemo(() => {
    if (!event?.tickets?.length) return { name: 'General Admission', price: 0 };
    return event.tickets.find((t) => t.name === ticketName) || event.tickets[0];
  }, [event, ticketName]);

  const amount = Number(selectedTicket?.price || 0);
  useEffect(() => {
    setSlipForm((prev) => ({ ...prev, amount: String(amount) }));
  }, [amount]);

  const maskedCard = paymentDetails.cardNumber
    .replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();

  /* ─────────────────────── CARD PAYMENT LOGIC ─────────────────────── */
  const validateCardDetails = () => {
    const cardDigits = paymentDetails.cardNumber.replace(/\D/g, '');
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    const enteredYear = Number(paymentDetails.expiryYear);
    const enteredMonth = Number(paymentDetails.expiryMonth);

    if (!paymentDetails.bankName.trim()) return 'Bank name is required';
    if (!isValidBankName(paymentDetails.bankName)) return 'Bank name must contain only letters';
    if (!paymentDetails.cardHolderName.trim()) return 'Card holder name is required';
    if (!isValidCardHolderName(paymentDetails.cardHolderName)) return 'Card holder name must contain only letters';
    if (cardDigits.length !== 16) return 'Card number must contain 16 digits';
    if (!/^\d{2}$/.test(paymentDetails.expiryMonth) ||
      Number(paymentDetails.expiryMonth) < 1 || Number(paymentDetails.expiryMonth) > 12)
      return 'Expiry month must be between 01 and 12';
    if (!/^\d{2}$/.test(paymentDetails.expiryYear)) return 'Expiry year must be 2 digits (e.g. 28)';
    if (enteredYear < currentYear) return 'Expiry year cannot be in the past';
    if (enteredYear === currentYear && enteredMonth < currentMonth) return 'Card expiry date is in the past';
    if (!/^\d{3}$/.test(paymentDetails.cvv)) return 'CVV must be exactly 3 digits';
    if (!confirmPayment) return 'Please confirm payment before continuing';
    return '';
  };

  const executeCardPayment = async () => {
    setProcessing(true);
    setError('');
    toast.info('Processing payment...', { position: 'top-right' });
    try {
      const response = await EventService.registerForEvent(eventId, {
        ticketName: selectedTicket?.name,
        paymentMethod: 'card',
        paymentDetails: {
          bankName: paymentDetails.bankName.trim(),
          cardHolderName: paymentDetails.cardHolderName.trim(),
          cardNumber: paymentDetails.cardNumber,
          expiryMonth: paymentDetails.expiryMonth,
          expiryYear: paymentDetails.expiryYear,
          cvv: paymentDetails.cvv,
        },
      });
      if (response?.data?.success) {
        setRegistration(response.data.registration);
        setShowConfirmModal(false);
        toast.success('Payment successful! E-ticket generated.', { position: 'top-right' });
      } else {
        setError(response?.data?.message || 'Payment failed');
        toast.error(response?.data?.message || 'Payment failed', { position: 'top-right' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Payment failed';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPayment = () => {
    if (!isStudent) { setError('Only students can register for events.'); return; }
    const err = validateCardDetails();
    if (err) { setError(err); toast.error(err, { position: 'top-right' }); return; }
    setShowConfirmModal(true);
  };

  /* ─────────────────────── SLIP UPLOAD LOGIC ─────────────────────── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setSlipError('Only JPG, PNG, GIF or PDF files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSlipError('File size must be under 5 MB.');
      return;
    }
    setSlipFile(file);
    setSlipError('');
    if (file.type === 'application/pdf') {
      setSlipPreview('pdf');
    } else {
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const validateSlipForm = () => {
    if (!slipForm.bankName.trim()) return 'Bank name is required';
    if (!isValidBankName(slipForm.bankName)) return 'Bank name must contain only letters';
    if (!slipForm.amount || Number(slipForm.amount) <= 0) return 'Valid amount is required';
    if (!slipForm.depositDate) return 'Deposit date is required';
    if (!slipFile) return 'Payment slip file is required';
    return '';
  };

  const handleSlipSubmit = () => {
    if (!isStudent) { setSlipError('Only students can register for events.'); return; }
    const err = validateSlipForm();
    if (err) { setSlipError(err); toast.error(err, { position: 'top-right' }); return; }
    setShowSlipConfirm(true);
  };

  const executeSlipSubmit = async () => {
    setSlipProcessing(true);
    setSlipError('');
    toast.info('Uploading payment slip...', { position: 'top-right' });
    try {
      const fd = new FormData();
      fd.append('eventId', eventId);
      fd.append('bankName', slipForm.bankName.trim());
      fd.append('amount', slipForm.amount);
      fd.append('depositDate', slipForm.depositDate);
      fd.append('ticketType', selectedTicket?.name || 'regular');
      fd.append('qty', slipForm.qty);
      fd.append('notes', slipForm.notes);
      fd.append('slipImage', slipFile);

      const response = await PaymentSlipService.submitPaymentSlip(fd);
      if (response?.data?.success) {
        setSlipRegistration(response.data.data);
        setShowSlipConfirm(false);
        toast.success('Slip uploaded! Awaiting admin approval.', { position: 'top-right' });
      } else {
        const msg = response?.data?.message || 'Upload failed';
        setSlipError(msg);
        toast.error(msg, { position: 'top-right' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Upload failed';
      setSlipError(msg);
      toast.error(msg, { position: 'top-right' });
    } finally {
      setSlipProcessing(false);
    }
  };

  /* ─────────────────────── QR Download helpers ─────────────────────── */
  const drawRoundedRect = (ctx, x, y, w, h, r, fillStyle, strokeStyle) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
    if (strokeStyle) { ctx.strokeStyle = strokeStyle; ctx.stroke(); }
  };

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const downloadFullTicket = async () => {
    if (!registration) return;
    try {
      const canvas = document.createElement('canvas');
      const width = 1800; const height = 980;
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#f0f7ff');
      bg.addColorStop(1, '#eefdf9');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      drawRoundedRect(ctx, 30, 30, width - 60, height - 60, 26, '#ffffff', '#dbe6f3');
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 48px Segoe UI, Arial';
      ctx.fillText(registration?.event?.title || 'Event Ticket', 80, 130);
      const coverX = 80, coverY = 145, coverW = 960, coverH = 190;
      drawRoundedRect(ctx, coverX, coverY, coverW, coverH, 20, '#f8fafc', '#e2e8f0');
      if (registration?.event?.coverImageUrl) {
        try {
          const coverImg = await loadImage(registration.event.coverImageUrl);
          const scale = Math.max(coverW / coverImg.width, coverH / coverImg.height);
          const drawW = coverImg.width * scale, drawH = coverImg.height * scale;
          ctx.save();
          ctx.beginPath();
          ctx.rect(coverX, coverY, coverW, coverH);
          ctx.clip();
          ctx.drawImage(coverImg, coverX + (coverW - drawW) / 2, coverY + (coverH - drawH) / 2, drawW, drawH);
          ctx.restore();
        } catch { /* skip */ }
      }
      ctx.fillStyle = '#0369a1';
      ctx.font = '700 20px Segoe UI, Arial';
      ctx.fillText('EVENT ADMISSION PASS', 80, 85);
      ctx.strokeStyle = '#dbe6f3';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(1080, 80);
      ctx.lineTo(1080, 900);
      ctx.stroke();
      ctx.setLineDash([]);
      const info = [
        ['Attendee', `${registration?.student?.firstName || ''} ${registration?.student?.lastName || ''}`.trim() || '-'],
        ['Ticket Type', registration?.ticketName || '-'],
        ['Date & Time', `${registration?.event?.startDate ? new Date(registration.event.startDate).toLocaleDateString() : '-'} • ${registration?.event?.startTime || '-'}`],
        ['Venue', registration?.event?.isOnline ? (registration?.event?.meetLink || 'Online Event') : (registration?.event?.venue || '-')],
        ['Ticket Code', registration?.ticketCode || '-'],
        ['Transaction', registration?.transactionId || '-'],
        ['Amount Paid', `LKR ${registration?.amount || 0}`],
        ['Paid Via', `${registration?.paymentBankName || 'Bank Card'} • **** ${registration?.paymentCardLast4 || '----'}`],
      ];
      let y = 365;
      info.forEach(([label, value], idx) => {
        const x = idx % 2 === 0 ? 80 : 580;
        if (idx % 2 === 0 && idx !== 0) y += 100;
        drawRoundedRect(ctx, x, y, 460, 80, 16, '#f8fafc', '#e2e8f0');
        ctx.fillStyle = '#64748b';
        ctx.font = '700 14px Segoe UI, Arial';
        ctx.fillText(label.toUpperCase(), x + 18, y + 28);
        ctx.fillStyle = label === 'Amount Paid' ? '#059669' : '#0f172a';
        ctx.font = '800 28px Segoe UI, Arial';
        const trimmed = String(value).length > 28 ? `${String(value).slice(0, 28)}...` : String(value);
        ctx.fillText(trimmed, x + 18, y + 64);
      });
      drawRoundedRect(ctx, 1140, 180, 590, 620, 24, '#f8fafc', '#e2e8f0');
      ctx.fillStyle = '#334155';
      ctx.font = '800 34px Segoe UI, Arial';
      ctx.fillText('SECURE QR', 1320, 240);
      if (registration?.qrCodeDataUrl) {
        try {
          const qrImg = await loadImage(registration.qrCodeDataUrl);
          ctx.drawImage(qrImg, 1240, 270, 390, 390);
        } catch { /* skip */ }
      }
      ctx.fillStyle = '#64748b';
      ctx.font = '600 22px Segoe UI, Arial';
      ctx.fillText('Show this ticket at entrance for validation.', 1180, 700);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safe = String(registration?.event?.title || 'event-ticket')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      link.href = dataUrl;
      link.download = `${safe || 'event-ticket'}-${registration?.ticketCode || 'ticket'}.png`;
      link.click();
    } catch {
      toast.error('Failed to download ticket. Please try again.', { position: 'top-right' });
    }
  };

  /* ─────────────────────── STATUS BADGE helper ─────────────────────── */
  const StatusBadge = ({ status }) => {
    const map = {
      pending:  'bg-amber-100 text-amber-700 border-amber-200',
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {status === 'pending' && '⏳ '}
        {status === 'approved' && '✅ '}
        {status === 'rejected' && '❌ '}
        {status}
      </span>
    );
  };

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef6ff] via-[#f8fbff] to-[#ecfffb]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            Loading payment details…
          </div>

        ) : error && !event ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">{error}</div>

        ) : registration ? (
          /* ── CARD REGISTRATION SUCCESS ── */
          <CardSuccessView
            registration={registration}
            downloadFullTicket={downloadFullTicket}
            navigate={navigate}
          />

        ) : slipRegistration ? (
          /* ── SLIP REGISTRATION EXISTS ── */
          <SlipStatusView
            slipRegistration={slipRegistration}
            navigate={navigate}
            event={event}
          />

        ) : (
          /* ── PAYMENT FORM ── */
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: event info */}
            <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/50 to-blue-50 p-6 shadow-lg">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Event Payment</p>
              <h1 className="mt-2 text-2xl font-black text-slate-900">{event?.title}</h1>
              <p className="mt-2 text-sm text-slate-600">{event?.description}</p>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p><span className="font-bold">Date:</span> {event?.startDate ? new Date(event.startDate).toLocaleDateString() : '-'}</p>
                <p><span className="font-bold">Time:</span> {event?.startTime || '-'}</p>
                <p><span className="font-bold">Mode:</span> {event?.isOnline ? 'Online' : 'Physical'}</p>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-sm">
                {event?.coverImageUrl ? (
                  <img src={event.coverImageUrl} alt={event?.title || 'Event cover'} className="h-72 w-full object-cover" />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-6 text-center">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Event Cover</p>
                      <p className="mt-2 text-sm font-bold text-slate-500">No cover image uploaded</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: payment form with tabs */}
            <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-lg">
              {/* Ticket selector */}
              <div className="mb-4">
                <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">Select Ticket</label>
                <select
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value)}
                  className={inputClass}
                >
                  {(event?.tickets?.length ? event.tickets : [{ name: 'General Admission', price: 0 }]).map((t) => (
                    <option key={t.name} value={t.name}>{t.name} — LKR {t.price || 0}</option>
                  ))}
                </select>
              </div>

              <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Amount</p>
                <p className="mt-1 text-2xl font-black text-slate-900">LKR {amount}</p>
              </div>

              {!isStudent && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  Only student accounts can register and pay for events.
                </div>
              )}

              {/* Tabs */}
              <div className="mb-5 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setActiveTab(TAB_CARD)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === TAB_CARD
                      ? 'bg-white text-cyan-700 shadow border border-cyan-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  💳 Card Payment
                </button>
                <button
                  onClick={() => setActiveTab(TAB_SLIP)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === TAB_SLIP
                      ? 'bg-white text-violet-700 shadow border border-violet-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🧾 Upload Slip
                </button>
              </div>

              {/* ── CARD TAB ── */}
              {activeTab === TAB_CARD && (
                <div className="space-y-4">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
                  )}
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 px-4 py-4 space-y-3 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Bank Details</p>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Bank Name</label>
                      <input type="text" value={paymentDetails.bankName}
                        onChange={(e) => setPaymentDetails((p) => ({ ...p, bankName: sanitizeBankName(e.target.value) }))}
                        placeholder="e.g. Commercial Bank" className={inputClass} />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Card Holder Name</label>
                      <input type="text" value={paymentDetails.cardHolderName}
                        onChange={(e) => setPaymentDetails((p) => ({ ...p, cardHolderName: sanitizeCardHolderName(e.target.value) }))}
                        placeholder="Name on card" className={inputClass} />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Card Number</label>
                      <input type="text" value={maskedCard}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const grouped = digits.replace(/(.{4})/g, '$1 ').trim();
                          setPaymentDetails((p) => ({ ...p, cardNumber: grouped }));
                        }}
                        placeholder="1234 5678 9012 3456" className={inputClass} />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">MM</label>
                        <input type="text" value={paymentDetails.expiryMonth}
                          onChange={(e) => setPaymentDetails((p) => ({ ...p, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                          placeholder="08" className={inputClass} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">YY</label>
                        <input type="text" value={paymentDetails.expiryYear}
                          onChange={(e) => setPaymentDetails((p) => ({ ...p, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                          placeholder="28" className={inputClass} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">CVV</label>
                        <input type="password" value={paymentDetails.cvv}
                          onChange={(e) => setPaymentDetails((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                          placeholder="123" className={inputClass} />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={confirmPayment}
                        onChange={(e) => setConfirmPayment(e.target.checked)} />
                      I confirm payment details are correct and authorize this payment.
                    </label>
                  </div>

                  <button
                    onClick={handleCardPayment}
                    disabled={!isStudent || processing}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-black uppercase tracking-widest text-white hover:from-cyan-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all shadow-md"
                  >
                    {processing ? 'Processing…' : 'Confirm Payment & Register'}
                  </button>
                </div>
              )}

              {/* ── SLIP TAB ── */}
              {activeTab === TAB_SLIP && (
                <div className="space-y-4">
                  {slipError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{slipError}</div>
                  )}

                  <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 via-white to-slate-50 px-4 py-4 space-y-3 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">Bank Transfer Details</p>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Bank Name *</label>
                      <input type="text" value={slipForm.bankName}
                        onChange={(e) => setSlipForm((p) => ({ ...p, bankName: sanitizeBankName(e.target.value) }))}
                        placeholder="e.g. Bank of Ceylon" className={inputClass} />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount Deposited (LKR) *</label>
                      <input type="number" min="0" value={slipForm.amount}
                        readOnly placeholder="Auto-filled from selected ticket"
                        className={`${inputClass} bg-slate-50 text-slate-600`} />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Deposit Date *</label>
                      <input type="date" value={slipForm.depositDate}
                        onChange={(e) => setSlipForm((p) => ({ ...p, depositDate: e.target.value }))}
                        className={inputClass} max={new Date().toISOString().split('T')[0]} />
                    </div>

                   {/* // <div>
                     // <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Number of Tickets</label>
                     // <input type="number" min="1" max="10" value={slipForm.qty}
                     //   onChange={(e) => setSlipForm((p) => ({ ...p, qty: e.target.value }))}
                     //   className={inputClass} />
                    //</div> */}

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes (optional)</label>
                      <textarea value={slipForm.notes}
                        onChange={(e) => setSlipForm((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="Any additional information for admin..." rows={2}
                        className={`${inputClass} resize-none`} />
                    </div>
                  </div>

                  {/* File upload zone */}
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Payment Slip (Image or PDF) *</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const fakeEvent = { target: { files: [file] } };
                          handleFileChange(fakeEvent);
                        }
                      }}
                      className="cursor-pointer rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 px-4 py-6 text-center hover:border-violet-400 hover:bg-violet-50 transition-all group"
                    >
                      {slipFile ? (
                        <div className="space-y-2">
                          {slipPreview === 'pdf' ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-100 text-3xl">📄</div>
                              <p className="text-sm font-bold text-slate-700">{slipFile.name}</p>
                              <p className="text-xs text-slate-500">PDF Document • {(slipFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <img src={slipPreview} alt="slip preview" className="mx-auto max-h-32 rounded-xl border border-slate-200 object-contain shadow" />
                              <p className="text-xs text-slate-500">{slipFile.name}</p>
                            </div>
                          )}
                          <p className="text-xs text-violet-600 font-bold">Click to change file</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100 text-3xl group-hover:scale-110 transition-transform">🧾</div>
                          </div>
                          <p className="text-sm font-bold text-slate-600">Click or drag & drop your payment slip</p>
                          <p className="text-xs text-slate-400">Supports JPG, PNG, GIF, PDF • Max 5 MB</p>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.gif,.pdf"
                      onChange={handleFileChange} className="hidden" />
                  </div>

                  <button
                    onClick={handleSlipSubmit}
                    disabled={!isStudent || slipProcessing}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-black uppercase tracking-widest text-white hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all shadow-md"
                  >
                    {slipProcessing ? 'Uploading…' : 'Submit Payment Slip'}
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    Your slip will be reviewed by the admin. You'll get a QR ticket once approved.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Card payment confirm modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-500">
              <span className="text-2xl font-black">!</span>
            </div>
            <h3 className="text-center text-2xl font-black text-slate-900">Confirm Payment</h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              You are about to pay <span className="font-bold text-slate-700">LKR {amount}</span> for{' '}
              <span className="font-bold text-slate-700">{selectedTicket?.name || 'General Admission'}</span>.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={executeCardPayment} disabled={processing}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700 disabled:opacity-60">
                {processing ? 'Paying…' : 'Yes, confirm'}
              </button>
              <button onClick={() => setShowConfirmModal(false)} disabled={processing}
                className="rounded-lg bg-red-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-60">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slip upload confirm modal ── */}
      {showSlipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-3xl">
              🧾
            </div>
            <h3 className="text-center text-2xl font-black text-slate-900">Submit Slip?</h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              Submit your payment slip for <span className="font-bold text-slate-700">LKR {slipForm.amount}</span> to the admin for approval?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={executeSlipSubmit} disabled={slipProcessing}
                className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-violet-700 disabled:opacity-60">
                {slipProcessing ? 'Uploading…' : 'Yes, submit'}
              </button>
              <button onClick={() => setShowSlipConfirm(false)} disabled={slipProcessing}
                className="rounded-lg bg-slate-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-600 disabled:opacity-60">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer theme="colored" newestOnTop closeOnClick={false} pauseOnHover />
    </div>
  );
};

/* ─── Card Success Sub-component ─── */
const CardSuccessView = ({ registration, downloadFullTicket, navigate }) => (
  <div className="space-y-6">
    <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-lg">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">E-Ticket Issued</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Payment Successful</h1>
      <p className="mt-1 text-sm text-slate-600">Your e-ticket is ready with secure QR verification.</p>
    </div>
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="grid lg:grid-cols-[1.4fr_1px_1fr]">
        <section className="relative p-6 md:p-8">
          <div className="absolute right-0 top-6 hidden h-[88%] w-2 border-r-2 border-dashed border-slate-200 lg:block" />
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Event Admission Pass</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{registration?.event?.title}</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {registration?.event?.coverImageUrl ? (
              <img src={registration.event.coverImageUrl} alt="cover" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm font-bold text-slate-400">No cover image</div>
            )}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ['Attendee', `${registration?.student?.firstName} ${registration?.student?.lastName}`],
              ['Ticket Type', registration?.ticketName],
              ['Date & Time', `${registration?.event?.startDate ? new Date(registration.event.startDate).toLocaleDateString() : '-'} • ${registration?.event?.startTime || '-'}`],
              ['Venue', registration?.event?.isOnline ? (registration?.event?.meetLink || 'Online') : (registration?.event?.venue || '-')],
              ['Ticket Code', registration?.ticketCode],
              ['Transaction', registration?.transactionId],
              ['Amount Paid', `LKR ${registration?.amount}`],
              ['Paid Via', `${registration?.paymentBankName || 'Bank Card'} • **** ${registration?.paymentCardLast4 || '----'}`],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{v}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="hidden bg-slate-100 lg:block" />
        <section className="flex flex-col items-center justify-center bg-slate-50 p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Secure QR</p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {registration?.qrCodeDataUrl ? (
              <img src={registration.qrCodeDataUrl} alt="QR" className="mx-auto w-full max-w-60" />
            ) : (
              <p className="text-center text-sm text-slate-500">QR not available.</p>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">Show this QR at the event entrance.</p>
          {registration?.qrCodeDataUrl && (
            <a href={registration.qrCodeDataUrl} download={`ticket-${registration.ticketCode}.png`}
              className="mt-4 inline-block rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
              Download E-Ticket QR
            </a>
          )}
        </section>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <button onClick={downloadFullTicket}
        className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2 text-sm font-bold text-white hover:from-slate-800 hover:to-slate-600">
        Download Full E-Ticket
      </button>
      <Link to="/events" className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-bold text-white hover:from-cyan-700 hover:to-blue-700">
        Back to Events
      </Link>
      <button onClick={() => navigate('/dashboard')}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
        Go Dashboard
      </button>
    </div>
  </div>
);

/* ─── Slip Status Sub-component ─── */
const SlipStatusView = ({ slipRegistration, navigate, event }) => {
  const sr = slipRegistration;
  const status = sr?.status || 'pending';

  const statusConfig = {
    pending: {
      bg: 'from-amber-50 via-white to-orange-50',
      border: 'border-amber-200',
      icon: '⏳',
      title: 'Awaiting Approval',
      desc: 'Your payment slip has been submitted and is pending admin review.',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    approved: {
      bg: 'from-emerald-50 via-white to-cyan-50',
      border: 'border-emerald-200',
      icon: '✅',
      title: 'Payment Approved!',
      desc: 'Your payment has been verified. Your QR ticket is ready below.',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    rejected: {
      bg: 'from-red-50 via-white to-rose-50',
      border: 'border-red-200',
      icon: '❌',
      title: 'Payment Rejected',
      desc: 'Your payment slip was rejected. See reason below.',
      badge: 'bg-red-100 text-red-700 border-red-200',
    },
  };

  const cfg = statusConfig[status] || statusConfig.pending;

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl border ${cfg.border} bg-gradient-to-br ${cfg.bg} p-6 shadow-lg`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{cfg.icon}</span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Payment Slip</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{cfg.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{cfg.desc}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="grid lg:grid-cols-[1.4fr_1px_1fr]">
          <section className="relative p-6 md:p-8">
            <div className="absolute right-0 top-6 hidden h-[88%] w-2 border-r-2 border-dashed border-slate-200 lg:block" />
            <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-600">Slip Registration Details</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{sr?.eventId?.title || event?.title}</h2>

            <div className="mt-4 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest ${cfg.badge}`}>
                {cfg.icon} {status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ['Bank', sr?.bankName],
                ['Amount', `LKR ${sr?.amount}`],
                ['Deposit Date', sr?.depositDate ? new Date(sr.depositDate).toLocaleDateString() : '-'],
                ['Ticket Type', sr?.ticketType || 'regular'],
                ['Quantity', sr?.qty],
                ['Submitted', sr?.createdAt ? new Date(sr.createdAt).toLocaleDateString() : '-'],
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l}</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{v}</p>
                </div>
              ))}
            </div>

            {status === 'approved' && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Ticket Code</p>
                  <p className="mt-1 text-sm font-black text-emerald-800">{sr?.ticketCode}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Transaction ID</p>
                  <p className="mt-1 text-sm font-black text-emerald-800">{sr?.transactionId}</p>
                </div>
              </div>
            )}

            {status === 'rejected' && sr?.rejectionReason && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Rejection Reason</p>
                <p className="mt-1 text-sm font-bold text-red-700">{sr.rejectionReason}</p>
              </div>
            )}

            {sr?.notes && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Notes</p>
                <p className="mt-1 text-sm text-slate-600">{sr.notes}</p>
              </div>
            )}
          </section>

          <div className="hidden bg-slate-100 lg:block" />

          <section className="flex flex-col items-center justify-center bg-slate-50 p-6 md:p-8">
            {status === 'approved' && sr?.qrCodeDataUrl ? (
              <>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Your QR Ticket</p>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <img src={sr.qrCodeDataUrl} alt="Ticket QR" className="mx-auto w-full max-w-56" />
                </div>
                <p className="mt-3 text-center text-xs text-slate-500">Show at the event entrance for check-in.</p>
                <a href={sr.qrCodeDataUrl} download={`ticket-${sr.ticketCode}.png`}
                  className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                  Download QR Ticket
                </a>
              </>
            ) : status === 'pending' ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 text-5xl animate-pulse">⏳</div>
                <p className="text-sm font-bold text-slate-600">Pending Admin Review</p>
                <p className="text-xs text-slate-400">Your QR ticket will appear here once approved.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 text-5xl">❌</div>
                <p className="text-sm font-bold text-slate-600">Slip Rejected</p>
                <p className="text-xs text-slate-400">Please contact the event organizer for assistance.</p>
              </div>
            )}

            {/* Slip image preview */}
            {sr?.slipImageUrl && (
              <div className="mt-6 w-full">
                <p className="mb-2 text-center text-xs font-black uppercase tracking-widest text-slate-400">Your Submitted Slip</p>
                {sr.slipImageUrl.toLowerCase().includes('.pdf') || sr.slipImageUrl.includes('pdf') ? (
                  <a href={sr.slipImageUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100">
                    📄 View PDF Slip
                  </a>
                ) : (
                  <a href={sr.slipImageUrl} target="_blank" rel="noopener noreferrer">
                    <img src={sr.slipImageUrl} alt="payment slip" className="mx-auto max-h-40 rounded-xl border border-slate-200 object-contain shadow" />
                  </a>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/events" className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-bold text-white hover:from-cyan-700 hover:to-blue-700">
          Back to Events
        </Link>
        <button onClick={() => navigate('/dashboard')}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Go Dashboard
        </button>
      </div>
    </div>
  );
};

export default EventPaymentPage;
