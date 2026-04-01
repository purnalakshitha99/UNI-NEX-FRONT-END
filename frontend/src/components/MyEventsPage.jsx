import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import EventService from '../services/eventService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

const MyEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [confirmPopup, setConfirmPopup] = useState({
    open: false,
    type: '',
    title: '',
    message: '',
  });
  const [pendingSavePayload, setPendingSavePayload] = useState(null);
  const [pendingDelete, setPendingDelete] = useState({ eventId: '', title: '' });
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    startDate: '',
    startTime: '',
    visibility: 'public',
    isOnline: false,
    venue: '',
    meetLink: '',
    coverImage: null,
    coverImageUrl: '',
    ticketName: 'General Admission',
    ticketPrice: '',
    ticketQty: '',
  });

  const loadEvents = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await EventService.getMyEvents();
      setEvents(response?.data?.events || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openEditor = (event) => {
    const firstTicket = event?.tickets?.[0] || { name: 'General Admission', price: 0, qty: '' };

    setEditingEvent(event);
    setUploadError('');
    setForm({
      title: event.title || '',
      category: event.category || '',
      description: event.description || '',
      startDate: event.startDate ? String(event.startDate).slice(0, 10) : '',
      startTime: event.startTime || '',
      visibility: event.visibility || 'public',
      isOnline: Boolean(event.isOnline),
      venue: event.venue || '',
      meetLink: event.meetLink || '',
      coverImage: null,
      coverImageUrl: event.coverImageUrl || '',
      ticketName: firstTicket.name || 'General Admission',
      ticketPrice: firstTicket.price === 0 ? '0' : String(firstTicket.price || ''),
      ticketQty: firstTicket.qty === null || firstTicket.qty === undefined ? '' : String(firstTicket.qty),
    });
  };

  const closeEditor = () => {
    setEditingEvent(null);
    setUploadError('');
    setForm({
      title: '',
      category: '',
      description: '',
      startDate: '',
      startTime: '',
      visibility: 'public',
      isOnline: false,
      venue: '',
      meetLink: '',
      coverImage: null,
      coverImageUrl: '',
      ticketName: 'General Admission',
      ticketPrice: '',
      ticketQty: '',
    });
  };

  useEffect(() => {
    if (!form.coverImage) {
      setCoverPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(form.coverImage);
    setCoverPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [form.coverImage]);

  const canSave = useMemo(() => {
    if (!form.title || !form.category || !form.description || !form.startDate || !form.startTime) return false;
    if (form.isOnline && !form.meetLink) return false;
    if (!form.isOnline && !form.venue) return false;
    if (form.ticketPrice === '' || Number.isNaN(Number(form.ticketPrice)) || Number(form.ticketPrice) < 0) return false;
    if (form.ticketQty !== '' && (Number.isNaN(Number(form.ticketQty)) || Number(form.ticketQty) < 0)) return false;
    return true;
  }, [form]);

  const executeSave = async (payload) => {
    if (!editingEvent?._id) return;

    setSaving(true);
    setError('');
    setUploadError('');

    try {
      await EventService.updateEvent(editingEvent._id, payload);
      await loadEvents();
      closeEditor();
      toast.success('Event updated successfully', { position: 'top-right' });
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to update event';
      setError(message);
      toast.error(message, { position: 'top-right' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingEvent?._id || !canSave) return;

    const payload = {
      ...form,
      tickets: [
        {
          name: form.ticketName || 'General Admission',
          price: Number(form.ticketPrice || 0),
          qty: form.ticketQty === '' ? null : Number(form.ticketQty),
        },
      ],
    };

    setPendingSavePayload(payload);
    setConfirmPopup({
      open: true,
      type: 'save',
      title: 'Confirm Update',
      message: 'Do you want to save these event changes?',
    });
  };

  const handleCoverFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setForm((f) => ({ ...f, coverImage: null }));
      setUploadError('');
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const lowerName = file.name.toLowerCase();
    const hasAllowedExt = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!allowedMimeTypes.includes(file.type) && !hasAllowedExt) {
      setUploadError('Unsupported file type. Please select JPG, JPEG, PNG, or WEBP image.');
      setForm((f) => ({ ...f, coverImage: null }));
      return;
    }

    setUploadError('');
    setForm((f) => ({ ...f, coverImage: file }));
  };

  const handleDelete = async (eventId, title) => {
    setPendingDelete({ eventId, title });
    setConfirmPopup({
      open: true,
      type: 'delete',
      title: 'Confirm Delete',
      message: `Delete event "${title}"? This action cannot be undone.`,
    });
  };

  const executeDelete = async () => {
    if (!pendingDelete.eventId) return;

    setDeletingId(pendingDelete.eventId);
    setError('');

    try {
      await EventService.deleteEvent(pendingDelete.eventId);
      setEvents((prev) => prev.filter((item) => item._id !== pendingDelete.eventId));
      toast.success('Event deleted successfully', { position: 'top-right' });
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete event';
      setError(message);
      toast.error(message, { position: 'top-right' });
    } finally {
      setDeletingId('');
      setPendingDelete({ eventId: '', title: '' });
    }
  };

  const handleConfirmAction = async () => {
    if (confirmPopup.type === 'save' && pendingSavePayload) {
      setConfirmPopup({ open: false, type: '', title: '', message: '' });
      await executeSave(pendingSavePayload);
      setPendingSavePayload(null);
      return;
    }

    if (confirmPopup.type === 'delete') {
      setConfirmPopup({ open: false, type: '', title: '', message: '' });
      await executeDelete();
      return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Organizer Workspace</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">My Events</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your published and upcoming events.</p>
          </div>
          <button
            onClick={() => navigate('/create-event')}
            className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-blue-700"
          >
            + Create Event
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-black text-slate-900">No events yet</h2>
            <p className="mt-2 text-sm text-slate-500">Create your first event to see it here.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <article key={event._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-40 bg-slate-100">
                  {event.coverImageUrl ? (
                    <img src={event.coverImageUrl} alt={event.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">No image</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600">
                      {event.category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {event.visibility}
                    </span>
                  </div>
                  <h3 className="line-clamp-1 text-lg font-black text-slate-900">{event.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{event.description}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                    {event.startDate ? new Date(event.startDate).toLocaleDateString() : '-'} • {event.startTime || '-'}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openEditor(event)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:border-blue-200 hover:text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event._id, event.title)}
                      disabled={deletingId === event._id}
                      className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-red-600 hover:bg-red-100 disabled:opacity-70"
                    >
                      {deletingId === event._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {editingEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
          <form onSubmit={handleSave} className="mx-auto my-4 flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <h2 className="text-xl font-black text-slate-900">Update Event</h2>
              <button type="button" onClick={closeEditor} className="text-sm font-bold text-slate-500 hover:text-slate-700">
                Close
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Title</label>
                <input className={inputClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Category</label>
                <input className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Visibility</label>
                <select className={inputClass} value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="invite-only">Invite Only</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Start Date</label>
                <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Start Time</label>
                <input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Description</label>
                <textarea className={inputClass} rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  id="online-toggle"
                  type="checkbox"
                  checked={form.isOnline}
                  onChange={(e) => setForm((f) => ({ ...f, isOnline: e.target.checked }))}
                />
                <label htmlFor="online-toggle" className="text-sm font-bold text-slate-700">Online event</label>
              </div>

              {form.isOnline ? (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Meeting Link</label>
                  <input className={inputClass} value={form.meetLink} onChange={(e) => setForm((f) => ({ ...f, meetLink: e.target.value }))} />
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Venue</label>
                  <input className={inputClass} value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} />
                </div>
              )}

              <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Ticket Name</label>
                  <input
                    className={inputClass}
                    value={form.ticketName}
                    onChange={(e) => setForm((f) => ({ ...f, ticketName: e.target.value }))}
                    placeholder="General Admission"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Ticket Price (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.ticketPrice}
                    onChange={(e) => setForm((f) => ({ ...f, ticketPrice: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Ticket Quantity (optional)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.ticketQty}
                  onChange={(e) => setForm((f) => ({ ...f, ticketQty: e.target.value }))}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Replace Cover Image (optional)</label>

                <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {coverPreview ? (
                    <img src={coverPreview} alt="New cover preview" className="h-48 w-full object-cover" />
                  ) : form.coverImageUrl ? (
                    <img src={form.coverImageUrl} alt="Current cover" className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm font-bold text-slate-400">
                      No cover image uploaded
                    </div>
                  )}
                </div>

                <input
                  id="edit-cover-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />

                <label
                  htmlFor="edit-cover-file-input"
                  className="group mt-1 flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition-all hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm group-hover:text-blue-600">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L14.5 3z" />
                        <polyline points="14 3 14 9 20 9" />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-700">Choose image file</span>
                      <span className="block text-xs text-slate-500">Supported: JPG, JPEG, PNG, WEBP</span>
                    </span>
                  </span>
                  <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-600 shadow-sm group-hover:text-blue-600">
                    Browse
                  </span>
                </label>

                <p className="mt-2 text-xs text-slate-500">
                  {form.coverImage ? `Selected: ${form.coverImage.name}` : 'No new file selected'}
                </p>

                {uploadError && (
                  <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                    {uploadError}
                  </p>
                )}
              </div>
            </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
              <button type="button" onClick={closeEditor} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSave || saving}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmPopup.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-500">
              <span className="text-2xl font-black">!</span>
            </div>
            <h3 className="text-center text-2xl font-black text-slate-900">{confirmPopup.title}</h3>
            <p className="mt-2 text-center text-sm text-slate-500">{confirmPopup.message}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={handleConfirmAction}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700"
              >
                Yes, continue
              </button>
              <button
                onClick={() => {
                  setConfirmPopup({ open: false, type: '', title: '', message: '' });
                  setPendingSavePayload(null);
                  setPendingDelete({ eventId: '', title: '' });
                }}
                className="rounded-lg bg-red-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        theme="colored"
        newestOnTop
        closeOnClick={false}
        pauseOnHover
      />
    </div>
  );
};

export default MyEventsPage;
