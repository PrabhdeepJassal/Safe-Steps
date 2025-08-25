const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Welcome email template
const getWelcomeEmailTemplate = (userEmail) => {
  return {
    from: {
      name: 'Safe Steps Team',
      address: process.env.EMAIL_USER
    },
    to: userEmail,
    subject: '🛡️ Welcome to Safe Steps - Your Safety Journey Begins Here!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; margin: 15px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .safety-tip { background: #e8f4fd; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Welcome to Safe Steps!</h1>
            <p>Because every step matters in your safety journey</p>
          </div>
          
          <div class="content">
            <h2>Hello and welcome! 👋</h2>
            <p>Thank you for joining Safe Steps - your personal safety companion. We're excited to have you as part of our community dedicated to women's safety and empowerment.</p>
            
            <div class="feature">
              <h3>🗺️ Smart Route Planning</h3>
              <p>Get the safest routes to your destination with real-time safety insights.</p>
            </div>
            
            <div class="feature">
              <h3>🚨 Emergency Features</h3>
              <p>Quick access to emergency contacts and location sharing when you need it most.</p>
            </div>
            
            <div class="feature">
              <h3>👥 Community Safety</h3>
              <p>Connect with other users and contribute to community safety reports.</p>
            </div>
            
            <div class="safety-tip">
              <h3>💡 Safety Tip</h3>
              <p><strong>Always trust your instincts.</strong> If something feels wrong, it probably is. Your safety is the top priority.</p>
            </div>
            
            <p>Ready to explore? Start by setting up your emergency contacts and exploring safe routes in your area.</p>
            
            <center>
              <a href="#" class="button">Get Started with Safe Steps</a>
            </center>
            
            <p>If you have any questions or need support, don't hesitate to reach out to us. We're here to help you stay safe!</p>
            
            <div class="footer">
              <p>Stay safe, stay empowered! 💪</p>
              <p><strong>The Safe Steps Team</strong></p>
              <p>
                📧 Support: safestepssafetyapp@gmail.com<br>
                🌐 Follow us for safety tips and updates
              </p>
              <p style="font-size: 12px; margin-top: 20px;">
                This email was sent because you signed up for Safe Steps. 
                If you didn't create this account, please contact our support team immediately.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Safe Steps!
      
      Hello and welcome!
      
      Thank you for joining Safe Steps - your personal safety companion. We're excited to have you as part of our community dedicated to women's safety and empowerment.
      
      Features you can explore:
      • Smart Route Planning - Get the safest routes with real-time safety insights
      • Emergency Features - Quick access to emergency contacts and location sharing
      • Community Safety - Connect with other users and contribute to safety reports
      
      Safety Tip: Always trust your instincts. If something feels wrong, it probably is.
      
      Ready to get started? Set up your emergency contacts and explore safe routes in your area.
      
      If you have any questions, reach out to us at safestepssafetyapp@gmail.com
      
      Stay safe, stay empowered!
      The Safe Steps Team
    `
  };
};

// Send welcome email
const sendWelcomeEmail = async (userEmail) => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getWelcomeEmailTemplate(userEmail);
    
    console.log(`Sending welcome email to: ${userEmail}`);
    
    const result = await transporter.sendMail(emailTemplate);
    
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send emergency alert email (for future use)
const sendEmergencyAlert = async (userEmail, location, emergencyType) => {
  try {
    const transporter = createTransporter();
    
    const emailTemplate = {
      from: {
        name: 'Safe Steps Emergency Alert',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: '🚨 EMERGENCY ALERT - Safe Steps',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff3cd; border: 2px solid #ffeaa7;">
          <h2 style="color: #d63031;">🚨 Emergency Alert Triggered</h2>
          <p><strong>Emergency Type:</strong> ${emergencyType}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="color: #d63031; font-weight: bold;">This is an automated alert from Safe Steps app.</p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(emailTemplate);
    console.log('Emergency alert sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    return { success: false, error: error.message };
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email service is ready to send emails');
    return true;
  } catch (error) {
    console.error('Email service connection failed:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendEmergencyAlert,
  testEmailConnection
};
