import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">联系我们</h2>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm max-w-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-4xl shadow-md transform rotate-3">
            👋
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">很高兴见到你！</h3>
            <p className="text-gray-600 leading-relaxed">
              如果你有任何建议、反馈或合作意向，欢迎通过以下方式联系我。
              <br />
              致力于打造最好用的头马时间官助手。
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* WeChat Card */}
          <div className="group bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-200 rounded-xl p-4 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <img src="/wechat.svg" alt="WeChat" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">WeChat</p>
                  <p className="text-gray-800 font-medium font-mono">Alex_571_</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy('Alex_571_', 'wechat')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  copiedField === 'wechat'
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-600'
                }`}
              >
                {copiedField === 'wechat' ? '已复制 ✓' : '复制'}
              </button>
            </div>
          </div>

          {/* Email Card */}
          <div className="group bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl p-4 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                  📧
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-gray-800 font-medium font-mono">meng_fr595@163.com</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy('meng_fr595@163.com', 'email')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  copiedField === 'email'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {copiedField === 'email' ? '已复制 ✓' : '复制'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} 头马时间官助手 | Made with ❤️
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
