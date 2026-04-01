import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import PaymentSlipService from '../services/paymentSlipService';
import EventService from '../services/eventService';
import AuthService from '../services/authService';

/* ─── helpers ─── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const getSlipStudent = (slip) => slip?.studentId || slip?.student || slip?.userId || null;
const getSlipStudentName = (slip) => {
  const st = getSlipStudent(slip);
  const fromNames = [st?.firstName, st?.lastName].filter(Boolean).join(' ').trim();
  return fromNames || st?.name || slip?.studentName || slip?.fullName || 'Unknown Student';
};
const getSlipStudentEmail = (slip) => getSlipStudent(slip)?.email || slip?.studentEmail || '—';
const getSlipStudentId = (slip) => getSlipStudent(slip)?.studentId || slip?.studentRegNo || '';
const getSlipStudentFaculty = (slip) => getSlipStudent(slip)?.faculty || '';

const STATUS_COLORS = {
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};
const STATUS_ICONS = { pending: '⏳', approved: '✅', rejected: '❌' };

/* ─── StatsCard ─── */
const StatsCard = ({ label, value, icon, color }) => (
  <div className={`rounded-2xl border ${color} bg-white p-5 shadow-sm flex items-center gap-4`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const AdminPaymentSlips = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  /* ─── state ─── */
  const [events, setEvents] = useState([]);
  const [allSlips, setAllSlips] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingSlips, setLoadingSlips] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Filter/search
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Approve / Reject modal
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject', slip }
  const [rejectReason, setRejectReason] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  /* ─── guard ─── */
  useEffect(() => {
    const role = (currentUser?.user?.role || currentUser?.role || '').toLowerCase();
    if (role !== 'admin') navigate('/');
  }, []);

  /* ─── load all events then their slips ─── */
  const loadAllSlips = useCallback(async () => {
    setLoadingSlips(true);
    try {
      // Preferred: single admin endpoint
      const res = await PaymentSlipService.getAllPaymentSlips();
      const slips = (res?.data?.data || []);
      setAllSlips(slips);

      // Build event list from the slips for filter dropdown
      const evMap = {};
      slips.forEach((s) => {
        const ev = s.eventId;
        if (ev?._id) evMap[ev._id] = ev;
      });
      setEvents(Object.values(evMap));
    } catch (err) {
      // Fallback: public events + per-event queries
      try {
        const pubRes = await EventService.getPublicEvents();
        const evList = pubRes?.data?.events || pubRes?.data?.data || [];
        setEvents(evList);

        const slipPromises = evList.map((ev) =>
          PaymentSlipService.getEventPaymentSlips(ev._id)
            .then((r) => (r?.data?.data || []).map((s) => ({ ...s, _eventTitle: ev.title })))
            .catch(() => [])
        );
        const results = await Promise.all(slipPromises);
        const flat = results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAllSlips(flat);
      } catch (fallbackErr) {
        console.error('Failed to load slips (fallback also failed):', fallbackErr);
      }
    } finally {
      setLoadingSlips(false);
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { loadAllSlips(); }, [loadAllSlips]);

  /* ─── computed stats ─── */
  const stats = {
    total: allSlips.length,
    pending: allSlips.filter((s) => s.status === 'pending').length,
    approved: allSlips.filter((s) => s.status === 'approved').length,
    rejected: allSlips.filter((s) => s.status === 'rejected').length,
  };

  /* ─── filtered slips ─── */
  const filtered = allSlips.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterEvent !== 'all' && s.eventId?._id !== filterEvent && s._eventTitle !== filterEvent) return false;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const name = getSlipStudentName(s).toLowerCase();
      const email = getSlipStudentEmail(s).toLowerCase();
      const bank = (s.bankName || '').toLowerCase();
      const title = (s._eventTitle || s.eventId?.title || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !bank.includes(q) && !title.includes(q)) return false;
    }
    return true;
  });

  /* ─── Approve ─── */
  const handleApprove = async () => {
    if (!actionModal?.slip) return;
    setActionProcessing(true);
    setActionError('');
    try {
      await PaymentSlipService.approvePaymentSlip(actionModal.slip._id);
      setActionModal(null);
      await loadAllSlips();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Approval failed');
    } finally {
      setActionProcessing(false);
    }
  };

  /* ─── Reject ─── */
  const handleReject = async () => {
    if (!actionModal?.slip) return;
    if (!rejectReason.trim()) { setActionError('Rejection reason is required'); return; }
    setActionProcessing(true);
    setActionError('');
    try {
      await PaymentSlipService.rejectPaymentSlip(actionModal.slip._id, { rejectionReason: rejectReason.trim() });
      setActionModal(null);
      setRejectReason('');
      await loadAllSlips();
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Rejection failed');
    } finally {
      setActionProcessing(false);
    }
  };

  /* ─── Render ─── */
  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <AdminSidebar />

      <main className="flex-1 p-4 pt-24 sm:p-6 sm:pt-24 lg:ml-72 lg:p-8 lg:pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Payment Slips</h1>
          <p className="mt-1 text-sm text-slate-500">Review, approve or reject student bank-transfer payment slips.</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total" value={stats.total} icon="🧾" color="border-slate-200" />
          <StatsCard label="Pending" value={stats.pending} icon="⏳" color="border-amber-200" />
          <StatsCard label="Approved" value={stats.approved} icon="✅" color="border-emerald-200" />
          <StatsCard label="Rejected" value={stats.rejected} icon="❌" color="border-red-200" />
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search student, bank, event…"
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100" />
          </div>

          {/* Status filter */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400">
            <option value="all">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>

          {/* Event filter */}
          <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400 max-w-[240px]">
            <option value="all">All Events</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>

          <button onClick={loadAllSlips}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
            🔄 Refresh
          </button>
        </div>

        {/* Table */}
        {loadingSlips || loadingEvents ? (
          <div className="flex items-center justify-center rounded-2xl bg-white border border-slate-200 py-16 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
              <p className="text-sm font-bold text-slate-500">Loading payment slips…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 py-20 shadow-sm">
            <div className="text-6xl mb-4">🧾</div>
            <p className="text-lg font-black text-slate-700">No payment slips found</p>
            <p className="mt-1 text-sm text-slate-400">
              {allSlips.length === 0 ? 'No slips have been submitted yet.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Student', 'Event', 'Bank / Amount', 'Date Deposited', 'Status', 'Submitted', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((slip) => (
                    <tr key={slip._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-slate-800">
                          {getSlipStudentName(slip)}
                        </p>
                        <p className="text-xs text-slate-400">{getSlipStudentEmail(slip)}</p>
                        {getSlipStudentId(slip) && (
                          <p className="text-xs text-slate-400">ID: {getSlipStudentId(slip)}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-700 max-w-[180px] truncate">
                          {slip._eventTitle || slip.eventId?.title || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-700">{slip.bankName}</p>
                        <p className="text-sm font-black text-emerald-700">LKR {slip.amount}</p>
                        <p className="text-xs text-slate-400">Qty: {slip.qty}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{fmt(slip.depositDate)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-widest ${STATUS_COLORS[slip.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {STATUS_ICONS[slip.status]} {slip.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">{fmt(slip.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* View slip */}
                          <button
                            onClick={() => { setSelectedSlip(slip); setViewerOpen(true); }}
                            className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700 hover:bg-cyan-100 transition"
                          >
                            👁 View
                          </button>
                          {slip.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setActionModal({ type: 'approve', slip }); setActionError(''); }}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                ✅ Approve
                              </button>
                              <button
                                onClick={() => { setActionModal({ type: 'reject', slip }); setRejectReason(''); setActionError(''); }}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 hover:bg-red-100 transition"
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs font-bold text-slate-400">
                Showing {filtered.length} of {allSlips.length} payment slips
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ─── SLIP VIEWER MODAL ─── */}
      {viewerOpen && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Payment Slip Details</h2>
                <p className="text-xs text-slate-400">Submitted by {getSlipStudentName(selectedSlip)}</p>
              </div>
              <button onClick={() => setViewerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition font-black text-lg">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status banner */}
              <div className={`rounded-xl border px-4 py-3 ${STATUS_COLORS[selectedSlip.status]}`}>
                <p className="text-xs font-black uppercase tracking-widest opacity-70">Status</p>
                <p className="text-lg font-black">{STATUS_ICONS[selectedSlip.status]} {selectedSlip.status.toUpperCase()}</p>
              </div>

              {/* Student info */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Student Information</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Name</p><p className="font-black text-slate-800">{getSlipStudentName(selectedSlip)}</p></div>
                  <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Email</p><p className="font-black text-slate-800">{getSlipStudentEmail(selectedSlip)}</p></div>
                  {getSlipStudentId(selectedSlip) && (
                    <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Student ID</p><p className="font-black text-slate-800">{getSlipStudentId(selectedSlip)}</p></div>
                  )}
                  {getSlipStudentFaculty(selectedSlip) && (
                    <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Faculty</p><p className="font-black text-slate-800">{getSlipStudentFaculty(selectedSlip)}</p></div>
                  )}
                </div>
              </div>

              {/* Payment info */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Payment Information</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Bank</p><p className="font-black text-slate-800">{selectedSlip.bankName}</p></div>
                  <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Amount</p><p className="font-black text-emerald-700 text-base">LKR {selectedSlip.amount}</p></div>
                  <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Deposit Date</p><p className="font-black text-slate-800">{fmt(selectedSlip.depositDate)}</p></div>
                  <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Qty</p><p className="font-black text-slate-800">{selectedSlip.qty} ticket(s)</p></div>
                  <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Ticket Type</p><p className="font-black text-slate-800">{selectedSlip.ticketType || 'regular'}</p></div>
                  <div><p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Submitted At</p><p className="font-black text-slate-800">{fmtDt(selectedSlip.createdAt)}</p></div>
                </div>
                {selectedSlip.notes && (
                  <div className="mt-3">
                    <p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-slate-600 italic">{selectedSlip.notes}</p>
                  </div>
                )}
              </div>

              {/* ─── SLIP IMAGE / PDF ─── */}
              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-violet-600">Payment Slip Document</p>
                {selectedSlip.slipImageUrl ? (
                  (() => {
                    const url = selectedSlip.slipImageUrl;
                    const isPdf = url.toLowerCase().includes('.pdf') ||
                      url.toLowerCase().includes('pdf') ||
                      (url.includes('cloudinary') && url.includes('/raw/'));

                    return isPdf ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                          <span className="text-4xl">📄</span>
                          <div>
                            <p className="text-sm font-black text-red-700">PDF Payment Slip</p>
                            <p className="text-xs text-red-500">Click below to open in a new tab</p>
                          </div>
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 transition shadow"
                        >
                          📄 Open PDF in New Tab
                        </a>
                        {/* Attempt embedded viewer */}
                        <iframe
                          src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                          title="PDF Viewer"
                          className="w-full h-80 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <img
                            src={url}
                            alt="Payment Slip"
                            className="w-full object-contain max-h-96"
                          />
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-200 transition"
                        >
                          🔗 Open Full Size
                        </a>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-8 text-slate-400">
                    No slip image available
                  </div>
                )}
              </div>

              {/* Approved info */}
              {selectedSlip.status === 'approved' && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-emerald-600">Ticket Generated</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="font-bold text-emerald-600 text-[11px] uppercase tracking-wider">Ticket Code</p><p className="font-black text-emerald-800">{selectedSlip.ticketCode}</p></div>
                    <div><p className="font-bold text-emerald-600 text-[11px] uppercase tracking-wider">Transaction ID</p><p className="font-black text-emerald-800">{selectedSlip.transactionId}</p></div>
                    <div><p className="font-bold text-emerald-600 text-[11px] uppercase tracking-wider">Approved At</p><p className="font-black text-emerald-800">{fmtDt(selectedSlip.reviewedAt)}</p></div>
                  </div>
                  {selectedSlip.qrCodeDataUrl && (
                    <div className="mt-4 flex flex-col items-center">
                      <p className="mb-2 text-xs font-black uppercase tracking-widest text-emerald-600">QR Code</p>
                      <img src={selectedSlip.qrCodeDataUrl} alt="QR" className="w-40 rounded-xl border border-emerald-200 shadow" />
                    </div>
                  )}
                </div>
              )}

              {/* Rejected info */}
              {selectedSlip.status === 'rejected' && selectedSlip.rejectionReason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">Rejection Reason</p>
                  <p className="text-sm font-bold text-red-700">{selectedSlip.rejectionReason}</p>
                </div>
              )}

              {/* Quick approve/reject from modal */}
              {selectedSlip.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setViewerOpen(false); setActionModal({ type: 'approve', slip: selectedSlip }); setActionError(''); }}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 transition shadow"
                  >
                    ✅ Approve This Slip
                  </button>
                  <button
                    onClick={() => { setViewerOpen(false); setActionModal({ type: 'reject', slip: selectedSlip }); setRejectReason(''); setActionError(''); }}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-black text-white hover:bg-red-600 transition shadow"
                  >
                    ❌ Reject This Slip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── APPROVE CONFIRM MODAL ─── */}
      {actionModal?.type === 'approve' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-4xl">✅</div>
            <h3 className="text-center text-xl font-black text-slate-900">Approve Payment Slip?</h3>
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600">
              <p><span className="font-bold">Student:</span> {getSlipStudentName(actionModal.slip)}</p>
              <p><span className="font-bold">Amount:</span> LKR {actionModal.slip.amount}</p>
              <p><span className="font-bold">Bank:</span> {actionModal.slip.bankName}</p>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">A QR ticket will be generated and the student will be notified.</p>
            {actionError && <p className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-600">{actionError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={handleApprove} disabled={actionProcessing}
                className="rounded-xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60 transition">
                {actionProcessing ? 'Approving…' : '✅ Confirm Approve'}
              </button>
              <button onClick={() => setActionModal(null)} disabled={actionProcessing}
                className="rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REJECT CONFIRM MODAL ─── */}
      {actionModal?.type === 'reject' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-4xl">❌</div>
            <h3 className="text-center text-xl font-black text-slate-900">Reject Payment Slip?</h3>
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600">
              <p><span className="font-bold">Student:</span> {getSlipStudentName(actionModal.slip)}</p>
              <p><span className="font-bold">Amount:</span> LKR {actionModal.slip.amount}</p>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">Rejection Reason *</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                rows={3} placeholder="Explain why the slip is being rejected…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none" />
            </div>
            {actionError && <p className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-600">{actionError}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={handleReject} disabled={actionProcessing}
                className="rounded-xl bg-red-500 py-3 text-sm font-black text-white hover:bg-red-600 disabled:opacity-60 transition">
                {actionProcessing ? 'Rejecting…' : '❌ Confirm Reject'}
              </button>
              <button onClick={() => setActionModal(null)} disabled={actionProcessing}
                className="rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentSlips;
