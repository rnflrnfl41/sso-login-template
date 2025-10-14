import { useState } from 'react';
import { initiateOAuth2Login } from '../utils/oauth2Auth';
import './LoginForm.css';

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await initiateOAuth2Login();
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>로그인</h2>
          <p>계정에 로그인하세요</p>
        </div>

        <button 
          className="login-button"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? '로그인 중...' : '로그인하러가기'}
        </button>
      </div>
    </div>
  );
};

export default LoginForm;