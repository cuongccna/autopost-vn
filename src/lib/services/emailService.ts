import nodemailer from 'nodemailer';

// Email service using Nodemailer for PostgreSQL-based auth
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Đặt lại mật khẩu - AutoPost VN',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Đặt lại mật khẩu AutoPost VN</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản AutoPost VN.</p>
          <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}"
               style="background-color: #007bff; color: white; padding: 10px 20px;
                      text-decoration: none; border-radius: 5px;">
              Đặt lại mật khẩu
            </a>
          </p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <p>Liên kết này sẽ hết hạn trong 1 giờ.</p>
          <p>Trân trọng,<br>Đội ngũ AutoPost VN</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Nếu nút không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt:<br>
            ${resetUrl}
          </p>
        </div>
      `,
      text: `
        Đặt lại mật khẩu AutoPost VN

        Xin chào,

        Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản AutoPost VN.

        Vui lòng truy cập liên kết sau để đặt lại mật khẩu:
        ${resetUrl}

        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        Liên kết này sẽ hết hạn trong 1 giờ.

        Trân trọng,
        Đội ngũ AutoPost VN
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Chào mừng đến với AutoPost VN',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Chào mừng ${userName} đến với AutoPost VN!</h2>
          <p>Cảm ơn bạn đã đăng ký tài khoản với chúng tôi.</p>
          <p>Bạn có thể bắt đầu sử dụng AutoPost VN để tự động đăng bài lên các nền tảng mạng xã hội.</p>
          <p style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/app"
               style="background-color: #28a745; color: white; padding: 10px 20px;
                      text-decoration: none; border-radius: 5px;">
              Bắt đầu sử dụng
            </a>
          </p>
          <p>Trân trọng,<br>Đội ngũ AutoPost VN</p>
        </div>
      `,
      text: `
        Chào mừng ${userName} đến với AutoPost VN!

        Cảm ơn bạn đã đăng ký tài khoản với chúng tôi.

        Bạn có thể bắt đầu sử dụng AutoPost VN để tự động đăng bài lên các nền tảng mạng xã hội.

        Truy cập: ${process.env.NEXT_PUBLIC_APP_URL}/app

        Trân trọng,
        Đội ngũ AutoPost VN
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Welcome email send error:', error);
      return false;
    }
  }

  async sendEmailVerificationEmail(email: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Xác thực email - AutoPost VN',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xác thực email AutoPost VN</h2>
          <p>Xin chào,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản AutoPost VN. Vui lòng xác thực email của bạn bằng cách nhấp vào liên kết bên dưới:</p>
          <p style="margin: 20px 0;">
            <a href="${verificationUrl}"
               style="background-color: #28a745; color: white; padding: 10px 20px;
                      text-decoration: none; border-radius: 5px;">
              Xác thực email
            </a>
          </p>
          <p>Liên kết này sẽ hết hạn trong 24 giờ.</p>
          <p>Trân trọng,<br>Đội ngũ AutoPost VN</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            Nếu nút không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt:<br>
            ${verificationUrl}
          </p>
        </div>
      `,
      text: `
        Xác thực email AutoPost VN

        Xin chào,

        Cảm ơn bạn đã đăng ký tài khoản AutoPost VN. Vui lòng xác thực email của bạn bằng cách truy cập:

        ${verificationUrl}

        Liên kết này sẽ hết hạn trong 24 giờ.

        Trân trọng,
        Đội ngũ AutoPost VN
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email verification send error:', error);
      return false;
    }
  }

  async sendUpgradeConfirmationEmail(email: string, userName: string, plan: 'professional' | 'enterprise'): Promise<boolean> {
    const planNames = {
      professional: 'Professional',
      enterprise: 'Enterprise'
    };

    const planFeatures = {
      professional: [
        '• Không giới hạn số bài đăng/tháng',
        '• Đăng bài tự động theo lịch',
        '• AI không giới hạn cho nội dung',
        '• Hỗ trợ ưu tiên 24/7',
        '• Thống kê chi tiết và insights',
        '• 50 lượt AI mỗi ngày, 1000 lượt mỗi tháng'
      ],
      enterprise: [
        '• Tất cả tính năng Professional',
        '• Không giới hạn AI requests',
        '• API Access cho doanh nghiệp',
        '• Tích hợp tùy chỉnh',
        '• Account Manager riêng',
        '• Bảo mật nâng cao'
      ]
    };

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `🎉 Nâng cấp thành công lên ${planNames[plan]} - AutoPost VN`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎉 Chúc mừng ${userName}!</h2>
          <p>Tài khoản của bạn đã được nâng cấp thành công lên gói <strong>${planNames[plan]}</strong>.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #28a745;">✨ Tính năng mới của bạn:</h3>
            <ul style="color: #555; line-height: 1.6;">
              ${planFeatures[plan].map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/app"
               style="background-color: #28a745; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              🚀 Bắt đầu sử dụng ngay
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.
          </p>

          <p>Trân trọng,<br><strong>Đội ngũ AutoPost VN</strong></p>
        </div>
      `,
      text: `
        🎉 Chúc mừng ${userName}!

        Tài khoản của bạn đã được nâng cấp thành công lên gói ${planNames[plan]}.

        Tính năng mới của bạn:
        ${planFeatures[plan].join('\n')}

        Bắt đầu sử dụng: ${process.env.NEXT_PUBLIC_APP_URL}/app

        Nếu bạn có câu hỏi, vui lòng liên hệ đội ngũ hỗ trợ.

        Trân trọng,
        Đội ngũ AutoPost VN
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Upgrade confirmation email send error:', error);
      return false;
    }
  }

  async sendUpgradeRequestToAdmin(data: {
    userName: string;
    userEmail: string;
    targetPlan: 'professional' | 'enterprise';
    userId: string;
    activationToken: string;
  }): Promise<boolean> {
    const planNames = {
      professional: 'Professional (299,000đ/tháng)',
      enterprise: 'Enterprise (999,000đ/tháng)'
    };

    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/activate-upgrade?token=${data.activationToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: ['cuong.vhcc@gmail.com'], // Admin email
      subject: `🔄 Yêu cầu nâng cấp tài khoản - ${data.userEmail}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🔄 Yêu cầu nâng cấp tài khoản</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">Thông tin khách hàng:</h3>
            <p><strong>Tên:</strong> ${data.userName}</p>
            <p><strong>Email:</strong> ${data.userEmail}</p>
            <p><strong>User ID:</strong> ${data.userId}</p>
            <p><strong>Gói yêu cầu:</strong> ${planNames[data.targetPlan]}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}"
               style="background-color: #28a745; color: white; padding: 15px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              ✅ Kích hoạt nâng cấp
            </a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⚠️ Lưu ý:</strong> Chỉ kích hoạt sau khi đã nhận được thanh toán từ khách hàng.
          </div>

          <p style="color: #666; font-size: 14px;">
            Liên kết kích hoạt sẽ hết hạn trong 7 ngày.
          </p>

          <p>Trân trọng,<br><strong>Hệ thống AutoPost VN</strong></p>
        </div>
      `,
      text: `
        Yêu cầu nâng cấp tài khoản

        Thông tin khách hàng:
        Tên: ${data.userName}
        Email: ${data.userEmail}
        User ID: ${data.userId}
        Gói yêu cầu: ${planNames[data.targetPlan]}

        Kích hoạt: ${activationUrl}

        Lưu ý: Chỉ kích hoạt sau khi đã nhận được thanh toán từ khách hàng.
        Liên kết kích hoạt sẽ hết hạn trong 7 ngày.

        Trân trọng,
        Hệ thống AutoPost VN
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Upgrade request email send error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
