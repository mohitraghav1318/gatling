const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const organizationRoutes = require('./routes/organization.routes');
const connectDatabase = require('./config/databse');

const app = express();

app.use(cors());
app.use(express.json());

// Mount authentication routes under /api/auth.
app.use('/api/auth', authRoutes);

// Dashboard APIs are protected by Bearer auth middleware inside their route module.
app.use('/api/dashboard', dashboardRoutes);

// Dedicated organization APIs.
// These make it easy for frontend to create/join/open/list organizations.
app.use('/api/org', organizationRoutes);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
