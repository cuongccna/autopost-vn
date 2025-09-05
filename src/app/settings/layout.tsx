import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cài đặt - AutoPost VN',
  description: 'Cài đặt tài khoản và tùy chỉnh ứng dụng AutoPost VN',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
