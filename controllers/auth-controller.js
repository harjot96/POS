require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const otpService = require('../services/otpServices'); // OTP handling service

// **1️⃣ Send OTP to User's Mobile Number**
const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, message: "Phone number is required!" });
        }

        // Generate and send OTP
        const otp = otpService.generateOtp(phone);
        await otpService.sendOtp(phone, otp);

        res.status(200).json({
            success: true,
            message: `OTP sent successfully to ${phone} ${otp}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error sending OTP. Please try again!" });
    }
};

// **2️⃣ Verify OTP & Check User Registration Status in One API**
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: "Phone and OTP are required!" });
        }

        // Verify OTP
        const isValidOtp = await otpService.verifyOtp(phone, otp);
        if (!isValidOtp) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP!" });
        }

        // Check if user exists
        let user = await User.findOne({ phone });

        if (!user) {
            // New user, needs to register
            return res.status(200).json({
                success: true,
                isNewUser: true,
                isIncomplete: true,
                message: "OTP verified! Please complete registration."
            });
        }

        // Check if user details are incomplete
        const isIncomplete = !user.userName || !user.email || !user.password || !user.shop_name;
        
        if (isIncomplete) {
            return res.status(200).json({
                success: true,
                isNewUser: false,
                isIncomplete: true,
                message: "User exists but needs to complete registration."
            });
        }

        // If user is fully registered, log them in
        const accessToken = jwt.sign({
            userId: user._id,
            username: user.userName,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            success: true,
            
            isNewUser: false,
            isIncomplete: false,
            message: "OTP verified! Login successful.",
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email,
                phone: user.phone,
                shop: user.shop_name
            },
            accessToken
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Something went wrong. Please try again!" });
    }
};

// **3️⃣ Register User After OTP Verification**
const registerUser = async (req, res) => {
    try {
        const { phone, userName, email, password, shop_name, business_type, role, subscription_plan } = req.body;
        console.log(req.body);

        // Try to find an existing user by phone
        let user = await User.findOne({ phone });
        console.log(user);
        
        // If no user exists, create a new instance with the phone number
        if (!user) {
            user = new User({ phone });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(hashedPassword);

        // Update or set user details
        user.userName = userName;
        user.email = email;
        user.password = hashedPassword;
        user.shop_name = shop_name;
        user.business_type = business_type;
        user.role = role || 'user';
        user.subscription_plan = subscription_plan || "Basic";

        await user.save();

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: { id: user._id, userName, email, phone }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again!" });
    }
};


module.exports = { sendOtp, verifyOtp, registerUser };
