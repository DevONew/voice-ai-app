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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        {/* 검은색 배경 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000000',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />

        {/* 모달 컨테이너 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* 흰색 모달 카드 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '448px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* 헤더 */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏸️</div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#000000', marginBottom: '12px' }}>
                테스트는 최대 5회입니다
              </h2>
              <p style={{ color: '#6b7280', lineHeight: '1.625' }}>
                그 이상 사용을 원할 시<br/>
                비밀번호를 입력해주세요
              </p>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="비밀번호 입력"
                  autoFocus
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#000000';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                  }}
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: '#ef4444',
                      fontSize: '14px',
                      marginTop: '8px',
                      textAlign: 'center',
                    }}
                  >
                    ❌ {error}
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !password}
                style={{
                  width: '100%',
                  backgroundColor: isLoading || !password ? '#d1d5db' : '#000000',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: isLoading || !password ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  fontSize: '16px',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && password) {
                    e.currentTarget.style.backgroundColor = '#1f2937';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && password) {
                    e.currentTarget.style.backgroundColor = '#000000';
                  }
                }}
              >
                {isLoading ? '확인 중...' : '계속 사용하기'}
              </button>
            </form>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '8px',
                color: '#6b7280',
                fontSize: '14px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              닫기
            </button>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
