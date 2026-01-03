import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { loginWithPhone, sendSmsCode } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendSmsCode(phone);
      setStep('code');
    } catch (err: any) {
      setError('发送验证码失败，请重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithPhone(phone, code);
    } catch (err: any) {
      setError('登录失败，验证码错误');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">欢迎回来</h1>
          <p className="text-gray-500">登录以同步您的数据</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入手机号"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '发送中...' : '获取验证码'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入验证码"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-gray-500 text-sm hover:text-gray-700"
            >
              返回修改手机号
            </button>
          </form>
        )}

        <div className="mt-6 border-t pt-6">
          <p className="text-center text-sm text-gray-400 mb-4">或者使用</p>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-[#07C160] text-white py-2 rounded-lg hover:bg-[#06ad56] transition-colors"
            onClick={() => alert('微信登录功能开发中...')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.5,15c-3.6,0-6.5-2.6-6.5-5.8c0-3.2,2.9-5.8,6.5-5.8c3.6,0,6.5,2.6,6.5,5.8C15,12.4,12.1,15,8.5,15z M8.5,4.7 c-2.8,0-5,2.1-5,4.6c0,2.5,2.2,4.6,5,4.6c2.8,0,5-2.1,5-4.6C13.5,6.7,11.3,4.7,8.5,4.7z M6.2,9.7c0.4,0,0.8-0.3,0.8-0.7 c0-0.4-0.3-0.7-0.8-0.7S5.5,8.6,5.5,9C5.5,9.4,5.8,9.7,6.2,9.7z M10.2,9.7c0.4,0,0.8-0.3,0.8-0.7c0-0.4-0.3-0.7-0.8-0.7 s-0.8,0.3-0.8,0.7C9.5,9.4,9.8,9.7,10.2,9.7z M16.5,10.2c-2.9,0-5.3,1.9-5.3,4.3c0,2.4,2.4,4.3,5.3,4.3c0.6,0,1.2-0.1,1.8-0.3 l1.6,0.9l-0.4-1.5c1.3-0.9,2.2-2.1,2.2-3.4C21.8,12.2,19.4,10.2,16.5,10.2z M14.8,14.2c-0.3,0-0.5-0.2-0.5-0.5s0.2-0.5,0.5-0.5 s0.5,0.2,0.5,0.5S15.1,14.2,14.8,14.2z M18.2,14.2c-0.3,0-0.5-0.2-0.5-0.5s0.2-0.5,0.5-0.5s0.5,0.2,0.5,0.5S18.5,14.2,18.2,14.2z"/>
            </svg>
            微信登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
