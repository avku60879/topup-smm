import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true },
  otp: { type: String, required: true },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 300 // Document automatically deleted after 5 minutes (TTL index)
  }
});

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
export default Otp;
