import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/tasks';
import { errorHandler } from './middleware/errorHandler';

// database.ts import triggers Supabase client init (validates env vars)
import './database';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/tasks', taskRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
