const otpStore = {}; // Temporary storage (use Redis in production)

const generateOtp = (phone) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // Valid for 5 mins
    return otp;
};

const sendOtp = async (phone, otp) => {
    console.log(`Sending OTP ${otp} to ${phone}`);
    // Integrate with an SMS API (like Twilio, Firebase, or any SMS provider)
};

const verifyOtp = (phone, otp) => {
    if (!otpStore[phone] || otpStore[phone].expires < Date.now()) {
        return false;
    }
    if (otpStore[phone].otp === otp) {
        delete otpStore[phone]; // Remove OTP after verification
        return true;
    }
    return false;
};

module.exports = { generateOtp, sendOtp, verifyOtp };
