/**
 * SMS Notification Service
 * Placeholder for SMS integration (Twilio, Africa's Talking, etc.)
 */

import logger from '../logger.js';
import config from '../config.js';

/**
 * Send SMS notification
 * @param {string} phoneNumber - Phone number in international format
 * @param {string} message - SMS message text
 * @returns {Promise<Object>} - { success: boolean, messageId?: string }
 */
export async function sendSMS(phoneNumber, message) {
  try {
    // For now, log the SMS (replace with actual SMS provider)
    console.log(`\n📱 SMS Notification:`);
    console.log(`   To: ${phoneNumber}`);
    console.log(`   Message: ${message}\n`);
    
    logger.info('SMS notification sent', { phoneNumber, message });
    
    // TODO: Integrate with actual SMS provider
    // Example with Africa's Talking or Twilio:
    /*
    const response = await smsProvider.send({
      to: phoneNumber,
      from: config.sms.senderId,
      message: message
    });
    return { success: true, messageId: response.messageId };
    */
    
    // For now, simulate success
    return {
      success: true,
      messageId: `SMS-${Date.now()}`,
      provider: 'console', // Will be 'africas-talking' or 'twilio' in production
      simulated: true
    };
    
  } catch (error) {
    logger.error('SMS sending failed', { phoneNumber, error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send penalty notification to member
 * @param {Object} member - Member object
 * @param {Object} loan - Loan object
 * @param {Object} penaltyInfo - Penalty calculation result
 * @returns {Promise<Object>}
 */
export async function sendPenaltyNotification(member, loan, penaltyInfo) {
  const message = penaltyInfo.penaltyAmount > 0
    ? `ALEF-DELTA SACCO: Your loan payment is ${penaltyInfo.missedMonths} month(s) overdue. Penalty of ETB ${penaltyInfo.penaltyAmount.toFixed(2)} has been applied. Total outstanding: ETB ${(Number(loan.outstanding_balance) + Number(penaltyInfo.penaltyAmount)).toFixed(2)}. Please pay soon to avoid additional charges.`
    : `ALEF-DELTA SACCO: Your loan (ETB ${Number(loan.approved_amount || loan.applied_amount).toFixed(2)}) payment is up to date. No penalties. Thank you for timely payments!`;
  
  return sendSMS(member.phone_primary, message);
}

/**
 * Send payment confirmation to member
 * @param {Object} member - Member object
 * @param {number} amount - Payment amount
 * @param {Object} loan - Loan object
 * @param {number} newBalance - New outstanding balance
 * @returns {Promise<Object>}
 */
export async function sendPaymentConfirmation(member, amount, loan, newBalance) {
  const message = `ALEF-DELTA SACCO: Payment received! ETB ${Number(amount).toFixed(2)} applied to your loan. New balance: ETB ${Number(newBalance).toFixed(2)}. Thank you!`;
  
  return sendSMS(member.phone_primary, message);
}


