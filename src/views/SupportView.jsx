import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Send, Plus, Calendar, AlertCircle, MessageSquare } from 'lucide-react';

function SupportView({ user, token }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  
  // New Ticket Form Inputs
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [message, setMessage] = useState('');
  
  // Chat input
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  // Periodic polling (every 4 seconds) when a ticket is selected to capture the automated admin reply!
  useEffect(() => {
    let interval;
    if (selectedTicket) {
      interval = setInterval(() => {
        refreshSelectedTicket(selectedTicket._id || selectedTicket.id);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  const refreshSelectedTicket = async (tktId) => {
    try {
      const response = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTickets(data);
        const updated = data.find(t => (t._id || t.id) === tktId);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Failed to sync ticket:', err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setCreatingTicket(true);

    try {
      const response = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, priority, message })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('Support ticket opened successfully. Support staff will reply shortly.');
        setSubject('');
        setMessage('');
        setShowNewForm(false);
        fetchTickets(); // Refresh list
      } else {
        setError(data.error || 'Failed to open ticket.');
      }
    } catch (err) {
      setError('Server connection error.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setError('');
    setSendingReply(true);
    const tktId = selectedTicket._id || selectedTicket.id;

    try {
      const response = await fetch(`/api/tickets/${tktId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: replyText })
      });
      const data = await response.json();

      if (response.ok) {
        setReplyText('');
        refreshSelectedTicket(tktId);
      } else {
        setError(data.error || 'Failed to send reply.');
      }
    } catch (err) {
      setError('Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 className="section-title">Support Ticket Portal</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Have questions about a game top-up or SMM speed? Open a ticket to text our staff.</p>
        </div>
        {!showNewForm && !selectedTicket && (
          <button className="glow-btn" onClick={() => { setShowNewForm(true); setError(''); setSuccessMsg(''); }}>
            <Plus size={18} />
            <span>Open New Ticket</span>
          </button>
        )}
      </div>

      {/* Error/Success Feedback Banners */}
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

      {/* RENDER NEW TICKET FORM */}
      {showNewForm && (
        <div className="glass-panel" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
          <h3 className="section-title" style={{ marginBottom: '20px' }}>Create Support Ticket</h3>
          <form onSubmit={handleCreateTicket}>
            <div className="form-group">
              <label>Subject / Topic</label>
              <input
                type="text"
                className="input-style"
                placeholder="e.g. Diamond Top-Up Delay or Deposit Verification"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Priority Level</label>
              <select
                className="input-style"
                style={{ background: 'rgba(9, 13, 22, 0.9)', cursor: 'pointer' }}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low (General Inquiry)</option>
                <option value="Medium">Medium (Wallet Deposits / Payouts)</option>
                <option value="High">High (Urgent Order Issues)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Message details</label>
              <textarea
                className="input-style"
                rows="5"
                placeholder="Describe your issue or provide transaction IDs here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="glow-btn" style={{ flex: 1 }} disabled={creatingTicket}>
                <span>{creatingTicket ? 'Opening Ticket...' : 'Submit Support Ticket'}</span>
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowNewForm(false)}>
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RENDER CHAT INTERACTIVE COMPONENT AND TICKETS GRID SPLIT */}
      {!showNewForm && (
        <div className="ticket-layout">
          {/* Left Column: Tickets List */}
          <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
            <h4 className="section-title" style={{ fontSize: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>Active Support Cases</h4>
            
            {tickets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No support cases opened.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                {tickets.map((t) => {
                  const tktId = t._id || t.id;
                  const isSelected = selectedTicket && (selectedTicket._id || selectedTicket.id) === tktId;
                  return (
                    <div
                      key={tktId}
                      className="btn-secondary"
                      onClick={() => { setSelectedTicket(t); setError(''); setSuccessMsg(''); }}
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(124, 61, 237, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--panel-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', minWidth: 0, flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {t.subject}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Priority: {t.priority}
                        </span>
                      </div>
                      <span className={`badge ${
                        t.status === 'Replied' ? 'badge-completed' :
                        t.status === 'Open' ? 'badge-processing' : 'badge-failed'
                      }`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {t.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Chat Room Window */}
          <div className="glass-panel">
            {selectedTicket ? (
              <div className="chat-box">
                <div className="chat-header">
                  <div>
                    <h4 style={{ fontSize: '15px' }}>{selectedTicket.subject}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Ticket ID: {selectedTicket._id || selectedTicket.id}
                    </span>
                  </div>
                  <button className="btn-secondary" onClick={() => setSelectedTicket(null)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}>
                    Close Chat
                  </button>
                </div>

                {/* Messages Stream */}
                <div className="chat-messages">
                  {selectedTicket.messages.map((msg, index) => (
                    <div key={index} className={`chat-bubble ${msg.sender}`}>
                      <div>{msg.message}</div>
                      <span className="chat-time">
                        {msg.sender === 'user' ? 'You' : 'Support Team'} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendReply} className="chat-input-area">
                  <input
                    type="text"
                    className="input-style"
                    placeholder="Type your message details..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                    disabled={sendingReply}
                    style={{ borderRadius: '8px', padding: '10px 14px' }}
                  />
                  <button type="submit" className="glow-btn" disabled={sendingReply || !replyText.trim()} style={{ padding: '10px 18px', borderRadius: '8px' }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            ) : (
              <div style={{
                height: '350px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '12px'
              }}>
                <MessageSquare size={48} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>Select a ticket from the left column to open active live chat.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportView;
