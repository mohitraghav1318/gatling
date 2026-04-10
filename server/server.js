const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const connectDatabase = require('./config/databse');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  }),
);
app.use(express.json());

// Mount authentication routes under /api/auth.
app.use('/api/auth', authRoutes);

// Mount dashboard and organization routes under /api/dashboard and /api/org respectively.
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/org', require('./routes/org.routes'));

// Mount user profile routes under /api/user.
app.use('/api/user', require('./routes/user.routes'));

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

// Catch any request that didn't match any route above.
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

startServer();
