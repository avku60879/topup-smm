import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  type: { type: String, enum: ['gaming', 'smm'], required: true },
  category: { type: String, required: true }, // e.g. "PUBG Mobile", "Instagram"
  service: { type: String, required: true },  // e.g. "60 UC", "Real Followers"
  target: { type: String, required: true },   // Player ID or Social Media Link
  details: { type: String, default: '' },      // Optional Server ID or special instructions
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  externalOrderId: { type: String, default: null }, // ID returned by downstream API supplier
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
