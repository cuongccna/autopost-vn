import { Resend } from 'resend';
import { query } from '@/lib/db/postgres';
import { WorkspaceSettingsService } from './workspace-settings.service';

const resend = new Resend(process.env.EMAIL_SERVER_PASSWORD || process.env.RESEND_API_KEY);

interface PostNotificationData {
  postId: string;
  postTitle: string;
  postContent: string;
  provider: string;
  accountName: string;
  userId: string;
  workspaceId: string;
}

interface TokenExpiryNotificationData {
  userId: string;
  accountName: string;
  provider: string;
  expiresAt: Date;
}

export class NotificationService {
  /**
   * Gửi email thông báo khi đăng bài thành công
   */
  static async notifyPublishSuccess(data: PostNotificationData): Promise<boolean> {
    try {
      // Kiểm tra settings
      const settings = await WorkspaceSettingsService.getSettings(data.workspaceId);
      if (!WorkspaceSettingsService.shouldNotify(settings, 'success')) {
        console.log('📧 [NOTIFICATION] Success notification disabled for workspace');
        return false;
      }

      // Lấy email user
      const userResult = await query<{ email: string; name: string }>(
        'SELECT email, name FROM autopostvn_users WHERE id = $1',
        [data.userId]
      );
      
      if (!userResult.rows[0]?.email) {
        console.error('📧 [NOTIFICATION] User email not found');
        return false;
      }

      const user = userResult.rows[0];
      const providerNames: Record<string, string> = {
        facebook_page: 'Facebook Page',
        instagram_business: 'Instagram',
        instagram: 'Instagram',
        facebook: 'Facebook',
        zalo: 'Zalo'
      };

      const result = await resend.emails.send({
        from: 'AutoPost VN <onboarding@resend.dev>',
        to: [user.email],
        subject: `✅ Đăng bài thành công - ${providerNames[data.provider] || data.provider}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .post-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
              .provider-badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 20px; font-size: 14px; margin-top: 10px; }
              .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
              .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Đăng bài thành công!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${user.name || 'bạn'}</strong>,</p>
              <p>Bài đăng của bạn đã được đăng thành công lên mạng xã hội!</p>
              
              <div class="post-box">
                <strong>${data.postTitle || 'Bài đăng'}</strong>
                <p style="color: #666; margin: 10px 0;">${data.postContent?.substring(0, 200)}${data.postContent?.length > 200 ? '...' : ''}</p>
                <span class="provider-badge">${providerNames[data.provider] || data.provider} - ${data.accountName}</span>
              </div>

              <p>Thời gian đăng: <strong>${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</strong></p>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/app" class="button">
                  Xem Dashboard
                </a>
              </div>

              <div class="footer">
                <p>Bạn nhận được email này vì đã bật thông báo trong Cài đặt.</p>
                <p>© ${new Date().getFullYear()} AutoPost VN</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log('📧 [NOTIFICATION] Success email sent:', result);
      return true;
    } catch (error) {
      console.error('📧 [NOTIFICATION] Failed to send success email:', error);
      return false;
    }
  }

  /**
   * Gửi email thông báo khi đăng bài thất bại
   */
  static async notifyPublishFailure(data: PostNotificationData & { error: string }): Promise<boolean> {
    try {
      // Kiểm tra settings
      const settings = await WorkspaceSettingsService.getSettings(data.workspaceId);
      if (!WorkspaceSettingsService.shouldNotify(settings, 'failure')) {
        console.log('📧 [NOTIFICATION] Failure notification disabled for workspace');
        return false;
      }

      // Lấy email user
      const userResult = await query<{ email: string; name: string }>(
        'SELECT email, name FROM autopostvn_users WHERE id = $1',
        [data.userId]
      );
      
      if (!userResult.rows[0]?.email) {
        console.error('📧 [NOTIFICATION] User email not found');
        return false;
      }

      const user = userResult.rows[0];
      const providerNames: Record<string, string> = {
        facebook_page: 'Facebook Page',
        instagram_business: 'Instagram',
        instagram: 'Instagram',
        facebook: 'Facebook',
        zalo: 'Zalo'
      };

      const result = await resend.emails.send({
        from: 'AutoPost VN <onboarding@resend.dev>',
        to: [user.email],
        subject: `❌ Đăng bài thất bại - ${providerNames[data.provider] || data.provider}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .post-box { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px; }
              .error-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
              .provider-badge { display: inline-block; background: #fee2e2; color: #dc2626; padding: 5px 12px; border-radius: 20px; font-size: 14px; margin-top: 10px; }
              .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
              .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>❌ Đăng bài thất bại</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${user.name || 'bạn'}</strong>,</p>
              <p>Rất tiếc, bài đăng của bạn không thể đăng lên mạng xã hội.</p>
              
              <div class="post-box">
                <strong>${data.postTitle || 'Bài đăng'}</strong>
                <p style="color: #666; margin: 10px 0;">${data.postContent?.substring(0, 200)}${data.postContent?.length > 200 ? '...' : ''}</p>
                <span class="provider-badge">${providerNames[data.provider] || data.provider} - ${data.accountName}</span>
              </div>

              <div class="error-box">
                <strong>⚠️ Lỗi:</strong>
                <p style="margin: 5px 0 0 0;">${data.error}</p>
              </div>

              <p><strong>Gợi ý khắc phục:</strong></p>
              <ul>
                <li>Kiểm tra kết nối tài khoản mạng xã hội</li>
                <li>Đảm bảo token truy cập còn hiệu lực</li>
                <li>Kiểm tra nội dung bài đăng tuân thủ quy định của nền tảng</li>
              </ul>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/app" class="button">
                  Kiểm tra & Thử lại
                </a>
              </div>

              <div class="footer">
                <p>Bạn nhận được email này vì đã bật thông báo trong Cài đặt.</p>
                <p>© ${new Date().getFullYear()} AutoPost VN</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log('📧 [NOTIFICATION] Failure email sent:', result);
      return true;
    } catch (error) {
      console.error('📧 [NOTIFICATION] Failed to send failure email:', error);
      return false;
    }
  }

  /**
   * Gửi email thông báo khi token sắp hết hạn
   */
  static async notifyTokenExpiry(data: TokenExpiryNotificationData): Promise<boolean> {
    try {
      // Lấy workspace và settings
      const workspaceResult = await query<{ workspace_id: string }>(
        `SELECT w.id as workspace_id FROM autopostvn_workspaces w 
         JOIN autopostvn_users u ON u.id = w.owner_id 
         WHERE u.id = $1 LIMIT 1`,
        [data.userId]
      );
      
      if (!workspaceResult.rows[0]) {
        console.error('📧 [NOTIFICATION] Workspace not found');
        return false;
      }

      const settings = await WorkspaceSettingsService.getSettings(workspaceResult.rows[0].workspace_id);
      if (!WorkspaceSettingsService.shouldNotify(settings, 'tokenExpiry')) {
        console.log('📧 [NOTIFICATION] Token expiry notification disabled');
        return false;
      }

      // Lấy email user
      const userResult = await query<{ email: string; name: string }>(
        'SELECT email, name FROM autopostvn_users WHERE id = $1',
        [data.userId]
      );
      
      if (!userResult.rows[0]?.email) {
        console.error('📧 [NOTIFICATION] User email not found');
        return false;
      }

      const user = userResult.rows[0];
      const providerNames: Record<string, string> = {
        facebook_page: 'Facebook Page',
        instagram_business: 'Instagram',
        instagram: 'Instagram',
        facebook: 'Facebook',
        zalo: 'Zalo'
      };

      const daysLeft = Math.ceil((data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      const result = await resend.emails.send({
        from: 'AutoPost VN <onboarding@resend.dev>',
        to: [user.email],
        subject: `⚠️ Token sắp hết hạn - ${data.accountName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .warning-box { background: #fffbeb; border: 1px solid #fcd34d; padding: 20px; border-radius: 6px; margin: 20px 0; }
              .provider-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 5px 12px; border-radius: 20px; font-size: 14px; }
              .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
              .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>⚠️ Token sắp hết hạn!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${user.name || 'bạn'}</strong>,</p>
              
              <div class="warning-box">
                <p><strong>Token của tài khoản sau sẽ hết hạn trong ${daysLeft} ngày:</strong></p>
                <p>
                  <span class="provider-badge">${providerNames[data.provider] || data.provider}</span>
                  <strong style="margin-left: 10px;">${data.accountName}</strong>
                </p>
                <p style="color: #92400e; margin-top: 10px;">
                  Hết hạn: <strong>${data.expiresAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</strong>
                </p>
              </div>

              <p>Để đảm bảo các bài đăng của bạn không bị gián đoạn, vui lòng kết nối lại tài khoản trước khi token hết hạn.</p>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/app?tab=accounts" class="button">
                  Kết nối lại ngay
                </a>
              </div>

              <div class="footer">
                <p>Bạn nhận được email này vì đã bật thông báo trong Cài đặt.</p>
                <p>© ${new Date().getFullYear()} AutoPost VN</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log('📧 [NOTIFICATION] Token expiry email sent:', result);
      return true;
    } catch (error) {
      console.error('📧 [NOTIFICATION] Failed to send token expiry email:', error);
      return false;
    }
  }
}
