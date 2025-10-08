const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectToMongo } = require('./services/dbService');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/v1/user', userRoutes);

connectToMongo();

const port = process.env.API_PORT || 3000;
app.listen(port, () => console.log(`API listening on port ${port}`));