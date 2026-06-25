import React from 'react';
import { 
  LayoutGrid, 
  Gamepad2, 
  Globe, 
  Wallet, 
  Users, 
  Headphones, 
  History, 
  LogOut 
} from 'lucide-react';

function Sidebar({ currentView, setCurrentView, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'gaming', label: 'Gaming Top-Up', icon: Gamepad2 },
    { id: 'smm', label: 'SMM Store', icon: Globe },
    { id: 'wallet', label: 'Wallet & Deposit', icon: Wallet },
    { id: 'affiliate', label: 'Affiliate Portal', icon: Users },
    { id: 'support', label: 'Support Center', icon: Headphones },
    { id: 'orders', label: 'Order History', icon: History },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-logo">
        <span style={{ fontSize: '24px' }}>🎮</span>
        <span className="gradient-text" style={{ fontWeight: 800 }}>TopBoost Pro</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={onLogout} style={{ width: '100%' }}>
          <LogOut size={20} style={{ color: 'var(--color-danger)' }} />
          <span style={{ color: 'var(--color-danger)' }}>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
