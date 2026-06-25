import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Otp from '../models/Otp.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'topboost_super_secret_session_jwt_key';

// Helper to generate referral code
const generateReferralCode = (username) => {
  return username.toLowerCase() + Math.floor(100 + Math.random() * 900);
};

// Resilient JWT Authentication Middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    if (req.app.locals.isDbConnected) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      req.userDetails = user;
    } else {
      const user = req.app.locals.mockDb.users.find(u => u.id === decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      req.userDetails = user;
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Helper: Send OTP Email via Nodemailer (SMTP) with Resilient Console Fallback
const sendOtpEmail = async (email, otp) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Check if SMTP is configured
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort) || 587,
        secure: parseInt(smtpPort) === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });

      const mailOptions = {
        from: `"TopBoost Pro Verification" <${smtpUser}>`,
        to: email,
        subject: 'Your TopBoost Pro Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #090d16; color: #f3f4f6; border-radius: 10px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(124, 61, 237, 0.2);">
            <h2 style="color: #7c3bed; text-align: center; font-family: 'Space Grotesk', sans-serif;">TopBoost Pro</h2>
            <p>Hello,</p>
            <p>Thank you for registering on TopBoost Pro. Please use the following One-Time Password (OTP) to complete your account verification. This code is valid for 5 minutes.</p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #06b6d4; background: rgba(6, 182, 212, 0.1); padding: 10px 20px; border-radius: 8px; border: 1px solid rgba(6, 182, 212, 0.3);">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you did not request this code, please ignore this email.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Sent OTP email to ${email}`);
      return true;
    } catch (error) {
      console.error('[Email Service Error]:', error.message);
    }
  }

  // Console Fallback (for easy mockup testing)
  console.log(`\n=================================================`);
  console.log(`  [MOCK OTP SERVICE] Verification Code for ${email}`);
  console.log(`  YOUR 6-DIGIT OTP IS: ${otp}`);
  console.log(`=================================================\n`);
  return false;
};

// STEP 1: INITIAL REGISTER (Validates details and sends OTP)
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Please enter all required fields.' });
  }

  try {
    const mockDb = req.app.locals.mockDb;

    // Check uniqueness
    if (req.app.locals.isDbConnected) {
      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) return res.status(400).json({ error: 'Username or email already registered.' });
    } else {
      const userExists = mockDb.users.some(u => u.email === email || u.username === username);
      if (userExists) return res.status(400).json({ error: 'Username or email already registered.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP
    if (req.app.locals.isDbConnected) {
      // Delete any previous OTPs for this email
      await Otp.deleteMany({ email });
      const otpRecord = new Otp({ email, otp });
      await otpRecord.save();
    } else {
      // Save to mockDb
      if (!mockDb.otps) mockDb.otps = [];
      // Remove previous
      mockDb.otps = mockDb.otps.filter(o => o.email !== email);
      mockDb.otps.push({
        email,
        otp,
        createdAt: new Date()
      });
    }

    // Send OTP
    const sentRealEmail = await sendOtpEmail(email, otp);

    res.status(200).json({
      message: 'Verification OTP sent successfully.',
      email,
      sentRealEmail,
      // If mock, we tell the user in a message where to find it
      hint: !sentRealEmail ? 'Mock mode: Check your server terminal logs for the 6-digit OTP code.' : null
    });

  } catch (error) {
    console.error('Register OTP Error:', error);
    res.status(500).json({ error: 'Failed to generate verification code.' });
  }
});

// STEP 2: VERIFY OTP & COMPLETE REGISTRATION
router.post('/verify-otp', async (req, res) => {
  const { username, email, password, otp, refCode } = req.body;

  if (!username || !email || !password || !otp) {
    return res.status(400).json({ error: 'Missing registration details or OTP.' });
  }

  try {
    const mockDb = req.app.locals.mockDb;
    let isValid = false;

    // Validate OTP
    if (req.app.locals.isDbConnected) {
      const otpRecord = await Otp.findOne({ email, otp });
      if (otpRecord) {
        isValid = true;
        await Otp.deleteOne({ _id: otpRecord._id }); // Use once, delete
      }
    } else {
      const otpRecord = mockDb.otps?.find(o => o.email === email && o.otp === otp);
      if (otpRecord) {
        isValid = true;
        mockDb.otps = mockDb.otps.filter(o => o !== otpRecord);
      }
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP verification code.' });
    }

    const affiliateCode = generateReferralCode(username);

    // Track referrer
    let referredBy = null;
    if (refCode) {
      if (req.app.locals.isDbConnected) {
        const referrer = await User.findOne({ affiliateCode: refCode });
        if (referrer) referredBy = referrer.username;
      } else {
        const referrer = mockDb.users.find(u => u.affiliateCode === refCode);
        if (referrer) referredBy = referrer.username;
      }
    }

    // Save User
    if (req.app.locals.isDbConnected) {
      const newUser = new User({
        username,
        email,
        password,
        affiliateCode,
        referredBy,
        balance: 10.0 // Starting bonus
      });

      await newUser.save();
      const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          balance: newUser.balance,
          affiliateEarnings: newUser.affiliateEarnings,
          affiliateCode: newUser.affiliateCode,
          referredBy: newUser.referredBy
        }
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const mockUser = {
        id: 'mock_user_' + Date.now(),
        username,
        email,
        password: hashedPassword,
        balance: 10.0, // Starting bonus
        affiliateEarnings: 0.0,
        affiliateCode,
        referredBy,
        createdAt: new Date()
      };

      mockDb.users.push(mockUser);
      const token = jwt.sign({ id: mockUser.id, username: mockUser.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        token,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          balance: mockUser.balance,
          affiliateEarnings: mockUser.affiliateEarnings,
          affiliateCode: mockUser.affiliateCode,
          referredBy: mockUser.referredBy
        }
      });
    }
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ error: 'Failed to verify OTP and register.' });
  }
});

// LOGIN Endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }

  try {
    const mockDb = req.app.locals.mockDb;

    if (req.app.locals.isDbConnected) {
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ error: 'Invalid username or password.' });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid username or password.' });

      const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          affiliateEarnings: user.affiliateEarnings,
          affiliateCode: user.affiliateCode,
          referredBy: user.referredBy
        }
      });
    } else {
      const user = mockDb.users.find(u => u.username === username);
      if (!user) return res.status(400).json({ error: 'Invalid username or password.' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid username or password.' });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          affiliateEarnings: user.affiliateEarnings,
          affiliateCode: user.affiliateCode,
          referredBy: user.referredBy
        }
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET CURRENT USER PROFILE
router.get('/profile', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.userDetails.id || req.userDetails._id,
      username: req.userDetails.username,
      email: req.userDetails.email,
      balance: req.userDetails.balance,
      affiliateEarnings: req.userDetails.affiliateEarnings,
      affiliateCode: req.userDetails.affiliateCode,
      referredBy: req.userDetails.referredBy
    }
  });
});

export default router;
