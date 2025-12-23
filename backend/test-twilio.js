// Quick test script for Twilio
const axios = require('axios');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const testPhone = process.argv[2] || '+1234567890'; // Replace with your test number

console.log('Testing Twilio configuration...');
console.log('Account SID:', accountSid ? '✅ Set' : '❌ Missing');
console.log('Auth Token:', authToken ? '✅ Set' : '❌ Missing');
console.log('From Number:', fromNumber || '❌ Missing');
console.log('Test Phone:', testPhone);
console.log('');

if (!accountSid || !authToken || !fromNumber) {
  console.error('❌ Twilio credentials incomplete');
  process.exit(1);
}

axios.post(
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
  new URLSearchParams({
    To: testPhone,
    From: fromNumber,
    Body: 'Test message from PickRoute',
  }),
  {
    auth: {
      username: accountSid,
      password: authToken,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  },
)
.then((response) => {
  console.log('✅ SMS sent successfully!');
  console.log('Message SID:', response.data.sid);
  console.log('Status:', response.data.status);
})
.catch((error) => {
  console.error('❌ Failed to send SMS:');
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Error:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.error('Error:', error.message);
  }
  process.exit(1);
});
