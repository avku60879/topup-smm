import express from 'express';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// GET USER ORDERS
router.get('/history', authenticateToken, async (req, res) => {
  try {
    if (req.app.locals.isDbConnected) {
      const orders = await Order.find({ userId: req.userDetails._id }).sort({ createdAt: -1 });
      res.json(orders);
    } else {
      const mockDb = req.app.locals.mockDb;
      const userOrders = mockDb.orders
        .filter(o => o.userId === req.userDetails.id)
        .sort((a, b) => b.createdAt - a.createdAt);
      res.json(userOrders);
    }
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// PLACE AN ORDER (Gaming Top-Up or SMM)
router.post('/create', authenticateToken, async (req, res) => {
  const { type, category, service, target, details, quantity, price } = req.body;

  if (!type || !category || !service || !target || !price) {
    return res.status(400).json({ error: 'Missing required order details.' });
  }

  const orderPrice = parseFloat(price);
  const orderQty = parseInt(quantity) || 1;

  // Verify wallet balance
  if (req.userDetails.balance < orderPrice) {
    return res.status(400).json({ error: 'Insufficient wallet balance. Please deposit funds first.' });
  }

  try {
    const mockDb = req.app.locals.mockDb;
    let externalOrderId = 'api_mock_' + Math.floor(100000 + Math.random() * 900000);

    // --------------------------------------------------------
    // PRODUCTION INTEGRATION POINT: FORWARDING TO EXTERNAL SUPPLIER APIs
    // --------------------------------------------------------
    if (type === 'smm' && process.env.SMM_API_KEY && process.env.SMM_API_KEY !== 'your_smm_panel_api_key_here') {
      try {
        console.log(`[Supplier SMM API] Forwarding order to SMM reseller panel...`);
        // Example standard SMM Reseller API Call:
        const response = await fetch(process.env.SMM_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: process.env.SMM_API_KEY,
            action: 'add',
            service: service.split(' - ')[0], // Extracts ID (e.g., "1024" from "1024 - Real Followers")
            link: target,
            quantity: orderQty
          })
        });
        const apiData = await response.json();
        if (apiData && apiData.order) {
          externalOrderId = apiData.order;
          console.log(`[Supplier SMM API] Success! SMM Order ID: ${externalOrderId}`);
        } else if (apiData && apiData.error) {
          console.error(`[Supplier SMM API] Error returned: ${apiData.error}`);
        }
      } catch (apiErr) {
        console.error('[Supplier SMM API Exception]:', apiErr.message);
      }
    } else if (type === 'gaming' && process.env.GAMING_API_KEY && process.env.GAMING_API_KEY !== 'your_gaming_distributor_api_key_here') {
      console.log(`[Supplier Gaming API] Forwarding top-up request to SEAGM/UniPin APIs for player ${target}...`);
      // Simulating distributor payload and API call here. Merchant integrations usually require signature/MD5 hashing.
    }

    // --------------------------------------------------------
    // DATABASE AND WALLET TRANSACTIONS PROCESSING
    // --------------------------------------------------------
    let newOrder;
    const commissionRate = 0.05; // 5% affiliate commission
    const commissionAmt = parseFloat((orderPrice * commissionRate).toFixed(2));

    if (req.app.locals.isDbConnected) {
      // 1. Deduct wallet balance
      await User.findByIdAndUpdate(req.userDetails._id, { $inc: { balance: -orderPrice } });

      // 2. Create Order record
      newOrder = new Order({
        userId: req.userDetails._id,
        username: req.userDetails.username,
        type,
        category,
        service,
        target,
        details,
        quantity: orderQty,
        price: orderPrice,
        status: 'Processing', // Placed with supplier, now in progress
        externalOrderId
      });
      await newOrder.save();

      // 3. Create Transaction log
      const tx = new Transaction({
        userId: req.userDetails._id,
        username: req.userDetails.username,
        type: 'purchase',
        method: 'Wallet Deduct',
        amount: orderPrice,
        status: 'Completed',
        trxId: 'TX_ORD_' + newOrder._id
      });
      await tx.save();

      // 4. Handle Affiliate Commission Payout (if referred by someone)
      if (req.userDetails.referredBy && commissionAmt > 0) {
        const referrer = await User.findOne({ username: req.userDetails.referredBy });
        if (referrer) {
          referrer.balance += commissionAmt;
          referrer.affiliateEarnings += commissionAmt;
          await referrer.save();

          // Create transaction for referrer
          const refTx = new Transaction({
            userId: referrer._id,
            username: referrer.username,
            type: 'referral_bonus',
            method: 'Affiliate Payout',
            amount: commissionAmt,
            status: 'Completed',
            trxId: 'TX_REF_' + newOrder._id
          });
          await refTx.save();
        }
      }
    } else {
      // Mock Mode
      const user = mockDb.users.find(u => u.id === req.userDetails.id);
      if (user) user.balance -= orderPrice;

      newOrder = {
        id: 'mock_ord_' + Date.now(),
        userId: req.userDetails.id,
        username: req.userDetails.username,
        type,
        category,
        service,
        target,
        details,
        quantity: orderQty,
        price: orderPrice,
        status: 'Processing',
        externalOrderId,
        createdAt: new Date()
      };
      mockDb.orders.push(newOrder);

      const mockTx = {
        id: 'mock_tx_' + Date.now(),
        userId: req.userDetails.id,
        username: req.userDetails.username,
        type: 'purchase',
        method: 'Wallet Deduct',
        amount: orderPrice,
        status: 'Completed',
        trxId: 'TX_ORD_' + newOrder.id,
        createdAt: new Date()
      };
      mockDb.transactions.push(mockTx);

      // Handle Affiliate Commission
      if (user && user.referredBy && commissionAmt > 0) {
        const referrer = mockDb.users.find(u => u.username === user.referredBy);
        if (referrer) {
          referrer.balance += commissionAmt;
          referrer.affiliateEarnings += commissionAmt;

          const mockRefTx = {
            id: 'mock_tx_' + Date.now() + '_ref',
            userId: referrer.id,
            username: referrer.username,
            type: 'referral_bonus',
            method: 'Affiliate Payout',
            amount: commissionAmt,
            status: 'Completed',
            trxId: 'TX_REF_' + newOrder.id,
            createdAt: new Date()
          };
          mockDb.transactions.push(mockRefTx);
        }
      }
    }

    // Trigger auto-completion simulator (SMM/Gaming order updates to "Completed" after 15 seconds)
    setTimeout(async () => {
      console.log(`[Order Update Worker] Simulating supplier completion for order: ${externalOrderId}`);
      if (req.app.locals.isDbConnected) {
        await Order.findOneAndUpdate({ externalOrderId }, { status: 'Completed' });
      } else {
        const foundOrd = mockDb.orders.find(o => o.externalOrderId === externalOrderId);
        if (foundOrd) foundOrd.status = 'Completed';
      }
    }, 15000);

    res.status(201).json({
      message: 'Order placed successfully and is now processing.',
      order: newOrder
    });

  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Failed to process order.' });
  }
});

export default router;
