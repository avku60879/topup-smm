import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'purchase', 'referral_bonus', 'withdrawal'], required: true },
  method: { type: String, required: true }, // e.g. "bKash", "Nagad", "Crypto", "Wallet Deduct"
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Failed'], 
    default: 'Pending' 
  },
  trxId: { type: String, required: true, unique: true }, // Transaction reference ID
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export default Transaction;
