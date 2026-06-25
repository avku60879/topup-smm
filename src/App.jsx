import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import GamingTopUpView from './views/GamingTopUpView';
import SMMStoreView from './views/SMMStoreView';
import WalletView from './views/WalletView';
import AffiliateView from './views/AffiliateView';
import SupportView from './views/SupportView';
import OrdersView from './views/OrdersView';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // login or register
  
  // OTP verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authHint, setAuthHint] = useState('');

  // Auth Inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Sync token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  // Handle URL query parameters for affiliate signups
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefCode(ref);
      setAuthMode('register');
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
      } else {
        setToken('');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setToken('');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Handle registration submit (sends OTP) or Login
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthHint('');

    if (authMode === 'login') {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok && data.token) {
          setToken(data.token);
          setUser(data.user);
          setUsername('');
          setPassword('');
        } else {
          setAuthError(data.error || 'Authentication failed.');
        }
      } catch (err) {
        setAuthError('Unable to connect to the server.');
      }
    } else {
      // Register Mode (Step 1: Request OTP)
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();

        if (response.ok) {
          setOtpSent(true);
          setAuthSuccess(data.message);
          if (data.hint) setAuthHint(data.hint);
        } else {
          setAuthError(data.error || 'Registration failed.');
        }
      } catch (err) {
        setAuthError('Unable to connect to the server.');
      }
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          otp: otpCode,
          refCode
        })
      });
      const data = await response.json();

      if (response.ok && data.token) {
        // Celebrate!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#7c3bed', '#10b981']
        });

        setToken(data.token);
        setUser(data.user);
        
        // Reset states
        setUsername('');
        setEmail('');
        setPassword('');
        setOtpCode('');
        setOtpSent(false);
        setAuthHint('');
      } else {
        setAuthError(data.error || 'OTP verification failed.');
      }
    } catch (err) {
      setAuthError('Verification request failed.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setCurrentView('dashboard');
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  if (loading) {
    return (
      <div className="landing-container">
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', letterSpacing: '0.05em' }} className="gradient-text animate-pulse">
          LOADING TOPBOOST PRO...
        </div>
      </div>
    );
  }

  // RENDER LANDING / AUTHENTICATION PAGE
  if (!user) {
    return (
      <div className={`landing-container ${isDarkTheme ? '' : 'light-theme'}`}>
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <div className="auth-logo">🎮</div>
            <h1 className="auth-title gradient-text">TopBoost Pro</h1>
            <p className="auth-subtitle">Gaming Credits & SMM Marketplace</p>
          </div>

          {authError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--color-danger)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {authError}
            </div>
          )}

          {authSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-success)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {authSuccess}
            </div>
          )}

          {/* Interactive Hint Panel for Mockup Mode */}
          {authHint && (
            <div style={{
              background: 'rgba(6, 182, 212, 0.05)',
              color: 'var(--color-secondary)',
              border: '1px dashed var(--color-secondary)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              lineHeight: '1.5',
              textAlign: 'center'
            }}>
              💡 <strong>Developer Mode</strong>: {authHint}
            </div>
          )}

          {/* Render OTP Verification Step */}
          {otpSent ? (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group" style={{ textAlign: 'center' }}>
                <label style={{ fontSize: '15px' }}>Enter 6-Digit Verification Code</label>
                <input 
                  type="text" 
                  className="input-style" 
                  placeholder="e.g. 123456" 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  required 
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '24px', 
                    letterSpacing: '8px', 
                    fontFamily: 'monospace',
                    marginTop: '8px',
                    borderColor: 'var(--color-secondary)'
                  }}
                />
              </div>

              <button type="submit" className="glow-btn" style={{ width: '100%', marginTop: '16px' }}>
                Verify & Register Now
              </button>

              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { setOtpSent(false); setAuthSuccess(''); setAuthHint(''); }}
                style={{ width: '100%', marginTop: '10px' }}
              >
                Back to Register
              </button>
            </form>
          ) : (
            // Render standard Login / Register Form
            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  className="input-style" 
                  placeholder="Enter your username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                />
              </div>

              {authMode === 'register' && (
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="input-style" 
                    placeholder="Enter your email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              )}

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="input-style" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>

              {authMode === 'register' && (
                <div className="form-group">
                  <label>Referral Code (Optional)</label>
                  <input 
                    type="text" 
                    className="input-style" 
                    placeholder="e.g. jason420" 
                    value={refCode} 
                    onChange={(e) => setRefCode(e.target.value)} 
                  />
                </div>
              )}

              <button type="submit" className="glow-btn" style={{ width: '100%', marginTop: '12px' }}>
                {authMode === 'login' ? 'Sign In' : 'Send Verification OTP'}
              </button>
            </form>
          )}

          {!otpSent && (
            <div className="auth-toggle">
              {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button 
                className="auth-toggle-btn" 
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
              >
                {authMode === 'login' ? 'Register' : 'Login'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER MAIN APPLICATION DASHBOARD
  return (
    <div className={`app-container ${isDarkTheme ? '' : 'light-theme'}`}>
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onLogout={handleLogout} 
      />
      
      <main className="main-content">
        <Header 
          user={user} 
          currentView={currentView} 
          isDarkTheme={isDarkTheme} 
          toggleTheme={toggleTheme} 
          setCurrentView={setCurrentView}
          fetchProfile={fetchProfile}
        />

        {currentView === 'dashboard' && (
          <DashboardView user={user} setCurrentView={setCurrentView} token={token} />
        )}
        {currentView === 'gaming' && (
          <GamingTopUpView user={user} fetchProfile={fetchProfile} token={token} />
        )}
        {currentView === 'smm' && (
          <SMMStoreView user={user} fetchProfile={fetchProfile} token={token} />
        )}
        {currentView === 'wallet' && (
          <WalletView user={user} fetchProfile={fetchProfile} token={token} />
        )}
        {currentView === 'affiliate' && (
          <AffiliateView user={user} token={token} />
        )}
        {currentView === 'support' && (
          <SupportView user={user} token={token} />
        )}
        {currentView === 'orders' && (
          <OrdersView token={token} />
        )}
      </main>
    </div>
  );
}

export default App;
