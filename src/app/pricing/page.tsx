'use client';

import Link from 'next/link'
import { useState } from 'react';
import PaymentModal from '@/components/modals/PaymentModal';
import { showToast } from '@/lib/utils/toast';

export default function PricingPage() {
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    plan: { name: string; price: string; type: 'professional' | 'enterprise' } | null;
  }>({
    isOpen: false,
    plan: null
  });

  const handleUpgradeClick = (planType: 'professional' | 'enterprise', planName: string, planPrice: string) => {
    setPaymentModal({
      isOpen: true,
      plan: { name: planName, price: planPrice, type: planType }
    });
  };

  const handleRequestUpgrade = async (planType: 'professional' | 'enterprise') => {
    try {
      const response = await fetch('/api/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan: planType })
      });

      const data = await response.json();

      if (!response.ok) {
        // Show user-friendly error messages
        if (response.status === 401) {
          showToast.error('Vui lòng đăng nhập để nâng cấp tài khoản');
          // Redirect to login after 2 seconds
          setTimeout(() => {
            window.location.href = '/app';
          }, 2000);
        } else if (response.status === 404) {
          showToast.error('Không tìm thấy thông tin tài khoản. Vui lòng liên hệ admin.');
        } else if (data.error?.includes('already on this plan')) {
          showToast.warning('Bạn đã sở hữu gói này hoặc cao hơn rồi!');
        } else {
          showToast.error(data.error || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
        }
        throw new Error(data.error || 'Upgrade request failed');
      }

      return data;
    } catch (error: any) {
      console.error('Upgrade request error:', error);
      throw error;
    }
  };

  const plans = [
    {
      name: 'Starter',
      price: 'Miễn phí',
      period: 'Mãi mãi',
      description: 'Phù hợp cho cá nhân và startup',
      popular: false,
      features: [
        '3 tài khoản social media',
        '10 bài đăng/tháng',
        'Lên lịch cơ bản',
        'Template có sẵn',
        'Hỗ trợ email',
        'Analytics cơ bản'
      ],
      limitations: [
        'Không có AI Content Generator',
        'Không có báo cáo nâng cao',
        'Không có API access'
      ],
      cta: 'Bắt đầu miễn phí',
      ctaLink: '/app',
      planType: 'free'
    },
    {
      name: 'Professional',
      price: '299,000đ',
      period: '/tháng',
      description: 'Lựa chọn tốt nhất cho doanh nghiệp',
      popular: true,
      features: [
        '15 tài khoản social media',
        'Không giới hạn bài đăng',
        'AI Content Generator (Gemini)',
        'Lên lịch thông minh với AI',
        'Template premium',
        'Analytics nâng cao',
        'Báo cáo PDF export',
        'Hỗ trợ 24/7',
        'Team collaboration (5 users)',
        'API access',
        'Custom branding'
      ],
      limitations: [],
      cta: 'Chọn Professional',
      ctaLink: '#upgrade',
      planType: 'professional'
    },
    {
      name: 'Enterprise',
      price: '999,000đ',
      period: '/tháng',
      description: 'Giải pháp toàn diện cho tập đoàn',
      popular: false,
      features: [
        'Không giới hạn tài khoản',
        'Không giới hạn bài đăng',
        'AI Content Generator Premium',
        'White-label solution',
        'Custom integrations',
        'Dedicated account manager',
        'Advanced security',
        'Custom analytics dashboard',
        'Unlimited team members',
        'Priority support',
        'On-premise deployment',
        'Training & consulting'
      ],
      limitations: [],
      cta: 'Liên hệ tư vấn',
      ctaLink: '#upgrade',
      planType: 'enterprise'
    }
  ]

  const faqs = [
    {
      question: 'Có thể thay đổi gói dịch vụ bất cứ lúc nào không?',
      answer: 'Có, bạn có thể nâng cấp hoặc hạ cấp gói dịch vụ bất cứ lúc nào. Phí sẽ được tính theo tỷ lệ thời gian sử dụng.'
    },
    {
      question: 'AI Content Generator hoạt động như thế nào?',
      answer: 'Chúng tôi sử dụng Google Gemini AI để tạo nội dung, caption, hashtags phù hợp với từng platform và ngành nghề của bạn.'
    },
    {
      question: 'Có hỗ trợ khách hàng bằng tiếng Việt không?',
      answer: 'Có, team support của chúng tôi hoàn toàn bằng tiếng Việt và hiểu rõ thị trường Việt Nam.'
    },
    {
      question: 'Dữ liệu có được bảo mật an toàn không?',
      answer: 'Tuyệt đối. Chúng tôi sử dụng mã hóa end-to-end, tuân thủ GDPR và có các biện pháp bảo mật hàng đầu.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              AutoPost VN
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/features" className="text-gray-600 hover:text-blue-600">Tính năng</Link>
              <Link href="/pricing" className="text-blue-600 font-medium border-b-2 border-blue-600">Bảng giá</Link>
              <Link href="/support" className="text-gray-600 hover:text-blue-600">Trợ giúp</Link>
              <Link href="/app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Đăng nhập</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Lựa chọn gói phù hợp 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}với bạn
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Từ miễn phí đến enterprise, chúng tôi có giải pháp cho mọi quy mô doanh nghiệp
          </p>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full inline-block mb-8">
            💰 Tiết kiệm 20% khi thanh toán theo năm
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`relative p-8 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-transparent shadow-2xl scale-105' 
                    : 'bg-white border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                      🔥 Phổ biến nhất
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`mb-4 ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-lg ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <span className={`text-green-500 mr-3 ${plan.popular ? 'text-green-300' : ''}`}>✓</span>
                      <span className={`${plan.popular ? 'text-white' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, limitIndex) => (
                    <div key={limitIndex} className="flex items-center">
                      <span className="text-gray-400 mr-3">✗</span>
                      <span className="text-gray-500 text-sm">
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>

                {plan.planType === 'free' ? (
                  <Link 
                    href={plan.ctaLink}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-white text-blue-600 hover:bg-gray-100'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button 
                    onClick={() => handleUpgradeClick(plan.planType as 'professional' | 'enterprise', plan.name, plan.price)}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-white text-blue-600 hover:bg-gray-100'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            So sánh chi tiết các gói dịch vụ
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Tính năng</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Starter</th>
                  <th className="text-center py-4 px-6 font-semibold text-blue-600 bg-blue-50">Professional</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6">Số tài khoản social media</td>
                  <td className="text-center py-4 px-6">3</td>
                  <td className="text-center py-4 px-6 bg-blue-50">15</td>
                  <td className="text-center py-4 px-6">Không giới hạn</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6">Số bài đăng/tháng</td>
                  <td className="text-center py-4 px-6">10</td>
                  <td className="text-center py-4 px-6 bg-blue-50">Không giới hạn</td>
                  <td className="text-center py-4 px-6">Không giới hạn</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6">AI Content Generator</td>
                  <td className="text-center py-4 px-6">✗</td>
                  <td className="text-center py-4 px-6 bg-blue-50">✓</td>
                  <td className="text-center py-4 px-6">✓ Premium</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6">Team collaboration</td>
                  <td className="text-center py-4 px-6">✗</td>
                  <td className="text-center py-4 px-6 bg-blue-50">5 users</td>
                  <td className="text-center py-4 px-6">Không giới hạn</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-6">API Access</td>
                  <td className="text-center py-4 px-6">✗</td>
                  <td className="text-center py-4 px-6 bg-blue-50">✓</td>
                  <td className="text-center py-4 px-6">✓ Advanced</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Bắt đầu tự động hóa marketing ngay hôm nay
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app" className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 font-medium">
              Dùng thử miễn phí
            </Link>
            <Link href="/support" className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white/10 font-medium">
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {paymentModal.plan && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ isOpen: false, plan: null })}
          plan={paymentModal.plan}
          onRequestUpgrade={handleRequestUpgrade}
        />
      )}
    </div>
  )
}
