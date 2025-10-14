import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuth2Callback, getUserInfo } from '../utils/oauth2Auth';
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
        const result = await handleOAuth2Callback();
        
        if (result.success) {
          // 서버에서 사용자 정보 가져오기 (OAuth2 UserInfo 엔드포인트)
          const userInfo = await getUserInfo();
          
          // 사용자 정보로 로그인 처리
          await login({
            id: userInfo.sub || userInfo.id,
            name: userInfo.name || userInfo.preferred_username || '사용자',
            email: userInfo.email || '',
            avatar: userInfo.picture || userInfo.avatar || '',
            loginMethod: 'OAuth2',
            provider: 'oauth2'
          });
          
          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setError(result.error);
          setStatus('error');
        }
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