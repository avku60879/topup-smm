import React, { useState, useEffect } from 'react';
import { Search, Calendar, RefreshCw, ShoppingCart, Globe } from 'lucide-react';

function OrdersView({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, gaming, smm
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and Search logic
  const filteredOrders = orders.filter(ord => {
    const matchesType = filterType === 'all' || ord.type === filterType;
    const matchesSearch = 
      ord.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.target.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>All Placed Orders</h3>
        <button className="btn-secondary" onClick={fetchOrders} style={{ padding: '8px 14px', fontSize: '13px', gap: '6px' }}>
          <RefreshCw size={14} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        paddingBottom: '16px'
      }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'gaming', 'smm'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className="btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '8px',
                textTransform: 'capitalize',
                background: filterType === t ? 'rgba(124, 61, 237, 0.08)' : 'transparent',
                borderColor: filterType === t ? 'var(--color-primary)' : 'var(--panel-border)',
                color: filterType === t ? 'var(--color-primary)' : 'var(--text-primary)'
              }}
            >
              {t === 'all' ? 'Show All' : t === 'gaming' ? '🎮 Gaming' : '🚀 SMM'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <input
            type="text"
            className="input-style"
            placeholder="Search by game, service, or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', paddingRight: '16px', borderRadius: '8px', paddingHeight: '38px', fontSize: '13px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }} className="animate-pulse">Loading order histories...</p>
        ) : filteredOrders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No orders found matching the filter criteria.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Service Details</th>
                <th>Target Target</th>
                <th>Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => (
                <tr key={ord.id || ord._id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ marginRight: '8px' }}>{ord.type === 'gaming' ? '🎮' : '🚀'}</span>
                    {ord.category}
                  </td>
                  <td>{ord.service}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--color-secondary)' }}>
                    {ord.target} {ord.details && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({ord.details})</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>${ord.price.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${
                      ord.status === 'Completed' ? 'badge-completed' :
                      ord.status === 'Processing' ? 'badge-processing' : 'badge-pending'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default OrdersView;
