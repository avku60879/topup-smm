import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/topboost');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`Database Connection Warning: ${error.message}`);
    console.warn('The server will run using resilient mockup memory storage. Ensure MongoDB is running for persistent live data.');
    return false;
  }
};

export default connectDB;
