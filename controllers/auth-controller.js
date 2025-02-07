const User = require('../models/user')
const registerUser = async (req, res) => {
    try {
        const { userName, email, password } = req.body;
        const checkExistingUser = User.findone({ $or: [{ userName, email }] })
        if (checkExistingUser) {
            return res.status(400).json({
                success: false,
                message: "User is already existed with same user name and email.Please try with different one! "
            })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong.Please try again !'
        })
    }
}

const loginUser = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).json({
            success: true,
            message: 'Something went wrong.Please try again !'
        })
    }
}

module.export = { registerUser, loginUser }