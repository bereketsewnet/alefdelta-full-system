import nodemailer from 'nodemailer';
import config from '../config.js';
import logger from '../logger.js';

let transporter;

function buildTransporter() {
  if (transporter) return transporter;
  if (config.smtp.host && config.smtp.user) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

export async function sendMail(message) {
  const tx = buildTransporter();
  try {
    await tx.sendMail({
      from: 'no-reply@sacco.local',
      ...message
    });
  } catch (error) {
    logger.error('Failed to send email', { error, to: message.to });
    throw error;
  }
}

