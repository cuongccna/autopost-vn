import { Resend } from 'resend';

const resend = new Resend(process.env.EMAIL_SERVER_PASSWORD || process.env.RESEND_API_KEY);

export interface UpgradeRequestEmailData {
  userName: string;
  userEmail: string;
  targetPlan: 'professional' | 'enterprise';
  userId: string;
  activationToken: string;
}

export interface UpgradeConfirmationEmailData {
  userName: string;
  userEmail: string;
  plan: 'professional' | 'enterprise';
}

export async function sendUpgradeRequestToAdmin(data: UpgradeRequestEmailData) {
  const planNames = {
    professional: 'Professional (299,000đ/tháng)',
    enterprise: 'Enterprise (999,000đ/tháng)'
  };

  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/activate-upgrade?token=${data.activationToken}`;

  try {
    const result = await resend.emails.send({
      from: 'AutoPost VN <onboarding@resend.dev>',
      to: ['cuong.vhcc@gmail.com'],
      subject: `Yêu cầu nâng cấp tài khoản - ${data.userEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .info-row { display: flex; margin: 10px 0; }
            .info-label { font-weight: bold; min-width: 120px; color: #667eea; }
            .info-value { flex: 1; }
            .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .button:hover { opacity: 0.9; }
            .footer { text-align: center; margin-top: 30px; color: #888; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Yêu cầu nâng cấp tài khoản</h1>
            </div>
            <div class="content">
              <p>Xin chào Admin,</p>
              <p>Có một yêu cầu nâng cấp tài khoản mới từ người dùng:</p>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Tên người dùng:</span>
                  <span class="info-value">${data.userName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${data.userEmail}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">User ID:</span>
                  <span class="info-value">${data.userId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Gói yêu cầu:</span>
                  <span class="info-value"><strong>${planNames[data.targetPlan]}</strong></span>
                </div>
              </div>

              <p><strong>Để kích hoạt tài khoản này, vui lòng:</strong></p>
              <ol>
                <li>Xác nhận đã nhận được thanh toán từ người dùng</li>
                <li>Nhấn vào nút bên dưới để kích hoạt gói nâng cấp</li>
              </ol>

              <div style="text-align: center;">
                <a href="${activationUrl}" class="button">
                  ✅ Kích hoạt ngay
                </a>
              </div>

              <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 8px;">
                <strong>⚠️ Lưu ý:</strong> Link kích hoạt có hiệu lực trong 7 ngày. Sau khi kích hoạt, người dùng sẽ nhận được email xác nhận tự động.
              </p>

              <div class="footer">
                <p>Email được gửi tự động từ hệ thống AutoPost VN</p>
                <p>© ${new Date().getFullYear()} AutoPost VN. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send upgrade request email:', error);
    return { success: false, error };
  }
}

export async function sendUpgradeConfirmationToUser(data: UpgradeConfirmationEmailData) {
  const planNames = {
    professional: 'Professional',
    enterprise: 'Enterprise'
  };

  const planFeatures = {
    professional: [
      '15 tài khoản social media',
      'Không giới hạn bài đăng',
      'AI Content Generator (Gemini)',
      'Analytics nâng cao',
      'Báo cáo PDF export',
      'Hỗ trợ 24/7'
    ],
    enterprise: [
      'Không giới hạn tài khoản',
      'Không giới hạn bài đăng',
      'AI Content Generator Premium',
      'White-label solution',
      'Dedicated account manager',
      'Priority support'
    ]
  };

  try {
    const result = await resend.emails.send({
      from: 'AutoPost VN <onboarding@resend.dev>',
      to: [data.userEmail],
      subject: `🎉 Tài khoản ${planNames[data.plan]} đã được kích hoạt!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-icon { font-size: 60px; margin-bottom: 20px; }
            .features { background: white; padding: 25px; border-radius: 8px; margin: 25px 0; }
            .feature-item { padding: 10px 0; border-bottom: 1px solid #eee; }
            .feature-item:last-child { border-bottom: none; }
            .feature-item:before { content: '✓'; color: #10b981; font-weight: bold; margin-right: 10px; }
            .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #888; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">🎉</div>
              <h1>Chúc mừng ${data.userName}!</h1>
              <p style="font-size: 18px; margin: 10px 0 0 0;">Tài khoản của bạn đã được nâng cấp lên gói <strong>${planNames[data.plan]}</strong></p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${data.userName}</strong>,</p>
              <p>Chúng tôi rất vui thông báo rằng tài khoản AutoPost VN của bạn đã được nâng cấp thành công!</p>
              
              <div class="features">
                <h3 style="margin-top: 0; color: #667eea;">Tính năng của gói ${planNames[data.plan]}:</h3>
                ${planFeatures[data.plan].map(feature => `
                  <div class="feature-item">${feature}</div>
                `).join('')}
              </div>

              <p><strong>Bắt đầu sử dụng ngay:</strong></p>
              <p>Tất cả tính năng cao cấp đã được kích hoạt. Hãy đăng nhập và trải nghiệm những công cụ mạnh mẽ mới!</p>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/app" class="button">
                  Truy cập Dashboard
                </a>
              </div>

              <p style="margin-top: 30px; padding: 20px; background: #e0f2fe; border-radius: 8px;">
                <strong>💡 Mẹo:</strong> Khám phá AI Content Generator và Analytics nâng cao để tối ưu hiệu suất social media của bạn!
              </p>

              <p style="margin-top: 30px;">Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:cuong.vhcc@gmail.com">cuong.vhcc@gmail.com</a></p>

              <div class="footer">
                <p>Cảm ơn bạn đã tin tưởng AutoPost VN!</p>
                <p>© ${new Date().getFullYear()} AutoPost VN. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return { success: false, error };
  }
}
