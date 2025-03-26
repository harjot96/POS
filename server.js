require('dotenv').config();
const express = require('express');
const connectToDb = require('./database/db');
const authRoutes = require('./routes/auth-routes');
const inventoryRoute=require('./routes/inventoryRoutes');
const productRoute=require('./routes/productroute');
const salesRoute=require('./routes/salesRoute');
const expenseRoute=require('./routes/expenseRoute');
const shopkeeperRoute=require('./routes/shopkeeperRoute');
const cors = require('cors');

connectToDb();

const app = express();

app.use(express.json());
app.use(cors()); 


app.use('/api/auth', authRoutes);
app.use('/api/inventory',inventoryRoute);
app.use('/api/products',productRoute);
app.use('/api/sales',salesRoute);
app.use('/api/expense',expenseRoute);
app.use('/api/shopkeeper',shopkeeperRoute);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
