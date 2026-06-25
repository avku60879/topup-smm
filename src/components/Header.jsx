import React from 'react';
import { Sun, Moon, Bell, Wallet, RefreshCw } from 'lucide-react';

function Header({ user, currentView, isDarkTheme, toggleTheme, setCurrentView, fetchProfile }) {
  const viewTitles = {
    dashboard: 'Account Overview',
    gaming: 'Gaming Top-Up Store',
    smm: 'SMM Service Store',
    wallet: 'Wallet & Deposits',
    affiliate: 'Affiliate Program',
    support: 'Support Center',
    orders: 'Your Order History'
  };

  const formatUsername = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <header className="header">
      <div className="header-title">
        <h2>{viewTitles[currentView] || 'Dashboard'}</h2>
      </div>

      <div className="header-actions">
        {/* Wallet Balance Badge */}
        <div className="wallet-badge cursor-pointer" onClick={() => setCurrentView('wallet')}>
          <Wallet size={18} />
          <span>${user.balance.toFixed(2)}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              fetchProfile();
            }} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '4px'
            }}
            title="Refresh balance"
          >
            <RefreshCw size={12} className="hover:rotate-180" style={{ transition: 'transform 0.5s' }} />
          </button>
        </div>

        {/* Theme Toggle */}
        <button className="action-icon-btn" onClick={toggleTheme} title="Toggle theme">
          {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button className="action-icon-btn" title="Notifications">
          <Bell size={20} />
          <span className="badge-dot"></span>
        </button>

        {/* User Profile avatar info */}
        <div className="user-dropdown-btn" onClick={() => setCurrentView('dashboard')}>
          <div className="user-avatar">
            {formatUsername(user.username)}
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>{user.username}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
