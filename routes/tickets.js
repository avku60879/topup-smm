import express from 'express';
import { authenticateToken } from './auth.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// GET ALL USER TICKETS
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.app.locals.isDbConnected) {
      const tickets = await Ticket.find({ userId: req.userDetails._id }).sort({ createdAt: -1 });
      res.json(tickets);
    } else {
      const mockDb = req.app.locals.mockDb;
      const userTickets = mockDb.tickets.filter(t => t.userId === req.userDetails.id);
      res.json(userTickets);
    }
  } catch (error) {
    console.error('Fetch Tickets Error:', error);
    res.status(500).json({ error: 'Failed to retrieve tickets.' });
  }
});

// CREATE NEW SUPPORT TICKET
router.post('/create', authenticateToken, async (req, res) => {
  const { subject, priority, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  try {
    const mockDb = req.app.locals.mockDb;
    const ticketId = 'TKT_' + Math.floor(100000 + Math.random() * 900000);

    let newTicket;

    if (req.app.locals.isDbConnected) {
      newTicket = new Ticket({
        userId: req.userDetails._id,
        username: req.userDetails.username,
        subject,
        priority: priority || 'Medium',
        messages: [{ sender: 'user', message }]
      });
      await newTicket.save();
    } else {
      newTicket = {
        _id: 'mock_tkt_' + Date.now(),
        userId: req.userDetails.id,
        username: req.userDetails.username,
        subject,
        priority: priority || 'Medium',
        status: 'Open',
        messages: [{ sender: 'user', message, createdAt: new Date() }],
        createdAt: new Date()
      };
      mockDb.tickets.push(newTicket);
    }

    // Trigger mock admin reply after 6 seconds
    setTimeout(async () => {
      const replies = [
        "Hello! Thanks for reaching out. We are currently verifying your transaction. It should be completed in a few minutes.",
        "Hi there! We have forwarded this issue to our technical support team. We'll update you shortly.",
        "Hello, your top-up has been successfully verified on our side. Please restart your game to check your balance.",
        "Greetings! We are processing SMM orders at high speed. If there's any delay, it usually completes within an hour."
      ];
      const adminReply = replies[Math.floor(Math.random() * replies.length)];

      if (req.app.locals.isDbConnected) {
        await Ticket.findByIdAndUpdate(newTicket._id, {
          status: 'Replied',
          $push: { messages: { sender: 'admin', message: adminReply } }
        });
      } else {
        const tkt = mockDb.tickets.find(t => t._id === newTicket._id);
        if (tkt) {
          tkt.status = 'Replied';
          tkt.messages.push({
            sender: 'admin',
            message: adminReply,
            createdAt: new Date()
          });
        }
      }
      console.log(`[Support Bot] Replied to ticket: ${newTicket.subject}`);
    }, 6000);

    res.status(201).json({
      message: 'Support ticket created successfully.',
      ticket: newTicket
    });

  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({ error: 'Failed to open support ticket.' });
  }
});

// REPLY TO TICKET
router.post('/:id/reply', authenticateToken, async (req, res) => {
  const { message } = req.body;
  const ticketId = req.params.id;

  if (!message) {
    return res.status(400).json({ error: 'Reply message cannot be empty.' });
  }

  try {
    const mockDb = req.app.locals.mockDb;

    if (req.app.locals.isDbConnected) {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

      ticket.messages.push({ sender: 'user', message });
      ticket.status = 'Open';
      await ticket.save();

      res.json(ticket);
    } else {
      const ticket = mockDb.tickets.find(t => t._id === ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

      ticket.messages.push({ sender: 'user', message, createdAt: new Date() });
      ticket.status = 'Open';

      res.json(ticket);
    }

    // Auto admin reply after 5 seconds to user message
    setTimeout(async () => {
      const followUps = [
        "Understood. We are looking into this details right now.",
        "Thank you for the update. Our team is solving this immediately.",
        "Got it! We have processed the correction. Please check and let us know if it works."
      ];
      const adminFollowUp = followUps[Math.floor(Math.random() * followUps.length)];

      if (req.app.locals.isDbConnected) {
        await Ticket.findByIdAndUpdate(ticketId, {
          status: 'Replied',
          $push: { messages: { sender: 'admin', message: adminFollowUp } }
        });
      } else {
        const tkt = mockDb.tickets.find(t => t._id === ticketId);
        if (tkt) {
          tkt.status = 'Replied';
          tkt.messages.push({
            sender: 'admin',
            message: adminFollowUp,
            createdAt: new Date()
          });
        }
      }
    }, 5000);

  } catch (error) {
    console.error('Reply Ticket Error:', error);
    res.status(500).json({ error: 'Failed to submit reply.' });
  }
});

export default router;
