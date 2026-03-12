const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use(cors({
    origin: true, // Allow all origins during development to avoid CORS issues with dynamic IPs
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get("/", (req, res) => {
    res.send("Server is Live (HTTP)!");
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/superadmin', require('./routes/superAdminRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/employee', require('./routes/employeeRoutes'));

mongoose.connect(process.env.MONGO_URI || '', {
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('DB Connection Error:', err));

require('./cron/attendanceCron')();

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (HTTP)`);
});
