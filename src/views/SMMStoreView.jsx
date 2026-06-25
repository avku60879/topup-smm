import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Globe, Link, Calculator, ShoppingBag } from 'lucide-react';

const SERVICES_DATA = {
  instagram: {
    name: 'Instagram Services',
    icon: '📸',
    services: [
      { id: '101', name: 'Instagram Followers [Real / High Quality / 30D Refill]', rate: 1.20, min: 100, max: 50000 },
      { id: '102', name: 'Instagram Likes [Super Fast / No Drop]', rate: 0.45, min: 50, max: 20000 },
      { id: '103', name: 'Instagram Video Views [Instant / High Speed]', rate: 0.15, min: 100, max: 100000 },
      { id: '104', name: 'Instagram Custom Comments [Emoji & Text]', rate: 2.80, min: 10, max: 2000 }
    ]
  },
  tiktok: {
    name: 'TikTok Services',
    icon: '🎵',
    services: [
      { id: '201', name: 'TikTok Followers [Real Users / Fast Start]', rate: 2.50, min: 100, max: 30000 },
      { id: '202', name: 'TikTok Video Views [High Retention / Instant]', rate: 0.08, min: 500, max: 500000 },
      { id: '203', name: 'TikTok Video Likes [Real & Safe]', rate: 0.90, min: 100, max: 25000 }
    ]
  },
  youtube: {
    name: 'YouTube Services',
    icon: '📺',
    services: [
      { id: '301', name: 'YouTube Subscribers [Lifetime Warranty / Organic]', rate: 12.00, min: 50, max: 10000 },
      { id: '302', name: 'YouTube Video Views [High Retention / Monetizable]', rate: 3.20, min: 500, max: 100000 },
      { id: '303', name: 'YouTube Video Likes [Instant / Safe]', rate: 1.80, min: 100, max: 20000 }
    ]
  },
  facebook: {
    name: 'Facebook Services',
    icon: '👥',
    services: [
      { id: '401', name: 'Facebook Page Followers & Likes [Real / Non-Drop]', rate: 3.50, min: 100, max: 50000 },
      { id: '402', name: 'Facebook Post Likes [Instant / Emoji Mixed]', rate: 0.95, min: 100, max: 20000 },
      { id: '403', name: 'Facebook Video Views [3-Seconds / High speed]', rate: 0.25, min: 500, max: 100000 }
    ]
  }
};

function SMMStoreView({ user, fetchProfile, token }) {
  const [category, setCategory] = useState('instagram');
  const [selectedService, setSelectedService] = useState(SERVICES_DATA.instagram.services[0]);
  const [targetLink, setTargetLink] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [calculatedCost, setCalculatedCost] = useState(0.00);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Category Switch
  const handleCategoryChange = (catKey) => {
    setCategory(catKey);
    const firstService = SERVICES_DATA[catKey].services[0];
    setSelectedService(firstService);
    setQuantity(firstService.min);
    setError('');
    setSuccessMsg('');
  };

  // Recalculate Cost dynamically
  useEffect(() => {
    if (selectedService && quantity) {
      const cost = (quantity / 1000) * selectedService.rate;
      setCalculatedCost(parseFloat(cost.toFixed(3)));
    } else {
      setCalculatedCost(0.00);
    }
  }, [selectedService, quantity]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!targetLink) return setError('Please enter a valid target link/URL.');
    
    const qtyVal = parseInt(quantity);
    if (isNaN(qtyVal) || qtyVal < selectedService.min || qtyVal > selectedService.max) {
      return setError(`Quantity must be between ${selectedService.min} and ${selectedService.max} for this service.`);
    }

    if (user.balance < calculatedCost) {
      return setError('Insufficient balance. Please deposit funds into your wallet.');
    }

    setOrdering(true);
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'smm',
          category: SERVICES_DATA[category].name,
          service: `${selectedService.id} - ${selectedService.name}`,
          target: targetLink,
          details: `Rate: $${selectedService.rate.toFixed(2)} per 1000`,
          quantity: qtyVal,
          price: calculatedCost
        })
      });

      const data = await response.json();

      if (response.ok) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#7c3bed', '#10b981']
        });

        setSuccessMsg(`SMM Order placed successfully! Ordered ${qtyVal} units for your link. Status: Processing.`);
        fetchProfile();
        setTargetLink('');
        setQuantity(selectedService.min);
      } else {
        setError(data.error || 'Failed to place SMM order.');
      }
    } catch (err) {
      setError('Connection failed. Please verify server.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 className="section-title">Wholesale SMM Services Panel</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Connect directly to premium wholesale SMM server nodes. Instantly boost followers, views, likes, and reach on major social networks.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '28px' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          {/* Category Selector Tabs */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label><Globe size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Select Social Media Platform</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {Object.keys(SERVICES_DATA).map((catKey) => (
                <button
                  key={catKey}
                  type="button"
                  className={`btn-secondary ${category === catKey ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(catKey)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    background: category === catKey ? 'linear-gradient(135deg, var(--color-primary), #9333ea)' : 'rgba(255, 255, 255, 0.03)',
                    color: category === catKey ? '#fff' : 'var(--text-primary)',
                    boxShadow: category === catKey ? '0 4px 10px var(--color-primary-glow)' : 'none',
                    border: '1px solid var(--panel-border)'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{SERVICES_DATA[catKey].icon}</span>
                  {SERVICES_DATA[catKey].name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Service Selector Dropdown */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Select Specific SMM Service Bundle</label>
            <select
              className="input-style"
              style={{ background: 'rgba(9, 13, 22, 0.9)', cursor: 'pointer' }}
              value={selectedService.id}
              onChange={(e) => {
                const s = SERVICES_DATA[category].services.find(item => item.id === e.target.value);
                setSelectedService(s);
                setQuantity(s.min);
              }}
            >
              {SERVICES_DATA[category].services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - (${s.rate.toFixed(2)} / 1K units)
                </option>
              ))}
            </select>
          </div>

          {/* Social Link Input */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label><Link size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Target Link / Social URL</label>
            <input
              type="url"
              className="input-style"
              placeholder="e.g., https://instagram.com/yourprofile or post link"
              value={targetLink}
              onChange={(e) => setTargetLink(e.target.value)}
              required
            />
          </div>

          {/* Quantity and dynamic calculation panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><Calculator size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Enter Quantity</label>
              <input
                type="number"
                className="input-style"
                min={selectedService.min}
                max={selectedService.max}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || '')}
                required
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Min: {selectedService.min} | Max: {selectedService.max}
              </span>
            </div>

            {/* Dynamic Price Output Badge */}
            <div className="price-summary-panel" style={{ margin: 0, padding: '10px 16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estimated Cost:</span>
                <div className="price-summary-val" style={{ fontSize: '20px' }}>${calculatedCost.toFixed(2)}</div>
              </div>
              <button type="submit" className="glow-btn" disabled={ordering} style={{ padding: '10px 16px', borderRadius: '8px' }}>
                <ShoppingBag size={16} />
                <span>{ordering ? 'Ordering...' : 'Place Order'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SMMStoreView;
