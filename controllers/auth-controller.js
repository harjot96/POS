const bcrypt = require('bcryptjs');
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const registerUser = async (req, res) => {
    try {
        const { userName, email, password, phone, shop_name, business_type, role, subscription_plan } = req.body;
        const checkExistingUser = await User.findOne({ email })
        if (checkExistingUser) {
            return res.status(400).json({
                success: false,
                message: "User is already existed with same user email.Please try with different one! "
            })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const newUser = new User({
            userName,
            email,
            password: hashedPassword,
            phone,
            shop_name,
            business_type,
            role: role || 'user',
            subscription_plan: subscription_plan || "Basic"
        })
        await newUser.save()
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: { id: newUser._id, userName, email }
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: `Something went wrong.Please try again !${error}`
        })
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const checkExistingUser = await User.findOne({ email })
        if (!checkExistingUser) {
            return res.status(400).json({
                success: false,
                message: "User doesn't exists"
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, checkExistingUser.password)
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials!"
            });
        }
        const accessToken = jwt.sign({
            userId: checkExistingUser._id, username: checkExistingUser.userName,
            role: checkExistingUser.role
        }, process.env.JWT_SECRET, { expiresIn: '1h' })

        res.status(200).json({
            success: true,
            message: 'Login successfully',
            user: {
                id: checkExistingUser._id, userName: checkExistingUser.userName, email: checkExistingUser.email, phone: checkExistingUser.phone, shop_name: checkExistingUser.shop_name, business_type: checkExistingUser.business_type
            },
            accessToken
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Something went wrong.Please try again !'
        })
    }
}

const deleteUser = async (req, res) => {
    try {

    } catch (error) {

    }
}
module.exports = { registerUser, loginUser, deleteUser }