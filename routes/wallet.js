import express from 'express';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// GET TRANSACTION HISTORY
router.get('/history', authenticateToken, async (req, res) => {
  try {
    if (req.app.locals.isDbConnected) {
      const history = await Transaction.find({ userId: req.userDetails._id }).sort({ createdAt: -1 });
      res.json(history);
    } else {
      const mockDb = req.app.locals.mockDb;
      const userHistory = mockDb.transactions
        .filter(t => t.userId === req.userDetails.id)
        .sort((a, b) => b.createdAt - a.createdAt);
      res.json(userHistory);
    }
  } catch (error) {
    console.error('Wallet History Error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history.' });
  }
});

// INITIATE DEPOSIT (Manual or Automated Intent)
router.post('/deposit', authenticateToken, async (req, res) => {
  const { amount, method, trxId } = req.body;

  if (!amount || !method || !trxId) {
    return res.status(400).json({ error: 'Please provide amount, method, and transaction reference ID.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount.' });
  }

  try {
    const mockDb = req.app.locals.mockDb;

    // Check duplicate transaction ID
    if (req.app.locals.isDbConnected) {
      const exists = await Transaction.findOne({ trxId });
      if (exists) return res.status(400).json({ error: 'This transaction ID has already been submitted.' });

      // Create a transaction record
      const tx = new Transaction({
        userId: req.userDetails._id,
        username: req.userDetails.username,
        type: 'deposit',
        method,
        amount: numericAmount,
        status: 'Completed', // Auto-completed for demonstration/instant-live testing!
        trxId
      });

      await tx.save();

      // Credit user wallet
      await User.findByIdAndUpdate(req.userDetails._id, { $inc: { balance: numericAmount } });
      res.status(201).json({ message: 'Deposit successful and wallet credited.', transaction: tx });
    } else {
      const exists = mockDb.transactions.some(t => t.trxId === trxId);
      if (exists) return res.status(400).json({ error: 'This transaction ID has already been submitted.' });

      const mockTx = {
        id: 'mock_tx_' + Date.now(),
        userId: req.userDetails.id,
        username: req.userDetails.username,
        type: 'deposit',
        method,
        amount: numericAmount,
        status: 'Completed', // Auto-credited
        trxId,
        createdAt: new Date()
      };

      mockDb.transactions.push(mockTx);
      
      // Update local memory user
      const user = mockDb.users.find(u => u.id === req.userDetails.id);
      if (user) user.balance += numericAmount;

      res.status(201).json({ message: 'Deposit successful and wallet credited.', transaction: mockTx });
    }
  } catch (error) {
    console.error('Deposit Error:', error);
    res.status(500).json({ error: 'Failed to process deposit.' });
  }
});

// SIMULATE PAYMENT GATEWAY WEBHOOK (For production integrations)
router.post('/webhook/payment', async (req, res) => {
  const { payment_status, amount, user_id, transaction_ref, secret_hash } = req.body;

  // In production, verify the webhook signature or secret
  console.log(`[Webhook Received] Status: ${payment_status}, Ref: ${transaction_ref}, Amt: ${amount}`);

  if (payment_status !== 'success') {
    return res.status(200).send('Ignored non-success payment state');
  }

  try {
    const numericAmount = parseFloat(amount);
    const mockDb = req.app.locals.mockDb;

    if (req.app.locals.isDbConnected) {
      // Find user
      const user = await User.findById(user_id);
      if (!user) return res.status(404).send('User not found');

      // Prevent duplicate processing
      const txExists = await Transaction.findOne({ trxId: transaction_ref });
      if (txExists) return res.status(200).send('Already processed');

      const tx = new Transaction({
        userId: user._id,
        username: user.username,
        type: 'deposit',
        method: 'Automatic Gateway',
        amount: numericAmount,
        status: 'Completed',
        trxId: transaction_ref
      });
      await tx.save();

      user.balance += numericAmount;
      await user.save();

      res.status(200).send('OK');
    } else {
      const user = mockDb.users.find(u => u.id === user_id);
      if (!user) return res.status(404).send('User not found');

      const txExists = mockDb.transactions.some(t => t.trxId === transaction_ref);
      if (txExists) return res.status(200).send('Already processed');

      const mockTx = {
        id: 'mock_tx_' + Date.now(),
        userId: user.id,
        username: user.username,
        type: 'deposit',
        method: 'Automatic Gateway',
        amount: numericAmount,
        status: 'Completed',
        trxId: transaction_ref,
        createdAt: new Date()
      };
      mockDb.transactions.push(mockTx);
      user.balance += numericAmount;

      res.status(200).send('OK');
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Error');
  }
});

export default router;
