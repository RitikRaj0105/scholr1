import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import './styles/MyBookings.css';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'amber',
  ACCEPTED: 'blue',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

export default function MyBookings() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [statusFilter, setStatusFilter] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateOpen, setRateOpen] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    load();
  }, [role, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/services/bookings', {
        params: { role, status: statusFilter || undefined },
      });
      setBookings(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function respond(bookingId: string, action: 'ACCEPT' | 'REJECT') {
    let providerNote = '';
    if (action === 'REJECT') {
      providerNote = prompt('Reason for rejection (optional):') || '';
    }
    await api.post(`/services/bookings/${bookingId}/respond`, { action, providerNote });
    load();
  }

  async function completeBooking(bookingId: string) {
    const finalPrice = prompt('Final price for this service:');
    if (!finalPrice) return;
    await api.post(`/services/bookings/${bookingId}/complete`, {
      finalPrice: parseFloat(finalPrice),
    });
    load();
  }

  async function cancelBooking(bookingId: string) {
    const reason = prompt('Reason for cancellation (optional):') || '';
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    await api.post(`/services/bookings/${bookingId}/cancel`, { reason });
    load();
  }

  async function submitRating() {
    if (!rateOpen) return;
    try {
      await api.post('/services/reviews', {
        bookingId: rateOpen.id,
        rating,
        comment,
      });
      setRateOpen(null);
      setRating(5);
      setComment('');
      load();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to submit review');
    }
  }

  return (
    <div className="mb-wrapper">
      <div className="mb-header">
        <h1 className="mb-title">My Bookings</h1>
        <button className="mb-btn-secondary" onClick={() => navigate('/services')}>
          ← Back to services
        </button>
      </div>

      <div className="mb-tabs">
        <button
          className={`mb-tab ${role === 'customer' ? 'active' : ''}`}
          onClick={() => setRole('customer')}
        >
          As Customer
        </button>
        <button
          className={`mb-tab ${role === 'provider' ? 'active' : ''}`}
          onClick={() => setRole('provider')}
        >
          As Provider
        </button>
      </div>

      <div className="mb-filters">
        <select
          className="mb-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="mb-loading">Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div className="mb-empty">
          <div className="mb-empty-icon">📋</div>
          <h3>No bookings yet</h3>
          <p>
            {role === 'customer'
              ? 'Browse services and make your first booking.'
              : "You haven't received any booking requests yet."}
          </p>
        </div>
      ) : (
        <div className="mb-list">
          {bookings.map((b, idx) => {
            const other = role === 'customer' ? b.provider : b.customer;
            const otherName =
              role === 'customer'
                ? b.provider?.displayName
                : `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.trim() || 'Customer';
            const otherAvatar =
              role === 'customer'
                ? b.provider?.user?.avatarUrl
                : b.customer?.avatarUrl;
            const otherPhone =
              role === 'customer'
                ? b.provider?.user?.phone || b.provider?.contactPhone
                : b.customer?.phone;

            return (
              <motion.div
                key={b.id}
                className="mb-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.3) }}
              >
                <div className="mb-card-head">
                  <div className="mb-card-avatar">
                    {otherAvatar ? (
                      <img src={otherAvatar} alt="" />
                    ) : (
                      <span>{(otherName || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="mb-card-info">
                    <div className="mb-card-name">{otherName}</div>
                    <div className="mb-card-date">
                      📅 {new Date(b.bookingDate).toLocaleDateString()}
                      {b.startTime && ` · ⏰ ${b.startTime}`}
                    </div>
                  </div>
                  <span className={`mb-status mb-status-${STATUS_COLORS[b.status]}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mb-card-body">
                  <div className="mb-detail">
                    <span className="mb-detail-label">Address:</span> {b.serviceAddress}
                  </div>
                  {b.notes && (
                    <div className="mb-detail">
                      <span className="mb-detail-label">Notes:</span> {b.notes}
                    </div>
                  )}
                  {b.expectedPrice && (
                    <div className="mb-detail">
                      <span className="mb-detail-label">Expected:</span> ₹{b.expectedPrice}
                    </div>
                  )}
                  {b.finalPrice && (
                    <div className="mb-detail">
                      <span className="mb-detail-label">Final:</span> ₹{b.finalPrice}
                    </div>
                  )}
                  {b.providerNote && (
                    <div className="mb-detail">
                      <span className="mb-detail-label">Provider note:</span> {b.providerNote}
                    </div>
                  )}
                  {otherPhone && (b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS') && (
                    <div className="mb-detail">
                      <span className="mb-detail-label">Contact:</span>{' '}
                      <a href={`tel:${otherPhone}`} className="mb-link">{otherPhone}</a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mb-card-actions">
                  <button
                    className="mb-btn-text"
                    onClick={() => navigate(`/services/chat/${b.id}`)}
                  >
                    💬 Chat
                  </button>

                  {/* Provider actions */}
                  {role === 'provider' && b.status === 'PENDING' && (
                    <>
                      <button className="mb-btn-success" onClick={() => respond(b.id, 'ACCEPT')}>
                        Accept
                      </button>
                      <button className="mb-btn-danger" onClick={() => respond(b.id, 'REJECT')}>
                        Reject
                      </button>
                    </>
                  )}

                  {role === 'provider' && ['ACCEPTED', 'IN_PROGRESS'].includes(b.status) && (
                    <button className="mb-btn-primary" onClick={() => completeBooking(b.id)}>
                      Mark complete
                    </button>
                  )}

                  {/* Customer actions */}
                  {role === 'customer' && b.status === 'COMPLETED' && !b.review && (
                    <button
                      className="mb-btn-primary"
                      onClick={() => setRateOpen(b)}
                    >
                      ⭐ Rate service
                    </button>
                  )}

                  {role === 'customer' && b.status === 'COMPLETED' && b.review && (
                    <span className="mb-rated">✓ Rated {b.review.rating}★</span>
                  )}

                  {/* Cancel (both) */}
                  {['PENDING', 'ACCEPTED'].includes(b.status) && (
                    <button className="mb-btn-text" onClick={() => cancelBooking(b.id)}>
                      Cancel
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rating modal */}
      {rateOpen && (
        <div className="mb-modal-overlay" onClick={() => setRateOpen(null)}>
          <div className="mb-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rate your service</h3>
            <p className="mb-modal-sub">How was your experience with {rateOpen.provider?.displayName}?</p>

            <div className="mb-stars-input">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`mb-star ${n <= rating ? 'active' : ''}`}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className="mb-input"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a review (optional)..."
            />

            <div className="mb-modal-actions">
              <button className="mb-btn-secondary" onClick={() => setRateOpen(null)}>
                Cancel
              </button>
              <button className="mb-btn-primary" onClick={submitRating}>
                Submit review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
