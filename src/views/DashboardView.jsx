import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Users, 
  History, 
  Headphones, 
  ArrowRight, 
  Plus, 
  DollarSign, 
  ShoppingCart,
  MessageSquare
} from 'lucide-react';

function DashboardView({ user, setCurrentView, token }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeTickets: 0,
    recentActivities: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders to get total orders count
      const ordRes = await fetch('/api/orders/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orders = await ordRes.json();

      // Fetch tickets
      const tktRes = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tickets = await tktRes.json();

      // Calculate recent activities
      const activities = [];
      
      // Add orders to activities
      if (Array.isArray(orders)) {
        orders.slice(0, 3).forEach(o => {
          activities.push({
            id: o._id || o.id,
            type: 'order',
            title: `Ordered ${o.service} (${o.category})`,
            desc: `Target: ${o.target} - Price: $${o.price.toFixed(2)}`,
            status: o.status,
            createdAt: new Date(o.createdAt)
          });
        });
      }

      // Add tickets to activities
      if (Array.isArray(tickets)) {
        tickets.slice(0, 2).forEach(t => {
          activities.push({
            id: t._id || t.id,
            type: 'ticket',
            title: `Support Ticket: ${t.subject}`,
            desc: `Status: ${t.status} - Priority: ${t.priority}`,
            status: t.status,
            createdAt: new Date(t.createdAt)
          });
        });
      }

      // Sort combined activities by date
      activities.sort((a, b) => b.createdAt - a.createdAt);

      setStats({
        totalOrders: Array.isArray(orders) ? orders.length : 0,
        activeTickets: Array.isArray(tickets) ? tickets.filter(t => t.status !== 'Closed').length : 0,
        recentActivities: activities.slice(0, 5)
      });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(124, 61, 237, 0.15), rgba(6, 182, 212, 0.15))',
        borderLeft: '4px solid var(--color-primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '8px' }}>Welcome back, <span className="gradient-text">{user.username}</span>!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Grow your gaming accounts and boost your social media influence instantly.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="glow-btn" onClick={() => setCurrentView('gaming')}>
            <ShoppingCart size={18} />
            <span>Buy Credits</span>
          </button>
          <button className="btn-secondary" onClick={() => setCurrentView('smm')}>
            <Plus size={18} />
            <span>SMM Store</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        {/* Wallet Balance */}
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(124, 61, 237, 0.1)', color: 'var(--color-primary)' }}>
            <Wallet size={24} />
          </div>
          <div className="stat-info" style={{ flex: 1 }}>
            <span className="stat-label">Wallet Balance</span>
            <span className="stat-value">${user.balance.toFixed(2)}</span>
          </div>
          <button 
            className="action-icon-btn" 
            title="Deposit Funds"
            onClick={() => setCurrentView('wallet')}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Affiliate Commission */}
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-secondary)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info" style={{ flex: 1 }}>
            <span className="stat-label">Affiliate Commission</span>
            <span className="stat-value">${user.affiliateEarnings.toFixed(2)}</span>
          </div>
          <button 
            className="action-icon-btn" 
            title="Affiliate Portal"
            onClick={() => setCurrentView('affiliate')}
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Total Orders */}
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
            <History size={24} />
          </div>
          <div className="stat-info" style={{ flex: 1 }}>
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{stats.totalOrders}</span>
          </div>
          <button 
            className="action-icon-btn" 
            title="View Order History"
            onClick={() => setCurrentView('orders')}
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Support Tickets */}
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
            <Headphones size={24} />
          </div>
          <div className="stat-info" style={{ flex: 1 }}>
            <span className="stat-label">Active Tickets</span>
            <span className="stat-value">{stats.activeTickets}</span>
          </div>
          <button 
            className="action-icon-btn" 
            title="Support Center"
            onClick={() => setCurrentView('support')}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Main Dashboard Layout Split */}
      <div className="dashboard-layout">
        {/* Recent Activity Panel */}
        <div className="glass-panel recent-activity">
          <h3 className="section-title">Recent Activity Logs</h3>
          {stats.recentActivities.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '32px 0', textAlign: 'center' }}>No recent activity found. Place your first order or deposit funds to get started!</p>
          ) : (
            <div className="activity-list">
              {stats.recentActivities.map(act => (
                <div key={act.id} className="activity-item">
                  <div className="activity-meta">
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{act.title}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{act.desc}</span>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className={`badge ${
                      act.status === 'Completed' ? 'badge-completed' :
                      act.status === 'Processing' || act.status === 'Replied' ? 'badge-processing' : 'badge-pending'
                    }`}>
                      {act.status}
                    </span>
                    <span className="activity-time">{act.createdAt.toLocaleDateString()} {act.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="section-title">Quick Actions</h3>
          
          <button 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'space-between', padding: '16px' }}
            onClick={() => setCurrentView('gaming')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>💎</span>
              <span style={{ textAlign: 'left', fontWeight: 600 }}>Top-Up Free Fire / PUBG</span>
            </div>
            <ArrowRight size={16} />
          </button>

          <button 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'space-between', padding: '16px' }}
            onClick={() => setCurrentView('smm')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🚀</span>
              <span style={{ textAlign: 'left', fontWeight: 600 }}>Instagram Followers</span>
            </div>
            <ArrowRight size={16} />
          </button>

          <button 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'space-between', padding: '16px' }}
            onClick={() => setCurrentView('wallet')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>💵</span>
              <span style={{ textAlign: 'left', fontWeight: 600 }}>Add Funds via bKash / Cards</span>
            </div>
            <ArrowRight size={16} />
          </button>

          <button 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'space-between', padding: '16px' }}
            onClick={() => setCurrentView('affiliate')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🔗</span>
              <span style={{ textAlign: 'left', fontWeight: 600 }}>Copy Affiliate Link</span>
            </div>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
