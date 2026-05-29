import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import './styles/ProviderDetail.css';

const REPORT_REASONS = [
  { id: 'FAKE_PROFILE', label: 'Fake profile' },
  { id: 'SPAM', label: 'Spam' },
  { id: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { id: 'FRAUD', label: 'Fraud / Scam' },
  { id: 'POOR_QUALITY', label: 'Poor quality service' },
  { id: 'HARASSMENT', label: 'Harassment' },
  { id: 'OTHER', label: 'Other' },
];

export default function ProviderDetail() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('FAKE_PROFILE');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/services/providers/${providerId}`);
        setProvider(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [providerId]);

  async function toggleFavorite() {
    if (!provider) return;
    const { data } = await api.post(`/services/favorites/${provider.id}`);
    setProvider({ ...provider, isFavorited: data.favorited });
  }

  async function submitReport() {
    try {
      await api.post(`/services/providers/${providerId}/report`, {
        reason: reportReason,
        details: reportDetails,
      });
      setReportOpen(false);
      alert('Report submitted. Our admin team will review it.');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to submit report');
    }
  }

  if (loading) {
    return <div className="pd-wrapper"><div className="pd-loading">Loading…</div></div>;
  }
  if (!provider) {
    return (
      <div className="pd-wrapper">
        <div className="pd-empty">
          <h2>Provider not found</h2>
          <button className="pd-btn-primary" onClick={() => navigate('/services')}>
            Back to services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-wrapper">
      <button className="pd-back" onClick={() => navigate(-1)}>← Back</button>

      <motion.div
        className="pd-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="pd-hero-cover">
          {provider.portfolioImages?.[0] && (
            <img src={provider.portfolioImages[0]} alt="Cover" />
          )}
        </div>

        <div className="pd-hero-content">
          <div className="pd-hero-avatar">
            {provider.user?.avatarUrl ? (
              <img src={provider.user.avatarUrl} alt={provider.displayName} />
            ) : (
              <span>{provider.displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="pd-hero-info">
            <h1 className="pd-name">
              {provider.displayName}
              {provider.isVerified && <span className="pd-verified">✓ Verified</span>}
            </h1>
            <div className="pd-cat">
              {provider.category === 'OTHER' && provider.customCategory
                ? provider.customCategory
                : provider.category.replace(/_/g, ' ')}
            </div>
            <div className="pd-rating">
              <span className="pd-stars">
                {'★'.repeat(Math.round(provider.avgRating))}
                {'☆'.repeat(5 - Math.round(provider.avgRating))}
              </span>
              <span className="pd-rating-num">
                {provider.avgRating.toFixed(1)} ({provider.totalReviews} reviews)
              </span>
              <span className="pd-bookings">· {provider.totalBookings} bookings</span>
            </div>
          </div>

          <div className="pd-hero-actions">
            <button
              className={`pd-btn-icon ${provider.isFavorited ? 'active' : ''}`}
              onClick={toggleFavorite}
            >
              {provider.isFavorited ? '❤️' : '🤍'}
            </button>
            <button className="pd-btn-primary" onClick={() => navigate(`/services/book/${provider.id}`)}>
              Book Now
            </button>
          </div>
        </div>
      </motion.div>

      <div className="pd-content">
        <div className="pd-main">
          {/* About */}
          {provider.bio && (
            <section className="pd-section">
              <h2 className="pd-section-title">About</h2>
              <p className="pd-bio">{provider.bio}</p>
            </section>
          )}

          {/* Skills */}
          {provider.skills?.length > 0 && (
            <section className="pd-section">
              <h2 className="pd-section-title">Skills</h2>
              <div className="pd-skills">
                {provider.skills.map((s: string) => (
                  <span key={s} className="pd-skill-chip">{s}</span>
                ))}
              </div>
            </section>
          )}

          {/* Portfolio */}
          {provider.portfolioImages?.length > 1 && (
            <section className="pd-section">
              <h2 className="pd-section-title">Work portfolio</h2>
              <div className="pd-portfolio">
                {provider.portfolioImages.slice(1).map((img: string, i: number) => (
                  <img key={i} src={img} alt={`Work ${i + 1}`} />
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="pd-section">
            <h2 className="pd-section-title">Reviews ({provider.totalReviews})</h2>
            {provider.reviews?.length > 0 ? (
              <div className="pd-reviews">
                {provider.reviews.map((r: any) => (
                  <div key={r.id} className="pd-review">
                    <div className="pd-review-head">
                      <div className="pd-review-avatar">
                        {r.customer?.avatarUrl ? (
                          <img src={r.customer.avatarUrl} alt="" />
                        ) : (
                          <span>{(r.customer?.firstName || '?').charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="pd-review-name">
                          {r.customer?.firstName} {r.customer?.lastName}
                        </div>
                        <div className="pd-review-meta">
                          <span className="pd-stars">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </span>
                          <span>· {new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {r.comment && <p className="pd-review-text">{r.comment}</p>}
                    {r.providerReply && (
                      <div className="pd-review-reply">
                        <strong>Provider reply:</strong> {r.providerReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="pd-muted">No reviews yet.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="pd-sidebar">
          <div className="pd-side-card">
            <h3 className="pd-side-title">Pricing</h3>
            {provider.hourlyRate && (
              <div className="pd-price">
                {provider.currency} {provider.hourlyRate} <span>/{provider.priceUnit}</span>
              </div>
            )}
            {provider.fixedPrice && (
              <div className="pd-price-fixed">
                Fixed: {provider.currency} {provider.fixedPrice}
              </div>
            )}
            {!provider.hourlyRate && !provider.fixedPrice && (
              <p className="pd-muted">Contact for pricing</p>
            )}
          </div>

          <div className="pd-side-card">
            <h3 className="pd-side-title">Service area</h3>
            <p className="pd-side-text">
              📍 {provider.city || 'Local area'}
              <br />
              Within {provider.serviceRadiusKm} km
            </p>
          </div>

          <div className="pd-side-card">
            <h3 className="pd-side-title">Experience</h3>
            <p className="pd-side-text">{provider.experienceYears} years</p>
          </div>

          <button className="pd-btn-text" onClick={() => setReportOpen(true)}>
            🚩 Report this provider
          </button>
        </aside>
      </div>

      {/* Report modal */}
      {reportOpen && (
        <div className="pd-modal-overlay" onClick={() => setReportOpen(false)}>
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Report provider</h3>
            <div className="pd-field">
              <label className="pd-label">Reason</label>
              <select
                className="pd-input"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="pd-field">
              <label className="pd-label">Details (optional)</label>
              <textarea
                className="pd-input"
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Please describe the issue..."
              />
            </div>
            <div className="pd-modal-actions">
              <button className="pd-btn-secondary" onClick={() => setReportOpen(false)}>Cancel</button>
              <button className="pd-btn-primary" onClick={submitReport}>Submit report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
