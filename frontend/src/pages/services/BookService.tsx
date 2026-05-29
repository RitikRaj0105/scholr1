import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import './styles/BookService.css';

export default function BookService() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    serviceAddress: '',
    pincode: '',
    bookingDate: '',
    startTime: '',
    durationMinutes: 60,
    notes: '',
    expectedPrice: '',
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/services/providers/${providerId}`);
        setProvider(data);
        if (data.hourlyRate) {
          setForm((f) => ({ ...f, expectedPrice: data.hourlyRate.toString() }));
        } else if (data.fixedPrice) {
          setForm((f) => ({ ...f, expectedPrice: data.fixedPrice.toString() }));
        }
      } catch {
        setError('Provider not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [providerId]);

  function detectLocation() {
    if (!navigator.geolocation) return setError('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
      },
      () => setError('Could not detect location')
    );
  }

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.serviceAddress.trim()) return setError('Service address is required');
    if (!form.bookingDate) return setError('Booking date is required');

    setSubmitting(true);
    try {
      await api.post('/services/bookings', {
        providerId,
        serviceAddress: form.serviceAddress,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
        pincode: form.pincode || undefined,
        bookingDate: form.bookingDate,
        startTime: form.startTime || undefined,
        durationMinutes: Number(form.durationMinutes) || undefined,
        notes: form.notes || undefined,
        expectedPrice: form.expectedPrice ? parseFloat(form.expectedPrice) : undefined,
      });
      navigate('/services/my-bookings', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="bk-wrapper"><div className="bk-loading">Loading…</div></div>;
  }
  if (!provider) {
    return <div className="bk-wrapper"><div className="bk-loading">Provider not found</div></div>;
  }

  return (
    <div className="bk-wrapper">
      <motion.div
        className="bk-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="bk-title">Book service</h1>
        <p className="bk-subtitle">Fill in the details and the provider will be notified instantly.</p>

        <div className="bk-provider-card">
          <div className="bk-prov-avatar">
            {provider.user?.avatarUrl ? (
              <img src={provider.user.avatarUrl} alt="" />
            ) : (
              <span>{provider.displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="bk-prov-name">{provider.displayName}</div>
            <div className="bk-prov-cat">
              {provider.category === 'OTHER' && provider.customCategory
                ? provider.customCategory
                : provider.category.replace(/_/g, ' ')}
            </div>
            <div className="bk-prov-rating">
              ★ {provider.avgRating.toFixed(1)} · {provider.totalReviews} reviews
            </div>
          </div>
        </div>

        {error && <div className="bk-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="bk-field">
            <label className="bk-label">Service address *</label>
            <input
              className="bk-input"
              value={form.serviceAddress}
              onChange={(e) => update('serviceAddress', e.target.value)}
              placeholder="House #123, Street, Area, Landmark"
              required
            />
            <button type="button" className="bk-btn-text" onClick={detectLocation}>
              📍 Use my current location coordinates
            </button>
            {form.latitude !== 0 && (
              <div className="bk-loc-display">✓ Location coordinates attached</div>
            )}
          </div>

          <div className="bk-field">
            <label className="bk-label">Pincode</label>
            <input
              className="bk-input"
              value={form.pincode}
              onChange={(e) => update('pincode', e.target.value)}
              placeholder="800001"
              maxLength={6}
            />
          </div>

          <div className="bk-grid-2">
            <div className="bk-field">
              <label className="bk-label">Booking date *</label>
              <input
                className="bk-input"
                type="date"
                value={form.bookingDate}
                onChange={(e) => update('bookingDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="bk-field">
              <label className="bk-label">Start time</label>
              <input
                className="bk-input"
                type="time"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
              />
            </div>
          </div>

          <div className="bk-grid-2">
            <div className="bk-field">
              <label className="bk-label">Duration (minutes)</label>
              <input
                className="bk-input"
                type="number"
                min={15}
                step={15}
                value={form.durationMinutes}
                onChange={(e) => update('durationMinutes', e.target.value)}
              />
            </div>
            <div className="bk-field">
              <label className="bk-label">Expected price ({provider.currency})</label>
              <input
                className="bk-input"
                type="number"
                min={0}
                value={form.expectedPrice}
                onChange={(e) => update('expectedPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="bk-field">
            <label className="bk-label">Special instructions (optional)</label>
            <textarea
              className="bk-input bk-textarea"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Anything the provider should know..."
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="bk-actions">
            <button type="button" className="bk-btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="bk-btn-primary" disabled={submitting}>
              {submitting ? 'Booking…' : 'Send booking request'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
