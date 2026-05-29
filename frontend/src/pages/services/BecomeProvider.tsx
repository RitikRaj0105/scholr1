import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import './styles/BecomeProvider.css';

const CATEGORIES = [
  { id: 'DRIVER', label: 'Driver', icon: '🚗' },
  { id: 'COOK', label: 'Cook', icon: '🍳' },
  { id: 'SALON_BEAUTY', label: 'Salon & Beauty', icon: '💇' },
  { id: 'HOUSEHOLD_HELP', label: 'Household Help', icon: '🏠' },
  { id: 'SECURITY_GUARD', label: 'Security Guard', icon: '🛡️' },
  { id: 'SHOP_RETAIL', label: 'Shop & Retail', icon: '🏪' },
  { id: 'EDUCATION_TUTOR', label: 'Education / Tutor', icon: '📚' },
  { id: 'HEALTHCARE', label: 'Healthcare', icon: '🏥' },
  { id: 'TECH_IT', label: 'Tech / IT', icon: '💻' },
  { id: 'REPAIR_MAINTENANCE', label: 'Repair & Maintenance', icon: '🔧' },
  { id: 'DELIVERY_LOGISTICS', label: 'Delivery & Logistics', icon: '📦' },
  { id: 'EVENT_SERVICES', label: 'Event Services', icon: '🎉' },
  { id: 'CLEANING_SERVICES', label: 'Cleaning Services', icon: '🧹' },
  { id: 'OTHER', label: 'Other', icon: '✨' },
];

const RADIUS_OPTIONS = [5, 10, 25, 50];
const PRICE_UNITS = ['hour', 'visit', 'job', 'day'];

export default function BecomeProvider() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    category: '',
    customCategory: '',
    bio: '',
    experienceYears: 0,
    skills: '',
    hourlyRate: '',
    fixedPrice: '',
    priceUnit: 'hour',
    currency: 'INR',
    contactPhone: '',
    contactEmail: '',
    latitude: 0,
    longitude: 0,
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    serviceRadiusKm: 10,
    portfolioImages: '',
  });

  // Load existing profile if editing
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/services/me/profile');
        if (data && data.id) {
          setEditing(true);
          setForm({
            displayName: data.displayName || '',
            category: data.category || '',
            customCategory: data.customCategory || '',
            bio: data.bio || '',
            experienceYears: data.experienceYears || 0,
            skills: (data.skills || []).join(', '),
            hourlyRate: data.hourlyRate?.toString() || '',
            fixedPrice: data.fixedPrice?.toString() || '',
            priceUnit: data.priceUnit || 'hour',
            currency: data.currency || 'INR',
            contactPhone: data.contactPhone || '',
            contactEmail: data.contactEmail || '',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            addressLine: data.addressLine || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
            serviceRadiusKm: data.serviceRadiusKm || 10,
            portfolioImages: (data.portfolioImages || []).join(', '),
          });
        }
      } catch {}
    })();
  }, []);

  function detectLocation() {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
      },
      (err) => setError('Could not detect location: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function update(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.displayName.trim()) return setError('Display name is required');
    if (!form.category) return setError('Please pick a service category');
    if (form.category === 'OTHER' && !form.customCategory.trim()) {
      return setError('Please specify your service type');
    }
    if (!form.latitude || !form.longitude) {
      return setError('Please set your location (click "Use my current location")');
    }

    setLoading(true);
    try {
      const payload = {
        displayName: form.displayName,
        category: form.category,
        customCategory: form.category === 'OTHER' ? form.customCategory : null,
        bio: form.bio || null,
        experienceYears: Number(form.experienceYears) || 0,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
        fixedPrice: form.fixedPrice ? parseFloat(form.fixedPrice) : null,
        priceUnit: form.priceUnit,
        currency: form.currency,
        contactPhone: form.contactPhone || null,
        contactEmail: form.contactEmail || null,
        latitude: form.latitude,
        longitude: form.longitude,
        addressLine: form.addressLine || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        serviceRadiusKm: Number(form.serviceRadiusKm),
        portfolioImages: form.portfolioImages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await api.post('/services/me/profile', payload);
      navigate('/services/provider/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bp-wrapper">
      <motion.form
        className="bp-form"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="bp-title">
          {editing ? 'Edit your service profile' : 'Become a service provider'}
        </h1>
        <p className="bp-subtitle">
          Create your profile to start receiving bookings from people near you.
        </p>

        {error && <div className="bp-error">{error}</div>}

        {/* Basic info */}
        <section className="bp-section">
          <h2 className="bp-section-title">Basic information</h2>

          <div className="bp-field">
            <label className="bp-label">Display name / Business name *</label>
            <input
              className="bp-input"
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              placeholder="John's Plumbing Services"
              required
            />
          </div>

          <div className="bp-field">
            <label className="bp-label">Service category *</label>
            <div className="bp-cat-grid">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`bp-cat-btn ${form.category === c.id ? 'active' : ''}`}
                  onClick={() => update('category', c.id)}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {form.category === 'OTHER' && (
            <div className="bp-field">
              <label className="bp-label">Specify your service *</label>
              <input
                className="bp-input"
                value={form.customCategory}
                onChange={(e) => update('customCategory', e.target.value)}
                placeholder="e.g. Pet grooming"
              />
            </div>
          )}

          <div className="bp-field">
            <label className="bp-label">About / Description</label>
            <textarea
              className="bp-input bp-textarea"
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              placeholder="Tell customers about your experience and what you offer..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="bp-grid-2">
            <div className="bp-field">
              <label className="bp-label">Years of experience</label>
              <input
                className="bp-input"
                type="number"
                min={0}
                max={80}
                value={form.experienceYears}
                onChange={(e) => update('experienceYears', e.target.value)}
              />
            </div>
            <div className="bp-field">
              <label className="bp-label">Skills (comma-separated)</label>
              <input
                className="bp-input"
                value={form.skills}
                onChange={(e) => update('skills', e.target.value)}
                placeholder="Plumbing, Electrical work, Painting"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bp-section">
          <h2 className="bp-section-title">Pricing</h2>
          <p className="bp-section-subtitle">Set hourly OR fixed price (or both). Leave blank for "contact for price".</p>

          <div className="bp-grid-3">
            <div className="bp-field">
              <label className="bp-label">Hourly rate ({form.currency})</label>
              <input
                className="bp-input"
                type="number"
                min={0}
                value={form.hourlyRate}
                onChange={(e) => update('hourlyRate', e.target.value)}
                placeholder="500"
              />
            </div>
            <div className="bp-field">
              <label className="bp-label">Fixed price ({form.currency})</label>
              <input
                className="bp-input"
                type="number"
                min={0}
                value={form.fixedPrice}
                onChange={(e) => update('fixedPrice', e.target.value)}
                placeholder="2500"
              />
            </div>
            <div className="bp-field">
              <label className="bp-label">Price unit</label>
              <select
                className="bp-input"
                value={form.priceUnit}
                onChange={(e) => update('priceUnit', e.target.value)}
              >
                {PRICE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    per {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bp-section">
          <h2 className="bp-section-title">Contact details</h2>
          <div className="bp-grid-2">
            <div className="bp-field">
              <label className="bp-label">Phone</label>
              <input
                className="bp-input"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
                placeholder="9876543210"
              />
            </div>
            <div className="bp-field">
              <label className="bp-label">Email</label>
              <input
                className="bp-input"
                type="email"
                value={form.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </section>

        {/* Location & Service area */}
        <section className="bp-section">
          <h2 className="bp-section-title">Location & service area *</h2>
          <p className="bp-section-subtitle">
            Your profile is only shown to customers within your service radius.
          </p>

          <button type="button" className="bp-btn-secondary" onClick={detectLocation}>
            📍 Use my current location
          </button>

          {form.latitude !== 0 && (
            <div className="bp-location-display">
              ✓ Location set: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
            </div>
          )}

          <div className="bp-field">
            <label className="bp-label">Address (optional, shown to booked customers)</label>
            <input
              className="bp-input"
              value={form.addressLine}
              onChange={(e) => update('addressLine', e.target.value)}
              placeholder="Street, area"
            />
          </div>

          <div className="bp-grid-3">
            <div className="bp-field">
              <label className="bp-label">City</label>
              <input
                className="bp-input"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </div>
            <div className="bp-field">
              <label className="bp-label">State</label>
              <input
                className="bp-input"
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
              />
            </div>
            <div className="bp-field">
              <label className="bp-label">Pincode</label>
              <input
                className="bp-input"
                value={form.pincode}
                onChange={(e) => update('pincode', e.target.value)}
                placeholder="800001"
              />
            </div>
          </div>

          <div className="bp-field">
            <label className="bp-label">Service radius — how far will you travel?</label>
            <div className="bp-radius-row">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`bp-radius-btn ${form.serviceRadiusKm === r ? 'active' : ''}`}
                  onClick={() => update('serviceRadiusKm', r)}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio */}
        <section className="bp-section">
          <h2 className="bp-section-title">Portfolio (optional)</h2>
          <div className="bp-field">
            <label className="bp-label">Image URLs (comma-separated)</label>
            <textarea
              className="bp-input bp-textarea"
              value={form.portfolioImages}
              onChange={(e) => update('portfolioImages', e.target.value)}
              placeholder="https://example.com/work1.jpg, https://example.com/work2.jpg"
              rows={2}
            />
            <p className="bp-hint">Paste image URLs separated by commas. First image is your cover.</p>
          </div>
        </section>

        <div className="bp-actions">
          <button type="button" className="bp-btn-secondary" onClick={() => navigate('/services')}>
            Cancel
          </button>
          <button type="submit" className="bp-btn-primary" disabled={loading}>
            {loading ? 'Saving…' : editing ? 'Save changes' : 'Create profile'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
