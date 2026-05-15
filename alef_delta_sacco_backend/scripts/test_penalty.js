/**
 * Manual test script for penalty processing
 * Run: docker-compose exec api node scripts/test_penalty.js
 */

import { processOverdueLoanPenalties } from '../src/modules/loan-repayments/penalty-processor.js';

console.log('\n🧪 Testing Penalty Processing System\n');
console.log('=' .repeat(60));
console.log('\n');

try {
  const result = await processOverdueLoanPenalties();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test completed successfully!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}


