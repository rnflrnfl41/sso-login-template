import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Callback.css';

const Callback = () => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        setStatus('processing');
        
        // URL에서 authorization code와 state 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        if (error) {
          throw new Error(`구글 로그인 실패: ${error}`);
        }
        
        if (!code) {
          throw new Error('Authorization code가 없습니다.');
        }
        
        // CSRF 보호를 위한 state 검증
        const savedState = sessionStorage.getItem('google_oauth_state');
        if (!state || state !== savedState) {
          throw new Error('잘못된 state 값입니다. CSRF 공격 가능성이 있습니다.');
        }
        
        // state 검증 후 제거
        sessionStorage.removeItem('google_oauth_state');
        
        // Authorization Server로 POST /api/auth/external-login 호출
        const response = await fetch('/api/auth/external-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            state: state,
            provider: 'google'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const { user, access_token, refresh_token } = await response.json();
        
        // JWT 토큰 저장 및 사용자 정보 설정
        await login({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          loginMethod: 'OAuth2',
          provider: 'google'
        });
        
        // 토큰을 localStorage에 저장
        localStorage.setItem('access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }
        
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        
      } catch (err) {
        console.error('콜백 처리 중 오류:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    processCallback();
  }, [navigate, login]);

  if (status === 'processing') {
    return (
      <div className="callback-container">
        <div className="callback-spinner"></div>
        <h2>로그인 처리 중...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="callback-container">
        <div className="callback-success">✓</div>
        <h2>로그인 성공!</h2>
        <p>대시보드로 이동합니다...</p>
      </div>
    );
  }

  return (
    <div className="callback-container">
      <div className="callback-error">✗</div>
      <h2>로그인 실패</h2>
      <p>{error || '알 수 없는 오류가 발생했습니다.'}</p>
      <button 
        className="callback-retry-btn"
        onClick={() => navigate('/login')}
      >
        다시 로그인하기
      </button>
    </div>
  );
};

export default Callback;
