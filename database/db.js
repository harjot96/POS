require('dotenv').config();
const mongoose = require('mongoose')

const connectToDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connect SuccessFully");
    } catch (error) {
        console.log(error, 'Failed to connect with database')
        process.exit(1)
    }
}
module.exports = connectToDb