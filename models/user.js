const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        require: true,
        trim: true,
    },
    email: {
        type: String,
        require: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    shop_name: {
        type: String,
        required: true,
        trim: true,
    },
    business_type: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin',"staff"],
        default: 'user'
    },
    subscription_plan: {
        type: String,
        enum: ["Basic", "Premium"],
        default: "Basic",
    },
    isActive:{
        type:Boolean,
        default:true,
    }
}, { timestamps: true })

module.exports = mongoose.model('Users', userSchema)