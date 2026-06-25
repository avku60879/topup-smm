import React, { useState, useEffect } from 'react';
import { Users, Link, Copy, DollarSign, Award, RefreshCw, Calendar } from 'lucide-react';

function AffiliateView({ user, token }) {
  const [stats, setStats] = useState({
    clicks: 0,
    signups: 0,
    earnings: 0.00,
    referralsList: [],
    commissionsList: []
  });
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Referral Link
  const referralLink = `${window.location.origin}/?ref=${user.affiliateCode}`;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/affiliate/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch affiliate stats:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    if (stats.earnings <= 0) return;
    
    setError('');
    setSuccessMsg('');
    setWithdrawing(true);

    try {
      const response = await fetch('/api/affiliate/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || 'Earnings successfully transferred to your main wallet.');
        fetchStats(); // Refresh stats
      } else {
        setError(data.error || 'Withdrawal failed.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Referral Link Card */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 className="section-title">Your Referral Partner Link</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
          Share your custom link. When others register and purchase gaming credits or SMM services, you instantly earn <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>5% commission</span> from all their orders forever.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <input
              type="text"
              readOnly
              value={referralLink}
              className="input-style"
              style={{ paddingRight: '48px', fontFamily: 'monospace', color: 'var(--color-secondary)', fontWeight: 600 }}
            />
            <button
              onClick={handleCopyLink}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: copied ? 'var(--color-success)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Copy Link"
            >
              <Copy size={20} className={copied ? 'animate-bounce' : ''} />
            </button>
          </div>
          <button className="glow-btn" onClick={handleCopyLink} style={{ gap: '8px' }}>
            <Link size={18} />
            <span>{copied ? 'Copied!' : 'Copy Partner Link'}</span>
          </button>
        </div>
      </div>

      {/* Message banners */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
          {successMsg}
        </div>
      )}

      {/* Affiliate Stats Grid */}
      <div className="stats-grid">
        {/* Link Clicks */}
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-secondary)' }}>
            <Link size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Referral Clicks</span>
            <span className="stat-value">{stats.clicks}</span>
          </div>
        </div>

        {/* Signups */}
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(124, 61, 237, 0.1)', color: 'var(--color-primary)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Registered Referrals</span>
            <span className="stat-value">{stats.signups}</span>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="stat-card glass-panel" style={{ gridColumn: 'span 2' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info" style={{ flex: 1 }}>
            <span className="stat-label">Available Partner Commission</span>
            <span className="stat-value">${stats.earnings.toFixed(2)}</span>
          </div>
          <button
            className="glow-btn"
            disabled={stats.earnings <= 0 || withdrawing}
            onClick={handleWithdraw}
            style={{ padding: '10px 18px', fontSize: '13px', borderRadius: '8px' }}
          >
            <Award size={16} />
            <span>{withdrawing ? 'Transferring...' : 'Transfer to Wallet'}</span>
          </button>
        </div>
      </div>

      {/* Tables split layout */}
      <div className="dashboard-layout">
        {/* Referrals List Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="section-title">Referred Users</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>List of players who registered under your link.</p>

          <div className="table-container">
            {stats.referralsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No referred signups yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Joined Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.referralsList.map((ref, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{ref.username}</td>
                      <td>{new Date(ref.joinedAt).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-completed">{ref.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Commission Ledgers Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="section-title">Commission Ledger</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Latest commission transaction payouts.</p>

          <div className="table-container">
            {stats.commissionsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No commissions earned yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payout</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.commissionsList.map((comm) => (
                    <tr key={comm.id || comm._id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        {new Date(comm.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>+${comm.amount.toFixed(2)}</td>
                      <td>
                        <span className="badge badge-completed">{comm.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AffiliateView;
