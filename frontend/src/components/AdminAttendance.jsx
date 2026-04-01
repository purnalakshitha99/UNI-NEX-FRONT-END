import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import AdminSidebar from './AdminSidebar';
import EventService from '../services/eventService';

const scannerElementId = 'attendance-qr-reader';

const AdminAttendance = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, attendedCount: 0, absentCount: 0 });
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [centerPopup, setCenterPopup] = useState({ show: false, text: '', type: 'info' });

  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  const popupTimerRef = useRef(null);
  const audioContextRef = useRef(null);

  const showCenterPopup = (text, type = 'info') => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }

    setCenterPopup({ show: true, text, type });
    popupTimerRef.current = setTimeout(() => {
      setCenterPopup((prev) => ({ ...prev, show: false }));
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

    if (type === 'valid') {
      beep(880, 0, 0.12);
      beep(1175, 0.14, 0.14);
      return;
    }

    beep(300, 0, 0.14);
    beep(220, 0.16, 0.16);
  };

  const loadEvents = async () => {
    try {
      const res = await EventService.getAdminAllBookings();
      const list = res?.data?.events || [];
      setEvents(list);
      if (!selectedEvent && list.length > 0) {
        setSelectedEvent(list[0]);
      }
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to load events');
    }
  };

  const loadAttendanceForEvent = async (eventId) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await EventService.getAdminEventAttendance(eventId);
      setRegistrations(res?.data?.registrations || []);
      setStats(
        res?.data?.stats || {
          totalRegistrations: 0,
          attendedCount: 0,
          absentCount: 0,
        }
      );
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to load attendance details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent?._id) {
      loadAttendanceForEvent(selectedEvent._id);
    }
  }, [selectedEvent?._id]);

  const stopScanner = async () => {
    if (scannerRef.current && isScannerRunning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // ignore scanner cleanup errors
      }
    }
    scannerRef.current = null;
    setIsScannerRunning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isScannerRunning]);

  const handleScan = async (decodedText) => {
    if (busyRef.current || !selectedEvent?._id) return;

    let qrMeta = null;
    try {
      qrMeta = JSON.parse(decodedText);
    } catch {
      qrMeta = null;
    }

    busyRef.current = true;
    try {
      const res = await EventService.markAttendanceByQr({
        qrContent: decodedText,
        eventId: selectedEvent._id,
      });

      const { registration } = res?.data || {};
      const studentName = `${registration?.student?.firstName || ''} ${registration?.student?.lastName || ''}`.trim();

      setMessage(`Attendance marked: ${studentName}`);
      showCenterPopup(`Valid QR. Attendance marked for ${studentName || 'student'}.`, 'success');
      playScanSound('valid');

      loadAttendanceForEvent(selectedEvent._id);
    } catch (err) {
      const apiMessage = err?.response?.data?.message || '';
      const isWrongEvent = apiMessage === 'This ticket does not belong to the selected event';
      const isAlreadyScanned = apiMessage === 'Already scanned for this event';
      const isInvalidQrCase =
        apiMessage === 'Invalid QR payload' ||
        isWrongEvent ||
        isAlreadyScanned ||
        apiMessage === 'Registration not found for this QR code';

      if (isInvalidQrCase) {
        const belongsTitle = err?.response?.data?.belongsToEventTitle || qrMeta?.eventTitle;
        const invalidMsg = isAlreadyScanned
          ? 'Already scanned for this event.'
          : isWrongEvent
          ? `Not valid for this event.${belongsTitle ? ` This QR belongs to ${belongsTitle}.` : ''}`
          : apiMessage || 'Not valid QR for this event.';
        setMessage(invalidMsg);
        showCenterPopup(invalidMsg, 'error');
        playScanSound('invalid');
      } else {
        setMessage(apiMessage || 'Failed to process QR scan');
        showCenterPopup(apiMessage || 'Failed to process QR scan', 'error');
        playScanSound('invalid');
      }
    } finally {
      setTimeout(() => {
        busyRef.current = false;
      }, 350);
    }
  };

  const startScanner = async () => {
    if (!selectedEvent?._id || isScannerRunning) return;

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const scanner = new Html5Qrcode(scannerElementId);
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
          handleScan(decodedText);
        },
        () => {}
      );
      setIsScannerRunning(true);
      setMessage('Scanner is running. Show a student QR to mark attendance.');
      showCenterPopup('Scanner started. Ready to scan QR codes.', 'info');
    } catch {
      setMessage('Unable to access camera. Check browser permission and try again.');
      showCenterPopup('Unable to access camera. Check browser permission and try again.', 'error');
      playScanSound('invalid');
      scannerRef.current = null;
    }
  };

  const filteredRegistrations = useMemo(() => {
    if (!search.trim()) return registrations;
    const q = search.toLowerCase();
    return registrations.filter((r) => {
      const fullName = `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (r.student?.email || '').toLowerCase().includes(q) ||
        (r.student?.studentId || '').toLowerCase().includes(q) ||
        (r.ticketCode || '').toLowerCase().includes(q)
      );
    });
  }, [registrations, search]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-4 pt-24 sm:p-6 sm:pt-24 lg:ml-72 lg:p-8 lg:pt-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Event Attendance Scanner</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Scan student QR codes and mark attendance instantly.</p>
          </div>
          <button
            onClick={loadEvents}
            className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 shadow"
          >
            Refresh
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="xl:col-span-4 rounded-3xl bg-white p-5 shadow">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">Events</h2>
            <div className="max-h-[68vh] space-y-3 overflow-y-auto pr-1">
              {events.map((event) => {
                const active = selectedEvent?._id === event._id;
                return (
                  <button
                    key={event._id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-black text-slate-900">{event.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{event.category || 'General'}</p>
                    <p className="mt-2 text-[11px] font-bold text-slate-400">
                      {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'No date'}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="xl:col-span-8 space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={startScanner}
                  disabled={!selectedEvent || isScannerRunning}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start Scanner
                </button>
                <button
                  onClick={stopScanner}
                  disabled={!isScannerRunning}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stop Scanner
                </button>
                <p className="text-xs font-bold text-slate-500">
                  Selected: <span className="text-slate-700">{selectedEvent?.title || 'No event selected'}</span>
                </p>
              </div>

              <div id={scannerElementId} className="min-h-65 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-2" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 shadow">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Registered</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalRegistrations}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Attended</p>
                <p className="mt-2 text-2xl font-black text-emerald-600">{stats.attendedCount}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Absent</p>
                <p className="mt-2 text-2xl font-black text-rose-600">{stats.absentCount}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow">
              <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black text-slate-900">Student Attendance Details</h2>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, student ID, ticket"
                  className="w-full sm:w-[320px] rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                />
              </div>

              {loading ? (
                <p className="py-8 text-center text-sm font-bold text-slate-400">Loading attendance...</p>
              ) : filteredRegistrations.length === 0 ? (
                <p className="py-8 text-center text-sm font-bold text-slate-400">No registrations found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="py-3">Student</th>
                        <th className="py-3">Email</th>
                        <th className="py-3">Student ID</th>
                        <th className="py-3">Ticket Code</th>
                        <th className="py-3">Attendance</th>
                        <th className="py-3">Marked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistrations.map((reg) => (
                        <tr key={reg._id} className="border-b border-slate-100">
                          <td className="py-3 font-bold text-slate-800">
                            {reg.student?.firstName} {reg.student?.lastName}
                          </td>
                          <td className="py-3 text-slate-600">{reg.student?.email || '-'}</td>
                          <td className="py-3 text-slate-600">{reg.student?.studentId || '-'}</td>
                          <td className="py-3 font-mono text-xs text-slate-600">{reg.ticketCode}</td>
                          <td className="py-3">
                            {reg.attendanceMarked ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Present</span>
                            ) : (
                              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">Absent</span>
                            )}
                          </td>
                          <td className="py-3 text-slate-600">
                            {reg.attendanceMarkedAt ? new Date(reg.attendanceMarkedAt).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {centerPopup.show && (
        <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div
            className={`pointer-events-auto w-full max-w-xl rounded-2xl border px-6 py-5 text-center shadow-2xl ${
              centerPopup.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : centerPopup.type === 'error'
                ? 'border-rose-300 bg-rose-50 text-rose-800'
                : 'border-blue-300 bg-blue-50 text-blue-800'
            }`}
          >
            <p className="text-lg font-black tracking-tight">{centerPopup.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
