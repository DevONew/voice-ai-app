'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PasswordModal({ 
  isOpen, 
  onSuccess, 
  onClose 
}: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.valid) {
        sessionStorage.setItem('voice_app_authenticated', 'true');
        setPassword('');
        onSuccess();
      } else {
        setError('비밀번호가 틀렸습니다');
        setPassword('');
      }
    } catch (err) {
      setError('오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⏸️</div>
              <h2 className="text-2xl font-bold mb-3">테스트는 최대 5회입니다</h2>
              <p className="text-gray-600 leading-relaxed">
                그 이상 사용을 원할 시<br/>
                비밀번호를 입력해주세요
              </p>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="비밀번호 입력"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors text-center"
                  autoFocus
                  disabled={isLoading}
                />
                {error && (
                  <motion.p
                    className="text-red-500 text-sm mt-2 text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    ❌ {error}
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '확인 중...' : '계속 사용하기'}
              </button>
            </form>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              닫기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
