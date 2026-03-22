import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { showToast } from '../../components/Toast';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <div className="bg-blue-600 p-4 rounded-2xl mb-6 text-white shadow-lg shadow-blue-600/20">
          <Shield size={36} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Admin Portal
        </h2>
        <p className="mt-3 text-center text-sm text-gray-500">
          허가된 관리자 구글 계정으로 로그인해주세요.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100/60 items-center flex flex-col">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  await login(credentialResponse.credential);
                  navigate('/admin');
                } catch (err) {
                  showToast('로그인 권한이 없거나 오류가 발생했습니다.', 'error');
                }
              }
            }}
            onError={() => {
              console.log('Login Failed');
              showToast('구글 로그인에 실패했습니다.', 'error');
            }}
            useOneTap
            shape="rectangular"
            theme="filled_blue"
            text="signin_with"
            size="large"
          />
        </div>
      </div>
    </div>
  );
}
