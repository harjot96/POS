const { default: axios } = require("axios");

const otpStore = {}; // Temporary storage (use Redis in production)

const FIREOTP_API_KEY = process.env.FIREOTP_API_KEY;
const FIREOTP_URL = `https://2factor.in/API/V1/${FIREOTP_API_KEY}/SMS`;
const generateOtp = (phone) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // Valid for 5 mins
    return otp;
};

const sendOtp = async (phone, otp) => {
    console.log(`Sending OTP ${otp} to ${phone}`);
    try {
        const response = await axios.get(`${FIREOTP_URL}/${phone}/${otp}`);
        if (response.data.Status === 'Success') {
            console.log(`OTP ${otp} sent successfully to ${phone}`);
            return { success: true, message: 'OTP sent successfully.' };
        } else {
            console.error('Error sending OTP:', response.data);
            return { success: false, message: 'Failed to send OTP.' };
        }
    } catch (error) {
        console.error('2Factor.in API error:', error.message);
        return { success: false, message: 'Error connecting to OTP service.' };
    }
};

const verifyOtp = (phone, otp) => {
    if (!otpStore[phone] || otpStore[phone].expires < Date.now()) {
        return false;
    }
    if (otpStore[phone].otp === otp) {``
        delete otpStore[phone]; // Remove OTP after verification
        return true;
    }
    return false;
};

module.exports = { generateOtp, sendOtp, verifyOtp };
