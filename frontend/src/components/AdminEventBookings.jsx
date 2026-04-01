import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import EventService from '../services/eventService';
import PaymentSlipService from '../services/paymentSlipService';
import AuthService from '../services/authService';

/* ─── tiny helpers ─── */
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
const fmtDt = (d) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const SLIP_STATUS = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};
const SLIP_ICON = { pending: '⏳', approved: '✅', rejected: '❌' };

/* ─── reusable refined card ─── */
const StatCard = ({ icon, label, value, sub, colorClass, gradient }) => (
  <div className={`relative overflow-hidden flex items-start gap-4 rounded-3xl border border-white/40 bg-white/70 backdrop-blur-md p-6 shadow-xl shadow-slate-200/50 transition-all hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-indigo-100/50`}>
    <div className={`absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r ${gradient}`} />
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-2xl shadow-lg shadow-indigo-100`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-[11px] font-bold text-slate-400/80">{sub}</p>}
    </div>
  </div>
);

const AdminEventBookings = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  /* ── top-level state ── */
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');

  /* ── drill-down state ── */
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [cardRegs, setCardRegs] = useState([]);
  const [slipRegs, setSlipRegs] = useState([]);
  const [eventStats, setEventStats] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'slip'

  /* ── search / filter ── */
  const [eventSearch, setEventSearch] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [slipFilter, setSlipFilter] = useState('all');

  /* ── admin guard ── */
  useEffect(() => {
    const role = (currentUser?.user?.role || currentUser?.role || '').toLowerCase();
    if (role !== 'admin') navigate('/');
  }, []);

  /* ─── load events list ─── */
  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    setEventsError('');
    try {
      const res = await EventService.getAdminAllBookings();
      setEvents(res?.data?.events || []);
    } catch (err) {
      setEventsError(err?.response?.data?.message || 'Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  /* ─── load detail for one event ─── */
  const openEvent = async (ev) => {
    setSelectedEvent(ev);
    setLoadingDetail(true);
    setCardRegs([]);
    setSlipRegs([]);
    setEventStats(null);
    setRegSearch('');
    setSlipFilter('all');
    setActiveTab('card');

    try {
      const [cardRes, slipRes] = await Promise.all([
        EventService.getAdminEventBookings(ev._id),
        PaymentSlipService.getEventPaymentSlips(ev._id).catch(() => ({ data: { data: [] } })),
      ]);
      setCardRegs(cardRes?.data?.registrations || []);
      setSlipRegs(slipRes?.data?.data || []);
      setEventStats(cardRes?.data?.stats || null);
    } catch (err) {
      console.error('Failed to load event detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ─── filtered event list ─── */
  const filteredEvents = events.filter((ev) => {
    if (!eventSearch.trim()) return true;
    const q = eventSearch.toLowerCase();
    return (
      ev.title?.toLowerCase().includes(q) ||
      ev.category?.toLowerCase().includes(q) ||
      ev.venue?.toLowerCase().includes(q)
    );
  });

  /* ─── filtered registrations ─── */
  const filteredCardRegs = cardRegs.filter((r) => {
    if (!regSearch.trim()) return true;
    const q = regSearch.toLowerCase();
    const name = `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.toLowerCase();
    return (
      name.includes(q) ||
      (r.student?.email || '').toLowerCase().includes(q) ||
      (r.student?.studentId || '').toLowerCase().includes(q) ||
      (r.ticketName || '').toLowerCase().includes(q)
    );
  });

  const filteredSlipRegs = slipRegs.filter((r) => {
    const passStatus = slipFilter === 'all' || r.status === slipFilter;
    if (!passStatus) return false;
    if (!regSearch.trim()) return true;
    const q = regSearch.toLowerCase();
    const name = `${r.studentId?.firstName || ''} ${r.studentId?.lastName || ''}`.toLowerCase();
    return (
      name.includes(q) ||
      (r.studentId?.email || '').toLowerCase().includes(q) ||
      (r.bankName || '').toLowerCase().includes(q)
    );
  });

  /* ─── combined total ─── */
  const totalBookings = (cardRegs?.length || 0) + (slipRegs?.length || 0);
  const totalRevenue =
    (eventStats?.totalRevenue || 0) +
    slipRegs.filter((s) => s.status === 'approved').reduce((sum, s) => sum + (s.amount * s.qty || 0), 0);

  /* ══════════ RENDER ══════════ */
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar />

      <main className="ml-72 flex-1 p-10">
        {/* ─── Header ─── */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Event <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Bookings</span>
            </h1>
            <p className="mt-2 text-sm font-bold text-slate-400">
              Visualize registration patterns and manage attendee lists.
            </p>
          </div>
          <button
            onClick={loadEvents}
            className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-xl shadow-slate-200/50 transition-all hover:shadow-indigo-100 hover:translate-y-[-2px] active:translate-y-0"
          >
            <span className="relative z-10">🔄 Refresh Dashboard</span>
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-50 to-white opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>

        <div className="grid grid-cols-12 gap-10">
          {/* ══════ LEFT PANEL – Event Explorer ══════ */}
          <div className="col-span-4 space-y-6">
            {/* Search */}
            <div className="group relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">🔍</span>
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Find specific event…"
                className="w-full rounded-2xl border-2 border-white bg-white/50 backdrop-blur-md pl-11 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white shadow-lg shadow-slate-200/40"
              />
            </div>

            {/* Event cards */}
            {loadingEvents ? (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white/50 border-2 border-dashed border-slate-200 py-24">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-75" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white font-black">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Parsing Events...</p>
              </div>
            ) : eventsError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-500 shadow-sm shadow-red-100/50">
                ⚠️ {eventsError}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white border border-slate-100 py-20 shadow-xl shadow-slate-100">
                <span className="text-6xl mb-4 grayscale opacity-40">📭</span>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching events</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                {filteredEvents.map((ev) => {
                  const isActive = selectedEvent?._id === ev._id;
                  const isPast = ev.startDate && new Date(ev.startDate) < new Date();
                  return (
                    <button
                      key={ev._id}
                      onClick={() => openEvent(ev)}
                      className={`w-full group relative text-left rounded-3xl transition-all duration-300 ${
                        isActive
                          ? 'bg-white shadow-2xl shadow-indigo-200/60 ring-2 ring-indigo-500'
                          : 'bg-white/40 hover:bg-white border border-transparent hover:border-white hover:shadow-xl hover:shadow-slate-200/50'
                      }`}
                    >
                      {/* Event Card Content */}
                      <div className="p-4 flex gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-inner bg-slate-100">
                          {ev.coverImageUrl ? (
                            <img
                              src={ev.coverImageUrl}
                              alt={ev.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">📅</div>
                          )}
                          <div className={`absolute top-1 left-1 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase border ${isPast ? 'bg-slate-800 text-white' : 'bg-emerald-500 text-white'}`}>
                            {isPast ? 'Past' : 'Live'}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-black truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {ev.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase text-indigo-500/70">{ev.category}</span>
                             <span className="h-1 w-1 rounded-full bg-slate-200" />
                             <span className="text-[10px] font-bold text-slate-400">{fmt(ev.startDate)}</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-2.5 py-1 text-[10px] font-black text-slate-600 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                               💳 {ev.cardBookingCount || 0}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-300 group-hover:text-slate-500 transition-colors">
                               {ev.isOnline ? 'Cloud Session' : ev.venue}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ══════ RIGHT PANEL – Intelligence Dashboard ══════ */}
          <div className="col-span-8">
            {!selectedEvent ? (
              <div className="relative h-full min-h-[500px] overflow-hidden rounded-[40px] border-4 border-dashed border-white bg-slate-100/30">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                   <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl shadow-slate-200">
                      <span className="animate-bounce text-6xl">✨</span>
                   </div>
                   <h3 className="text-2xl font-black text-slate-800">Intelligence Ready</h3>
                   <p className="mt-3 max-w-sm text-sm font-bold text-slate-400 leading-relaxed">
                     Select an event from the explorer to visualize revenue, attendance clusters, and payment flows.
                   </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Event Hero Header */}
                <div className="group relative overflow-hidden rounded-[40px] border border-white bg-white shadow-2xl shadow-slate-200/60">
                  <div className="relative h-48 w-full overflow-hidden">
                    {selectedEvent.coverImageUrl ? (
                      <img
                        src={selectedEvent.coverImageUrl}
                        alt={selectedEvent.title}
                        className="h-full w-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-violet-600 opacity-80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
                       <div>
                         <span className="rounded-full bg-indigo-500/30 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-200 ring-1 ring-white/20">Dashboard Alpha</span>
                         <h2 className="mt-2 text-3xl font-black text-white tracking-tight">{selectedEvent.title}</h2>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-white">{fmt(selectedEvent.startDate)}</p>
                          <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">{selectedEvent.isOnline ? '🌐 Global Access' : `📍 ${selectedEvent.venue}`}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Intelligent Stats Grid */}
                {loadingDetail ? (
                   <div className="flex items-center justify-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-14 w-14 animate-spin rounded-full border-[6px] border-indigo-500 border-t-transparent shadow-xl" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Syncing Data Store</p>
                      </div>
                   </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                      <StatCard icon="💎" label="Registry Total" value={totalBookings} sub="Unified Registrations" gradient="from-slate-700 to-slate-900 text-white" />
                      <StatCard icon="💳" label="Digital Flow" value={cardRegs.length} sub="Card Payments" gradient="from-indigo-500 to-blue-600 text-white" />
                      <StatCard icon="🧾" label="Slip Nodes" value={slipRegs.length} sub={`${slipRegs.filter(s=>s.status==='pending').length} Action Required`} gradient="from-violet-500 to-fuchsia-600 text-white" />
                      <StatCard icon="💰" label="Gross Revenue" value={`LKR ${totalRevenue.toLocaleString()}`} sub="Event Liquidity" gradient="from-emerald-500 to-teal-600 text-white" />
                    </div>

                    {/* Multi-Segmented Controller (Tabs) */}
                    <div className="flex rounded-3xl bg-white/50 border border-white p-1.5 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
                      <button
                        onClick={() => setActiveTab('card')}
                        className={`flex-1 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeTab === 'card'
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-200'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                         Digital Registrations ({cardRegs.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('slip')}
                        className={`flex-1 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeTab === 'slip'
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-200'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                         Bank Documents ({slipRegs.length})
                      </button>
                    </div>

                    {/* Intelligence Filter Bar */}
                    <div className="flex gap-4">
                      <div className="group relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-500">🔍</span>
                        <input
                          type="text"
                          value={regSearch}
                          onChange={(e) => setRegSearch(e.target.value)}
                          placeholder="Search intelligence records..."
                          className="w-full rounded-2xl border-2 border-white bg-white/70 backdrop-blur-md pl-12 pr-4 py-3.5 text-xs font-black text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white shadow-xl shadow-slate-200/30"
                        />
                      </div>
                      {activeTab === 'slip' && (
                        <select
                          value={slipFilter}
                          onChange={(e) => setSlipFilter(e.target.value)}
                          className="rounded-2xl border-2 border-white bg-white/70 backdrop-blur-md px-6 py-3.5 text-xs font-black text-slate-700 outline-none transition-all focus:border-indigo-400 shadow-xl shadow-slate-200/30"
                        >
                          <option value="all">ALL STATUS</option>
                          <option value="pending">⏳ PENDING</option>
                          <option value="approved">✅ APPROVED</option>
                          <option value="rejected">❌ REJECTED</option>
                        </select>
                      )}
                    </div>

                    {/* Data Tables with Premium Styling */}
                    <div className="overflow-hidden rounded-[32px] border border-white bg-white shadow-2xl shadow-slate-200/60 transition-all">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50">
                              {['Student Intelligence', 'Access Tier', 'Liquidity', 'Acquisition', 'Protocol Status'].map((h) => (
                                <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {activeTab === 'card' ? (
                               filteredCardRegs.map((r) => (
                                  <tr key={r._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-black text-base shadow-sm">
                                           {r.student?.firstName?.[0]}{r.student?.lastName?.[0]}
                                        </div>
                                        <div>
                                          <p className="text-[13px] font-black text-slate-800">{r.student?.firstName} {r.student?.lastName}</p>
                                          <p className="text-[10px] font-bold text-slate-400">{r.student?.email}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-5">
                                       <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 border border-slate-200">{r.ticketName}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                       <p className="text-[13px] font-black text-emerald-600">LKR {r.amount}</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">{r.paymentBankName}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                       <p className="text-[10px] font-black text-slate-500 uppercase">{fmtDt(r.createdAt)}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                       <span className="inline-flex rounded-full bg-cyan-50 border border-cyan-100 px-3 py-1 text-[9px] font-black text-cyan-700 uppercase tracking-widest group-hover:bg-cyan-100 transition-colors">
                                          {r.ticketCode}
                                       </span>
                                    </td>
                                  </tr>
                               ))
                            ) : (
                               filteredSlipRegs.map((r) => (
                                  <tr key={r._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                       <div className="flex items-center gap-3">
                                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-50 text-violet-600 font-black text-base shadow-sm">
                                             {r.studentId?.firstName?.[0]}{r.studentId?.lastName?.[0]}
                                          </div>
                                          <div>
                                             <p className="text-[13px] font-black text-slate-800">{r.studentId?.firstName} {r.studentId?.lastName}</p>
                                             <p className="text-[10px] font-bold text-slate-400">{r.studentId?.email}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-5 group-hover:translate-x-1 transition-transform">
                                       <p className="text-[11px] font-black text-slate-700">{r.bankName}</p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">Qty: {r.qty}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                       <p className="text-[13px] font-black text-emerald-600">LKR {r.amount}</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase">DEP: {fmt(r.depositDate)}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                       <p className="text-[10px] font-black text-slate-500 uppercase">{fmtDt(r.createdAt)}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                       <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black shadow-sm uppercase tracking-[0.1em] ${SLIP_STATUS[r.status]}`}>
                                          {SLIP_ICON[r.status]} {r.status}
                                       </span>
                                    </td>
                                  </tr>
                               ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                           Showing {activeTab === 'card' ? filteredCardRegs.length : filteredSlipRegs.length} Active Records
                         </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEventBookings;
