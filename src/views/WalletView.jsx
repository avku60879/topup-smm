import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, Landmark, Coins, PlusCircle, Calendar } from 'lucide-react';

function WalletView({ user, fetchProfile, token }) {
  const [depositMethod, setDepositMethod] = useState('bkash'); // bkash, card, crypto
  const [amount, setAmount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/wallet/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return setError('Please enter a valid deposit amount.');
    }

    let finalTrxId = trxId;
    if (depositMethod === 'card' || depositMethod === 'crypto') {
      // Auto-generate transaction ID for automatic gateway simulation
      finalTrxId = 'AUT_' + depositMethod.toUpperCase() + '_' + Math.floor(100000 + Math.random() * 900000);
    } else if (!trxId) {
      return setError('Transaction reference ID is required for local mobile banking deposits.');
    }

    setLoading(true);
    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numericAmount,
          method: depositMethod.toUpperCase(),
          trxId: finalTrxId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(`Deposit successful! $${numericAmount.toFixed(2)} has been added to your wallet.`);
        setAmount('');
        setTrxId('');
        fetchProfile(); // Update balance
        fetchHistory(); // Refresh table
      } else {
        setError(data.error || 'Failed to process deposit.');
      }
    } catch (err) {
      setError('Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Wallet Balance Card */}
      <div className="glass-panel" style={{
        padding: '32px',
        background: 'linear-gradient(135deg, var(--color-primary), #9333ea)',
        boxShadow: '0 8px 32px var(--color-primary-glow)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wallet size={32} />
          </div>
          <div>
            <span style={{ fontSize: '14px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Wallet Balance</span>
            <h1 style={{ fontSize: '36px', fontFamily: 'var(--font-heading)', fontWeight: 700, marginTop: '4px' }}>${user.balance.toFixed(2)}</h1>
          </div>
        </div>
        <div style={{ fontSize: '13px', background: 'rgba(255, 255, 255, 0.15)', padding: '8px 16px', borderRadius: '20px', fontWeight: 500 }}>
          ⚡ Payments Verified Instantly
        </div>
      </div>

      {/* Main Grid: Deposit Form & Transactions list */}
      <div className="dashboard-layout">
        {/* Deposit Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="section-title">Add Funds to Wallet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            Choose your preferred deposit method. Automatic deposits are credited instantly. Manual payments require transaction verification.
          </p>

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

          {/* Deposit Method Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <button
              type="button"
              className={`btn-secondary ${depositMethod === 'bkash' ? 'active' : ''}`}
              onClick={() => { setDepositMethod('bkash'); setError(''); setSuccessMsg(''); }}
              style={{ padding: '12px 8px', borderRadius: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <Landmark size={18} />
              <span>bKash / Nagad</span>
            </button>
            <button
              type="button"
              className={`btn-secondary ${depositMethod === 'card' ? 'active' : ''}`}
              onClick={() => { setDepositMethod('card'); setError(''); setSuccessMsg(''); }}
              style={{ padding: '12px 8px', borderRadius: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <CreditCard size={18} />
              <span>Credit Card</span>
            </button>
            <button
              type="button"
              className={`btn-secondary ${depositMethod === 'crypto' ? 'active' : ''}`}
              onClick={() => { setDepositMethod('crypto'); setError(''); setSuccessMsg(''); }}
              style={{ padding: '12px 8px', borderRadius: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <Coins size={18} />
              <span>Cryptocurrency</span>
            </button>
          </div>

          <form onSubmit={handleDeposit}>
            <div className="form-group">
              <label>Enter Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                className="input-style"
                placeholder="e.g. 50.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Instruction Panel for Local Mobile Banking */}
            {depositMethod === 'bkash' && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '13px',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Instructions:</span>
                <ol style={{ paddingLeft: '16px', marginTop: '4px' }}>
                  <li>Send money (Cash Out/Send Money) to personal number: <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>+880 1789-123456</span></li>
                  <li>Copy the 10-character Transaction ID (TrxID) from your SMS.</li>
                  <li>Paste the TrxID in the field below and click submit to credit your wallet instantly.</li>
                </ol>
              </div>
            )}

            {/* Manual TrxID Input (Only for mobile banking) */}
            {depositMethod === 'bkash' && (
              <div className="form-group">
                <label>Transaction ID (TrxID)</label>
                <input
                  type="text"
                  className="input-style"
                  placeholder="e.g. 8K42JH89LA"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Simulated credit card or crypto instructions */}
            {(depositMethod === 'card' || depositMethod === 'crypto') && (
              <div style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px dashed var(--color-secondary)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '13px',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                ℹ️ **Automated Payment Integration**: Clicking submit will simulate a successful payment gateway callback and instantly credit your wallet balance without leaving the dashboard.
              </div>
            )}

            <button type="submit" className="glow-btn" disabled={loading} style={{ width: '100%' }}>
              <PlusCircle size={18} />
              <span>{loading ? 'Verifying payment...' : 'Submit Deposit'}</span>
            </button>
          </form>
        </div>

        {/* Ledger Transaction History List */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="section-title">Wallet Ledger</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Detailed record of deposits and purchases.</p>
          
          <div className="table-container" style={{ flex: 1 }}>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No transactions recorded yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => (
                    <tr key={tx.id || tx._id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: tx.type === 'deposit' || tx.type === 'referral_bonus' ? 'var(--color-success)' : 'inherit' }}>
                          {tx.type === 'deposit' ? 'Deposit' : tx.type === 'purchase' ? 'Purchase' : tx.type === 'referral_bonus' ? 'Affiliate' : 'Transfer'}
                        </span>
                      </td>
                      <td>{tx.method}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {tx.type === 'deposit' || tx.type === 'referral_bonus' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-completed">{tx.status}</span>
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

export default WalletView;
