import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Lane Gateway running on http://localhost:${PORT}`);
  console.log(`   Health:        http://localhost:${PORT}/api/health`);
  console.log(`   Config:        http://localhost:${PORT}/api/v1/config`);
  console.log(`   Completions:   http://localhost:${PORT}/api/v1/completions`);
  console.log(`   Requests Log:  http://localhost:${PORT}/api/v1/requests`);
  console.log(`   Stats:         http://localhost:${PORT}/api/v1/stats`);
  console.log(`   Region:        ${env.AWS_REGION}`);
  console.log(`   Mock Mode:     ${env.MOCK_SERVICES ? 'ENABLED (Zero AWS cost)' : 'DISABLED (Live APIs)'}`);
  console.log(`======================================================\n`);
});
