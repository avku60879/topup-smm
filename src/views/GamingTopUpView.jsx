import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Gamepad2, User, Landmark, ShoppingBag, ArrowLeft } from 'lucide-react';

const GAMES = [
  { 
    id: 'freefire', 
    name: 'Free Fire', 
    icon: '🔥', 
    tag: 'Garena',
    needsServer: false,
    denoms: [
      { id: 'ff_115', name: '115 Diamonds', price: 1.00 },
      { id: 'ff_240', name: '240 Diamonds', price: 2.00 },
      { id: 'ff_505', name: '505 Diamonds', price: 4.00 },
      { id: 'ff_1090', name: '1090 Diamonds', price: 8.00 },
      { id: 'ff_2240', name: '2240 Diamonds', price: 16.00 }
    ]
  },
  { 
    id: 'pubg', 
    name: 'PUBG Mobile', 
    icon: '🪂', 
    tag: 'Tencent',
    needsServer: false,
    denoms: [
      { id: 'pubg_60', name: '60 UC', price: 0.99 },
      { id: 'pubg_325', name: '325 UC', price: 4.99 },
      { id: 'pubg_660', name: '660 UC', price: 9.99 },
      { id: 'pubg_1800', name: '1800 UC', price: 24.99 },
      { id: 'pubg_3850', name: '3850 UC', price: 49.99 }
    ]
  },
  { 
    id: 'mlbb', 
    name: 'Mobile Legends', 
    icon: '⚔️', 
    tag: 'Moonton',
    needsServer: true,
    denoms: [
      { id: 'ml_86', name: '86 Diamonds', price: 1.50 },
      { id: 'ml_172', name: '172 Diamonds', price: 3.00 },
      { id: 'ml_257', name: '257 Diamonds', price: 4.50 },
      { id: 'ml_706', name: '706 Diamonds', price: 12.00 },
      { id: 'ml_2195', name: '2195 Diamonds', price: 36.00 }
    ]
  },
  { 
    id: 'roblox', 
    name: 'Roblox Robux', 
    icon: '🧱', 
    tag: 'Roblox Corp',
    needsServer: false,
    denoms: [
      { id: 'rbx_400', name: '400 Robux', price: 4.99 },
      { id: 'rbx_800', name: '800 Robux', price: 9.99 },
      { id: 'rbx_1700', name: '1700 Robux', price: 19.99 },
      { id: 'rbx_4500', name: '4500 Robux', price: 49.99 }
    ]
  },
  { 
    id: 'valorant', 
    name: 'Valorant Points', 
    icon: '🎯', 
    tag: 'Riot Games',
    needsServer: false,
    denoms: [
      { id: 'val_475', name: '475 VP', price: 4.99 },
      { id: 'val_1000', name: '1000 VP', price: 9.99 },
      { id: 'val_2050', name: '2050 VP', price: 19.99 },
      { id: 'val_5350', name: '5350 VP', price: 49.99 }
    ]
  },
  { 
    id: 'genshin', 
    name: 'Genshin Impact', 
    icon: '🔮', 
    tag: 'Cognosphere',
    needsServer: true,
    denoms: [
      { id: 'gen_60', name: '60 Genesis Crystals', price: 0.99 },
      { id: 'gen_300', name: '300 Genesis Crystals', price: 4.99 },
      { id: 'gen_980', name: '980 Genesis Crystals', price: 14.99 },
      { id: 'gen_1980', name: '1980 Genesis Crystals', price: 29.99 }
    ]
  }
];

function GamingTopUpView({ user, fetchProfile, token }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [serverId, setServerId] = useState('');
  const [selectedDenom, setSelectedDenom] = useState(null);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setSelectedDenom(null);
    setPlayerId('');
    setServerId('');
    setError('');
    setSuccessMsg('');
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!playerId) {
      return setError('Please enter your Player ID.');
    }
    if (selectedGame.needsServer && !serverId) {
      return setError('Please enter your Server ID.');
    }
    if (!selectedDenom) {
      return setError('Please select a denomination package.');
    }

    if (user.balance < selectedDenom.price) {
      return setError('Insufficient balance. Please deposit funds first.');
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
          type: 'gaming',
          category: selectedGame.name,
          service: selectedDenom.name,
          target: playerId,
          details: selectedGame.needsServer ? `Server: ${serverId}` : '',
          quantity: 1,
          price: selectedDenom.price
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success party!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#7c3bed', '#06b6d4', '#10b981']
        });

        setSuccessMsg(`Successfully purchased ${selectedDenom.name} for Player ID: ${playerId}! Your order is processing.`);
        fetchProfile(); // Refresh balance
        setPlayerId('');
        setServerId('');
        setSelectedDenom(null);
      } else {
        setError(data.error || 'Failed to complete purchase.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  // RENDER DETAILED ORDER PANEL
  if (selectedGame) {
    return (
      <div className="glass-panel" style={{ padding: '24px', maxWidth: '700px', margin: '0 auto' }}>
        {/* Back Button */}
        <button className="btn-secondary" onClick={() => handleSelectGame(null)} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} />
          <span>Back to Store</span>
        </button>

        {/* Game Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px' }}>{selectedGame.icon}</div>
          <div>
            <h2 style={{ fontSize: '22px' }}>{selectedGame.name} Top-Up</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Fast and automated instant delivery by Garena/Tencent/Riot partner API</p>
          </div>
        </div>

        {/* Error/Success Messages */}
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

        <form onSubmit={handlePurchase}>
          {/* Player ID Details */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedGame.needsServer ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="form-group">
              <label><User size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Player ID / UID</label>
              <input 
                type="text" 
                className="input-style" 
                placeholder="Enter Game Player ID" 
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                required
              />
            </div>

            {selectedGame.needsServer && (
              <div className="form-group">
                <label><Landmark size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Server ID</label>
                <input 
                  type="text" 
                  className="input-style" 
                  placeholder="e.g. Asia / 2014" 
                  value={serverId}
                  onChange={(e) => setServerId(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Select Package Denominations */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label><Gamepad2 size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Select Diamond/Credits Denomination</label>
            <div className="denom-grid">
              {selectedGame.denoms.map((denom) => (
                <div 
                  key={denom.id} 
                  className={`denom-card ${selectedDenom?.id === denom.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDenom(denom)}
                >
                  <div className="denom-val">{denom.name}</div>
                  <div className="denom-price">${denom.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Summary & Actions */}
          {selectedDenom && (
            <div className="price-summary-panel">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Payment Total:</div>
                <div className="price-summary-val">${selectedDenom.price.toFixed(2)}</div>
              </div>
              <button type="submit" className="glow-btn" disabled={ordering}>
                <ShoppingBag size={18} />
                <span>{ordering ? 'Processing Purchase...' : 'Purchase Credits Now'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  // RENDER GRID VIEW STORE
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h3 className="section-title">Select a Game to Top-Up</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enjoy instant automated credits delivery straight to your player account using player UID method.</p>
      </div>

      <div className="store-grid">
        {GAMES.map((game) => (
          <div key={game.id} className="glass-panel game-card" onClick={() => handleSelectGame(game)}>
            <div className="game-icon-box">{game.icon}</div>
            <div className="game-title">{game.name}</div>
            <div className="game-tag">{game.tag}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GamingTopUpView;
