const debug = require('debug')('app:mailer');
const chalk = require('chalk');
const config = require('config');
const nodeMailer = require('nodemailer');

const mailConfig = config.get('mailConfig');

async function sendMail(to, subject, text, html) {
  try {
    const transporter = await nodeMailer.createTransport(mailConfig);
    const info = await transporter.sendMail({
      from: '"Robotti Rapid Response" <noreply@robotti.io>',
      to,
      subject,
      text,
      html
    });
    return {
      success: true,
      response: info.response
    };
  } catch (err) {
    debug(`
      Status: ${chalk.red('Error')}
      Function: ${chalk.red('sendMail')}
      Error: ${chalk.red(err)}
    `);
    return {
      error: true,
      message: 'An Unexpected Error Occured'
    };
  }
}


module.exports = sendMail;
