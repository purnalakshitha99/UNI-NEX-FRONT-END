import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import EventService from '../services/eventService';
import AuthService from '../services/authService';

const EventsPage = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const role = (currentUser?.user?.role || currentUser?.role || '').toLowerCase();
  const isStudent = role === 'student';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await EventService.getPublicEvents();
        setEvents(response?.data?.events || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Events Directory</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">All Events</h1>
          <p className="mt-1 text-sm text-slate-500">Browse events created by all organizers.</p>
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
            <h2 className="text-xl font-black text-slate-900">No events available</h2>
            <p className="mt-2 text-sm text-slate-500">Check back soon for upcoming events.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <article key={event._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-44 bg-slate-100">
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

                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p>
                      <span className="font-bold text-slate-600">Date:</span>{' '}
                      {event.startDate ? new Date(event.startDate).toLocaleDateString() : '-'}
                    </p>
                    <p>
                      <span className="font-bold text-slate-600">Time:</span> {event.startTime || '-'}
                    </p>
                    <p>
                      <span className="font-bold text-slate-600">By:</span>{' '}
                      {event.createdBy?.firstName
                        ? `${event.createdBy.firstName} ${event.createdBy.lastName || ''}`.trim()
                        : 'Organizer'}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:border-blue-200 hover:text-blue-600"
                    >
                      View More
                    </button>
                    {isStudent && (
                      <button
                        onClick={() => navigate(`/events/${event._id}/payment`)}
                        className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700"
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {selectedEvent.coverImageUrl && (
              <img
                src={selectedEvent.coverImageUrl}
                alt={selectedEvent.title}
                className="mb-4 h-56 w-full rounded-xl object-cover"
              />
            )}

            <h3 className="text-2xl font-black text-slate-900">{selectedEvent.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{selectedEvent.description}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-600">
              <p><span className="font-bold">Date:</span> {selectedEvent.startDate ? new Date(selectedEvent.startDate).toLocaleDateString() : '-'}</p>
              <p><span className="font-bold">Time:</span> {selectedEvent.startTime || '-'}</p>
              <p><span className="font-bold">Category:</span> {selectedEvent.category}</p>
              <p><span className="font-bold">Visibility:</span> {selectedEvent.visibility}</p>
              <p><span className="font-bold">Mode:</span> {selectedEvent.isOnline ? 'Online' : 'Physical'}</p>
              <p><span className="font-bold">Venue:</span> {selectedEvent.isOnline ? (selectedEvent.meetLink || '-') : (selectedEvent.venue || '-')}</p>
            </div>

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Tickets</p>
              <div className="mt-2 space-y-2">
                {(selectedEvent.tickets?.length ? selectedEvent.tickets : [{ name: 'General Admission', price: 0 }]).map((ticket) => (
                  <div key={ticket.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-bold text-slate-700">{ticket.name}</span>
                    <span className="font-black text-blue-600">LKR {ticket.price || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              {isStudent && (
                <button
                  onClick={() => navigate(`/events/${selectedEvent._id}/payment`)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
