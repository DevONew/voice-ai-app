'use client'

import { useState } from 'react'
import PasswordModal from '@/app/components/PasswordModal'

export default function ModalTestPage() {
  const [showModal, setShowModal] = useState(true)
  const [authStatus, setAuthStatus] = useState<string>('')

  const handleSuccess = () => {
    setAuthStatus('✅ 비밀번호 인증 성공!')
    setShowModal(false)
  }

  const handleClose = () => {
    setAuthStatus('❌ 모달 닫힘')
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* 실제 앱처럼 긴 텍스트를 보여줘서 모달과 겹침 테스트 */}
      <div className="max-w-2xl w-full space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-center mb-8">음성 AI 앱</h1>

        <div className="space-y-4 text-lg">
          <p className="text-gray-800">
            안녕하세요! 저는 당신의 언어 학습을 도와드리는 AI 어시스턴트입니다.
            무엇이든 물어보세요!
          </p>
          <p className="text-gray-800">
            How are you today? I'm here to help you practice multiple languages.
            Feel free to speak in any language you'd like!
          </p>
          <p className="text-gray-800">
            こんにちは！何でも聞いてください。日本語の練習もできますよ。
          </p>
          <p className="text-gray-600 text-sm">
            현재 5회 무료 사용이 가능합니다. 그 이상 사용하시려면 비밀번호가 필요합니다.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">모달 테스트</h2>

          {authStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              authStatus.includes('성공')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              <p className="text-lg font-semibold">{authStatus}</p>
            </div>
          )}

          <button
            onClick={() => {
              setShowModal(true)
              setAuthStatus('')
            }}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            모달 다시 열기
          </button>

          <div className="mt-6 text-sm text-gray-600 text-left">
            <p className="font-semibold mb-2">💡 테스트 정보:</p>
            <ul className="space-y-1">
              <li>• 비밀번호: .env.development의 OWNER_PASSWORD</li>
              <li>• 기본값: demo123 (환경변수 없을 경우)</li>
              <li>• 실제 앱에서는 6번째 클릭 시 자동으로 표시됩니다</li>
            </ul>
          </div>
        </div>
      </div>

      <PasswordModal
        isOpen={showModal}
        onSuccess={handleSuccess}
        onClose={handleClose}
      />
    </div>
  )
}
