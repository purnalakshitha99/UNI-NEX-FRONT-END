import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import EventService from '../services/eventService';
import { toast } from 'react-toastify';

const AdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [editModal, setEditModal] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await EventService.getPublicEvents();
            const eventsList = response?.data?.events || response?.data?.data || [];
            setEvents(eventsList);
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to load events';
            setError(errorMsg);
            toast.error(errorMsg, { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event =>
        event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event?.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const handleDeleteEvent = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            await EventService.deleteEvent(deleteModal._id);
            setEvents(events.filter(e => e._id !== deleteModal._id));
            setDeleteModal(null);
            toast.success('Event deleted successfully', { position: 'top-right' });
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to delete event';
            toast.error(errorMsg, { position: 'top-right' });
        } finally {
            setDeleting(false);
        }
    };

    const handleEditEvent = (event) => {
        // Open edit modal with event data
        setEditForm({
            title: event.title || '',
            description: event.description || '',
            startDate: event.startDate ? event.startDate.split('T')[0] : '',
            startTime: event.startTime || '',
            venue: event.venue || '',
            isOnline: event.isOnline || false,
        });
        setEditModal(event);
    };

    const handleSaveEvent = async () => {
        if (!editModal || !editForm.title.trim()) {
            toast.error('Event title is required', { position: 'top-right' });
            return;
        }
        
        setEditing(true);
        try {
            await EventService.updateEvent(editModal._id, editForm);
            // Update the event in the list
            setEvents(events.map(e => e._id === editModal._id ? { ...e, ...editForm } : e));
            setEditModal(null);
            toast.success('Event updated successfully', { position: 'top-right' });
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to update event';
            toast.error(errorMsg, { position: 'top-right' });
        } finally {
            setEditing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex font-sans overflow-hidden">
            <AdminSidebar />
            
                <main className="flex-1 p-4 pt-24 sm:p-6 sm:pt-24 lg:ml-72 lg:p-12 lg:pt-12 overflow-y-auto">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end animate-fade-in">
                    <div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-2">Event Coordination</p>
                        <h1 className="text-4xl font-black text-white tracking-tighter">Event <span className="text-blue-500">Inventory</span></h1>
                    </div>
                    <button 
                        onClick={loadEvents}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all"
                    >
                        🔄 Refresh
                    </button>
                </header>

                {/* Search Bar */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search events by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-8 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-200">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400">Loading events...</p>
                        </div>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-slate-400 text-lg">No events found</p>
                        </div>
                    </div>
                ) : (
                    /* Events Table */
                    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl animate-slide-up">
                            <div className="overflow-x-auto">
                            <table className="w-full min-w-[920px]">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/60">
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Image</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Event Title</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Venue</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Mode</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredEvents.map((event) => (
                                    <tr key={event._id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {event.coverImageUrl ? (
                                                <img 
                                                    src={event.coverImageUrl} 
                                                    alt={event.title}
                                                    className="h-16 w-24 object-cover rounded-lg border border-slate-700"
                                                />
                                            ) : (
                                                <div className="h-16 w-24 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-sm border border-slate-700">
                                                    📭 No Image
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-white font-bold">{event.title}</p>
                                            <p className="text-slate-400 text-sm mt-1 line-clamp-1">{event.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 font-bold">
                                            {fmt(event.startDate)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {event.isOnline ? (
                                                <span className="text-amber-400 font-bold">🌐 Online</span>
                                            ) : (
                                                <span>{event.venue || '—'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                                                event.isOnline 
                                                    ? 'bg-amber-500/20 text-amber-300' 
                                                    : 'bg-blue-500/20 text-blue-300'
                                            }`}>
                                                {event.isOnline ? 'Online' : 'Physical'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                                                new Date(event.startDate) > new Date()
                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                    : 'bg-slate-500/20 text-slate-300'
                                            }`}>
                                                {new Date(event.startDate) > new Date() ? '📅 Upcoming' : '✅ Completed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleEditEvent(event)}
                                                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all"
                                                    title="Edit Event"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteModal(event)}
                                                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all"
                                                    title="Delete Event"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                            </div>
                        <div className="border-t border-slate-800 bg-slate-900/40 px-6 py-4">
                            <p className="text-slate-400 text-sm font-bold">
                                Showing {filteredEvents.length} of {events.length} events
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Edit Event Modal */}
            {editModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl w-full mx-4 my-8 shadow-2xl">
                        <div className="mb-6">
                            <h3 className="text-2xl font-black text-white mb-2">Edit Event</h3>
                            <p className="text-slate-400 text-sm">Update event details below</p>
                        </div>
                        
                        <div className="space-y-5 mb-8 max-h-96 overflow-y-auto">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Event Title *</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    placeholder="Event title"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Event description"
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
                                />
                            </div>

                            {/* Start Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Start Date *</label>
                                    <input
                                        type="date"
                                        value={editForm.startDate}
                                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Start Time</label>
                                    <input
                                        type="time"
                                        value={editForm.startTime}
                                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Event Type */}
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Event Type</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input
                                            type="radio"
                                            name="eventType"
                                            checked={!editForm.isOnline}
                                            onChange={() => setEditForm({ ...editForm, isOnline: false })}
                                            className="w-4 h-4"
                                        />
                                        <span>Physical</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input
                                            type="radio"
                                            name="eventType"
                                            checked={editForm.isOnline}
                                            onChange={() => setEditForm({ ...editForm, isOnline: true })}
                                            className="w-4 h-4"
                                        />
                                        <span>Online</span>
                                    </label>
                                </div>
                            </div>

                            {/* Venue - show only for physical events */}
                            {!editForm.isOnline && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Venue</label>
                                    <input
                                        type="text"
                                        value={editForm.venue}
                                        onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                                        placeholder="Event venue location"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditModal(null)}
                                disabled={editing}
                                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEvent}
                                disabled={editing}
                                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                                {editing ? 'Saving...' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-black text-white mb-2">Delete Event?</h3>
                            <p className="text-slate-400 text-sm">This action cannot be undone.</p>
                        </div>
                        
                        <div className="bg-slate-800/50 rounded-xl p-4 mb-8 border border-slate-800">
                            <p className="text-white font-bold text-sm">{deleteModal.title}</p>
                            <p className="text-slate-400 text-xs mt-1">ID: {deleteModal._id}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteEvent}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : '🗑️ Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 1.2s ease-out both; }
                .animate-slide-up { animation: slideUp 1s ease-out both; }
                .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
                `
            }} />
        </div>
    );
};

export default AdminEvents;
