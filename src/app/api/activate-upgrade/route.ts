import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { update } from '@/lib/db/postgres';
import { emailService } from '@/lib/services/emailService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invalid Token - AutoPost VN</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
            h1 { color: #dc2626; margin: 0 0 20px 0; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Token không hợp lệ</h1>
            <p>Link kích hoạt không hợp lệ hoặc đã hết hạn.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    } catch (err) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Token Expired - AutoPost VN</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
            h1 { color: #dc2626; margin: 0 0 20px 0; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ Token đã hết hạn</h1>
            <p>Link kích hoạt đã hết hạn (> 7 ngày).</p>
            <p>Vui lòng yêu cầu người dùng gửi lại yêu cầu nâng cấp.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    const { userId, authUserId, targetPlan, email } = decoded;

    // Update user role in database
    let updatedUser;
    try {
      const updatedUsers = await update(
        'autopostvn_users',
        {
          user_role: targetPlan,
          subscription_status: 'active',
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        },
        { id: userId }
      );

      if (updatedUsers.length === 0) {
        throw new Error('User not found or update failed');
      }

      updatedUser = updatedUsers[0];
    } catch (updateError) {
      console.error('Failed to update user role:', updateError);
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Activation Failed - AutoPost VN</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
            h1 { color: #dc2626; margin: 0 0 20px 0; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Kích hoạt thất bại</h1>
            <p>Không thể cập nhật tài khoản. Vui lòng liên hệ admin.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // Send confirmation email to user
    await emailService.sendUpgradeConfirmationEmail(
      updatedUser.email,
      updatedUser.full_name || updatedUser.email,
      targetPlan as 'professional' | 'enterprise'
    );

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Activation Success - AutoPost VN</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 50px; border-radius: 10px; max-width: 600px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
          .success-icon { font-size: 80px; margin-bottom: 20px; }
          h1 { color: #10b981; margin: 0 0 20px 0; }
          p { color: #666; line-height: 1.6; margin: 15px 0; }
          .info-box { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: left; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">🎉</div>
          <h1>Kích hoạt thành công!</h1>
          <p>Tài khoản đã được nâng cấp lên gói <strong>${targetPlan === 'professional' ? 'Professional' : 'Enterprise'}</strong></p>
          
          <div class="info-box">
            <div class="info-row">
              <span class="label">Email:</span> ${email}
            </div>
            <div class="info-row">
              <span class="label">Gói:</span> ${targetPlan === 'professional' ? 'Professional (299,000đ/tháng)' : 'Enterprise (999,000đ/tháng)'}
            </div>
            <div class="info-row">
              <span class="label">Trạng thái:</span> ✅ Đã kích hoạt
            </div>
          </div>

          <p>Email xác nhận đã được gửi đến người dùng.</p>
          <p style="margin-top: 30px; color: #888; font-size: 14px;">Bạn có thể đóng trang này.</p>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );

  } catch (error) {
    console.error('Activation error:', error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Error - AutoPost VN</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
          h1 { color: #dc2626; margin: 0 0 20px 0; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Lỗi hệ thống</h1>
          <p>Đã xảy ra lỗi trong quá trình kích hoạt.</p>
          <p>Vui lòng liên hệ admin: cuong.vhcc@gmail.com</p>
        </div>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}
