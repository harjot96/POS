require('dotenv').config();
const express = require('express');
const connectToDb = require('./database/db');
const authRoutes = require('./routes/auth-routes');

connectToDb();

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
