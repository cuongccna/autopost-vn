import AIPlannerPage from '@/components/features/ai-planner/AIPlannerPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Trợ Lý Lịch Đăng | AutoPost VN',
  description: 'Lập kế hoạch nội dung tự động với AI cho Facebook, Instagram và Zalo OA',
};

export default function Page() {
  return <AIPlannerPage />;
}
