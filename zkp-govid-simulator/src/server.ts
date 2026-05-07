import 'dotenv/config';
import app from './app';
import { getGovAuthorityAddress } from './config/govAuthority';

const PORT: number = parseInt(process.env.PORT || '5000', 10);
const govAuthorityAddress = getGovAuthorityAddress();

console.log('=========================================');
console.log('🏛️ GovID Authority Public Address:');
console.log(govAuthorityAddress);
console.log('=========================================');

const server = app.listen(PORT, () => {
  console.log(`🔐 Simulated ZKP GovID Server running on port ${PORT}`);
  console.log(`📡 API Available at http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});
