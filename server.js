require('dotenv').config()
const express = require('express')
const connectToDb = require('./database/db')

connectToDb()

const app = express()
app.use(express.json())

// app.use('api/auth', authRoutes);
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is listen on port ${PORT}`);
})