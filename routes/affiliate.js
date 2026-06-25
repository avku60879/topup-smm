import express from 'express';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// GET REFERRAL STATS
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const mockDb = req.app.locals.mockDb;
    const currentUsername = req.userDetails.username;

    if (req.app.locals.isDbConnected) {
      // Find all users referred by current user
      const referrals = await User.find({ referredBy: currentUsername }).select('username createdAt balance');
      
      // Calculate total commission transactions
      const commissions = await Transaction.find({
        userId: req.userDetails._id,
        type: 'referral_bonus'
      }).sort({ createdAt: -1 });

      const totalClicks = referrals.length * 2 + 5; // Simulated click traffic for realistic UI

      res.json({
        clicks: totalClicks,
        signups: referrals.length,
        earnings: req.userDetails.affiliateEarnings,
        referralsList: referrals.map(ref => ({
          username: ref.username,
          joinedAt: ref.createdAt,
          status: 'Active'
        })),
        commissionsList: commissions
      });
    } else {
      const referrals = mockDb.users.filter(u => u.referredBy === currentUsername);
      const commissions = mockDb.transactions.filter(
        t => t.userId === req.userDetails.id && t.type === 'referral_bonus'
      );
      const totalClicks = referrals.length * 2 + 5;

      res.json({
        clicks: totalClicks,
        signups: referrals.length,
        earnings: req.userDetails.affiliateEarnings,
        referralsList: referrals.map(ref => ({
          username: ref.username,
          joinedAt: ref.createdAt,
          status: 'Active'
        })),
        commissionsList: commissions
      });
    }
  } catch (error) {
    console.error('Affiliate Stats Error:', error);
    res.status(500).json({ error: 'Failed to retrieve affiliate stats.' });
  }
});

// CLAIM REFERRAL EARNINGS (Transfer affiliate commission into main wallet balance)
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const mockDb = req.app.locals.mockDb;
    const earnings = req.userDetails.affiliateEarnings;

    if (earnings <= 0) {
      return res.status(400).json({ error: 'You have no affiliate earnings to withdraw.' });
    }

    if (req.app.locals.isDbConnected) {
      // Transfer earnings to wallet balance
      await User.findByIdAndUpdate(req.userDetails._id, {
        $inc: { balance: earnings },
        $set: { affiliateEarnings: 0.0 }
      });

      // Log transaction
      const tx = new Transaction({
        userId: req.userDetails._id,
        username: req.userDetails.username,
        type: 'withdrawal',
        method: 'Affiliate Payout Transfer',
        amount: earnings,
        status: 'Completed',
        trxId: 'TX_AFF_WD_' + Date.now()
      });
      await tx.save();

      res.json({ message: `Transferred $${earnings.toFixed(2)} from affiliate earnings to your wallet balance.` });
    } else {
      const user = mockDb.users.find(u => u.id === req.userDetails.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      user.balance += earnings;
      user.affiliateEarnings = 0.0;

      const mockTx = {
        id: 'mock_tx_' + Date.now(),
        userId: user.id,
        username: user.username,
        type: 'withdrawal',
        method: 'Affiliate Payout Transfer',
        amount: earnings,
        status: 'Completed',
        trxId: 'TX_AFF_WD_' + Date.now(),
        createdAt: new Date()
      };
      mockDb.transactions.push(mockTx);

      res.json({ message: `Transferred $${earnings.toFixed(2)} from affiliate earnings to your wallet balance.` });
    }
  } catch (error) {
    console.error('Affiliate Withdrawal Error:', error);
    res.status(500).json({ error: 'Failed to process affiliate transfer.' });
  }
});

export default router;
