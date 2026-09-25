/**
 * SS VASTRA - Admin Notification & Authentication Email Service
 * Supports Resend API (via EMAIL_SERVICE_KEY or RESEND_API_KEY) and safe fallback logging
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.EMAIL_SERVICE_KEY || process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'SS VASTRA Security <security@ssvastra.com>',
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Resend API error:', errorData);
        return { success: false, error: JSON.stringify(errorData) };
      }

      const data = await response.json();
      return { success: true, id: data.id };
    } catch (err: unknown) {
      console.error('Failed to dispatch email via Resend:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Safe fallback in dev/staging environments without active email key
  console.log('---------------------------------------------------------');
  console.log(`[EMAIL DISPATCH] To: ${to}`);
  console.log(`[EMAIL DISPATCH] Subject: ${subject}`);
  console.log(`[EMAIL DISPATCH] Content:\n${text || html.replace(/<[^>]*>?/gm, '')}`);
  console.log('---------------------------------------------------------');
  return { success: true, id: `dev_${Date.now()}` };
}

/**
 * Send Password Reset Link (Valid for 30 minutes, one-time use)
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 580px; margin: 0 auto; background-color: #FBF7F0; border: 1px solid #E9A9BB; border-radius: 16px; padding: 32px; color: #2B2320;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #A87A2A; margin: 0; font-size: 26px; letter-spacing: 2px;">SS VASTRA</h1>
        <p style="font-size: 13px; color: #78716C; margin: 4px 0 0 0;">Jaipur Heritage Fashion & Fabrics</p>
      </div>

      <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <h2 style="font-size: 18px; margin-top: 0; color: #2B2320;">Admin Password Reset Request</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #44403C;">
          A password reset request was received for your SS VASTRA admin account (<strong>${email}</strong>).
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #44403C;">
          Click the button below to set a new password. This secure link is valid for <strong>30 minutes</strong> and can only be used once.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #A87A2A; color: #FFFFFF; font-weight: bold; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">
            Reset Admin Password
          </a>
        </div>

        <p style="font-size: 12px; color: #78716C; word-break: break-all;">
          Or copy and paste this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #A87A2A;">${resetUrl}</a>
        </p>
      </div>

      <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #A8A29E;">
        If you did not request this password reset, please ignore this email or contact the store owner immediately.
      </div>
    </div>
  `;

  const res = await sendEmail({
    to: email,
    subject: 'SS VASTRA Admin - Password Reset Link (Valid for 30 minutes)',
    html,
  });
  return res.success;
}

/**
 * Send Staff Invitation Link (Valid for 24 hours)
 */
export async function sendStaffInviteEmail(
  email: string,
  name: string,
  inviteUrl: string,
  role = 'Staff'
): Promise<boolean> {
  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 580px; margin: 0 auto; background-color: #FBF7F0; border: 1px solid #E9A9BB; border-radius: 16px; padding: 32px; color: #2B2320;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #A87A2A; margin: 0; font-size: 26px; letter-spacing: 2px;">SS VASTRA</h1>
        <p style="font-size: 13px; color: #78716C; margin: 4px 0 0 0;">Jaipur Heritage Fashion & Fabrics</p>
      </div>

      <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <h2 style="font-size: 18px; margin-top: 0; color: #2B2320;">Welcome to SS VASTRA Team, ${name}!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #44403C;">
          You have been invited as <strong>${role}</strong> to the SS VASTRA management portal.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #44403C;">
          Please click the button below to set your account password and activate your portal access. This invite link is valid for <strong>24 hours</strong>.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${inviteUrl}" style="background-color: #A87A2A; color: #FFFFFF; font-weight: bold; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">
            Activate Account & Set Password
          </a>
        </div>

        <p style="font-size: 12px; color: #78716C; word-break: break-all;">
          Or copy and paste this link into your browser:<br/>
          <a href="${inviteUrl}" style="color: #A87A2A;">${inviteUrl}</a>
        </p>
      </div>

      <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #A8A29E;">
        SS VASTRA • Green Vihar Vatika, Sanganer, Jaipur 303905
      </div>
    </div>
  `;

  const res = await sendEmail({
    to: email,
    subject: 'SS VASTRA Staff Portal Invitation (Valid for 24 hours)',
    html,
  });
  return res.success;
}

/**
 * Send 2FA One-Time Passcode (OTP)
 */
export async function sendAdminOtpEmail(email: string, otpCode: string): Promise<boolean> {
  const html = `
    <div style="font-family: 'Georgia', serif; max-width: 500px; margin: 0 auto; background-color: #FBF7F0; border: 1px solid #E9A9BB; border-radius: 16px; padding: 32px; color: #2B2320;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #A87A2A; margin: 0; font-size: 24px; letter-spacing: 2px;">SS VASTRA</h1>
      </div>
      <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; text-align: center;">
        <h2 style="font-size: 18px; margin-top: 0; color: #2B2320;">Admin Login Verification Code</h2>
        <p style="font-size: 14px; color: #57534E;">Your one-time security code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #A87A2A; margin: 20px 0;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #78716C;">This code expires in 10 minutes. Never share this code with anyone.</p>
      </div>
    </div>
  `;

  const res = await sendEmail({
    to: email,
    subject: `SS VASTRA Admin OTP: ${otpCode}`,
    html,
  });
  return res.success;
}
