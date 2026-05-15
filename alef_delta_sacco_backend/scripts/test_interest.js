/**
 * Manual test script for interest processing
 * Run: docker-compose exec api node scripts/test_interest.js
 */

import { processMonthlyInterest } from '../src/modules/accounts/interest-processor.js';

console.log('\n💰 Testing Monthly Interest Processing\n');
console.log('='.repeat(60));
console.log('\n');

try {
  const result = await processMonthlyInterest();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test completed successfully!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}


