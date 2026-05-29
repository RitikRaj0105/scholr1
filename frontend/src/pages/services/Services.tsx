import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import './styles/Services.css';

const CATEGORIES = [
  { id: 'ALL', label: 'All', icon: '🌐' },
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

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

interface Provider {
  id: string;
  displayName: string;
  category: string;
  customCategory?: string | null;
  bio?: string | null;
  hourlyRate?: number | null;
  fixedPrice?: number | null;
  priceUnit: string;
  currency: string;
  city?: string | null;
  avgRating: number;
  totalReviews: number;
  availability: string;
  isVerified: boolean;
  distanceKm: number;
  isFavorited: boolean;
  user: { firstName?: string | null; lastName?: string | null; avatarUrl?: string | null };
  portfolioImages: string[];
}

export default function Services() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState({
    category: 'ALL',
    radius: 25,
    minRating: 0,
    search: '',
  });

  // Get user's location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Your browser does not support location. Please enable it to discover services nearby.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.warn('Location denied:', err);
        // Default to a sane location (Patna, Bihar)
        setLocation({ lat: 25.5941, lng: 85.1376 });
        setError('Could not access your location. Showing default area. Click "Use my location" to retry.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Load providers when location or filters change
  useEffect(() => {
    if (!location) return;
    loadProviders();
  }, [location, filters.category, filters.radius, filters.minRating]);

  async function loadProviders() {
    if (!location) return;
    setLoading(true);
    try {
      const { data } = await api.get('/services/providers', {
        params: {
          lat: location.lat,
          lng: location.lng,
          radius: filters.radius,
          category: filters.category,
          minRating: filters.minRating || undefined,
          search: filters.search || undefined,
        },
      });
      setProviders(data.items || []);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(providerId: string) {
    try {
      const { data } = await api.post(`/services/favorites/${providerId}`);
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, isFavorited: data.favorited } : p))
      );
    } catch {}
  }

  function retryLocation() {
    setLocation(null);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Location access denied. Please enable it in your browser settings.')
    );
  }

  return (
    <div className="svc-wrapper">
      {/* Header */}
      <div className="svc-header">
        <div>
          <h1 className="svc-title">Services Marketplace</h1>
          <p className="svc-subtitle">Find local professionals near you</p>
        </div>
        <div className="svc-header-actions">
          <button className="svc-btn-secondary" onClick={() => navigate('/services/become-provider')}>
            Become a provider
          </button>
          <button className="svc-btn-secondary" onClick={() => navigate('/services/my-bookings')}>
            My bookings
          </button>
          <button className="svc-btn-secondary" onClick={() => navigate('/services/favorites')}>
            ❤️ Favorites
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="svc-search-row">
        <input
          className="svc-search-input"
          type="text"
          placeholder="Search by name, skill, or description…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && loadProviders()}
        />
        <button className="svc-btn-primary" onClick={loadProviders}>
          Search
        </button>
      </div>

      {/* Filters bar */}
      <div className="svc-filter-row">
        <div className="svc-filter-group">
          <label className="svc-filter-label">Within</label>
          <select
            className="svc-filter-input"
            value={filters.radius}
            onChange={(e) => setFilters((f) => ({ ...f, radius: parseInt(e.target.value) }))}
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </div>
        <div className="svc-filter-group">
          <label className="svc-filter-label">Min rating</label>
          <select
            className="svc-filter-input"
            value={filters.minRating}
            onChange={(e) => setFilters((f) => ({ ...f, minRating: parseFloat(e.target.value) }))}
          >
            <option value={0}>Any</option>
            <option value={3}>3★ & up</option>
            <option value={4}>4★ & up</option>
            <option value={4.5}>4.5★ & up</option>
          </select>
        </div>
        <button className="svc-btn-text" onClick={retryLocation}>
          📍 Use my location
        </button>
      </div>

      {/* Category chips */}
      <div className="svc-category-row">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`svc-cat-chip ${filters.category === c.id ? 'active' : ''}`}
            onClick={() => setFilters((f) => ({ ...f, category: c.id }))}
          >
            <span className="svc-cat-icon">{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {error && <div className="svc-error">{error}</div>}

      {/* Provider grid */}
      {loading ? (
        <div className="svc-loading">Loading nearby providers…</div>
      ) : providers.length === 0 ? (
        <div className="svc-empty">
          <div className="svc-empty-icon">🔎</div>
          <h3>No providers found nearby</h3>
          <p>Try expanding your search radius or picking a different category.</p>
        </div>
      ) : (
        <div className="svc-grid">
          {providers.map((p, idx) => (
            <motion.div
              key={p.id}
              className="svc-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.4) }}
              onClick={() => navigate(`/services/provider/${p.id}`)}
            >
              {/* Card image / avatar */}
              <div className="svc-card-image">
                {p.portfolioImages?.[0] ? (
                  <img src={p.portfolioImages[0]} alt={p.displayName} />
                ) : p.user?.avatarUrl ? (
                  <img src={p.user.avatarUrl} alt={p.displayName} />
                ) : (
                  <div className="svc-card-placeholder">
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  className={`svc-fav-btn ${p.isFavorited ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(p.id);
                  }}
                  aria-label="Favorite"
                >
                  {p.isFavorited ? '❤️' : '🤍'}
                </button>
                {p.isVerified && <span className="svc-verified">✓ Verified</span>}
              </div>

              {/* Card body */}
              <div className="svc-card-body">
                <div className="svc-card-name">{p.displayName}</div>
                <div className="svc-card-cat">
                  {p.category === 'OTHER' && p.customCategory
                    ? p.customCategory
                    : CATEGORIES.find((c) => c.id === p.category)?.label}
                </div>

                <div className="svc-card-rating">
                  <span className="svc-stars">{'★'.repeat(Math.round(p.avgRating))}{'☆'.repeat(5 - Math.round(p.avgRating))}</span>
                  <span className="svc-rating-num">
                    {p.avgRating.toFixed(1)} ({p.totalReviews})
                  </span>
                </div>

                <div className="svc-card-meta">
                  <span className="svc-distance">📍 {p.distanceKm.toFixed(1)} km away</span>
                  <span className={`svc-status svc-status-${p.availability.toLowerCase()}`}>
                    {p.availability === 'AVAILABLE' ? '● Available' : p.availability}
                  </span>
                </div>

                <div className="svc-card-price">
                  {p.hourlyRate
                    ? `${p.currency} ${p.hourlyRate}/${p.priceUnit}`
                    : p.fixedPrice
                    ? `${p.currency} ${p.fixedPrice}`
                    : 'Contact for pricing'}
                </div>

                <button
                  className="svc-card-book"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/services/book/${p.id}`);
                  }}
                >
                  Book Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
