import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUser, checkAuthStatus } from '../utils/oauth2Auth';
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
        
        // BFF 서버 상태 확인을 위한 재시도 로직
        let retryCount = 0;
        const maxRetries = 3;
        let isAuthenticated = false;
        let userData = null;
        
        while (retryCount < maxRetries && !isAuthenticated) {
          try {
            // BFF에서 로그인 상태 확인
            isAuthenticated = await checkAuthStatus();
            
            if (isAuthenticated) {
              // BFF에서 사용자 정보 가져오기
              userData = await getCurrentUser();
              break;
            }
          } catch (error) {
            console.warn(`BFF 연결 시도 ${retryCount + 1} 실패:`, error.message);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // 1초 대기 후 재시도
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (!isAuthenticated) {
          setError('로그인되지 않았습니다. BFF 서버의 세션 설정을 확인해주세요.');
          setStatus('error');
          return;
        }
        
        if (!userData) {
          setError('사용자 정보를 가져올 수 없습니다. BFF 서버의 OAuth2 설정을 확인해주세요.');
          setStatus('error');
          return;
        }
        
        // 사용자 정보로 로그인 처리
        await login({
          id: userData.sub || userData.id,
          name: userData.name || userData.preferred_username || '사용자',
          email: userData.email || '',
          avatar: userData.picture || userData.avatar || '',
          loginMethod: 'OAuth2',
          provider: 'oauth2'
        });
        
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        
      } catch (err) {
        console.error('콜백 처리 중 오류:', err);
        setError(`로그인 처리 중 오류가 발생했습니다: ${err.message}`);
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
      <div className="error-details">
        <p>{error || '알 수 없는 오류가 발생했습니다.'}</p>
        {error && (error.includes('BFF 서버') || error.includes('CORS')) && (
          <div className="error-help">
            <h4>해결 방법:</h4>
            <ul>
              <li>BFF 서버(포트 9091)가 실행 중인지 확인하세요</li>
              <li>BFF 서버에서 CORS 설정이 올바른지 확인하세요</li>
              <li>OAuth2 클라이언트 설정에서 client_secret이 올바른지 확인하세요</li>
              <li>Auth Server(포트 9090)와 BFF 서버 간의 연결을 확인하세요</li>
              <li>브라우저 개발자 도구의 Network 탭에서 요청 상태를 확인하세요</li>
            </ul>
          </div>
        )}
      </div>
      <div className="callback-actions">
        <button 
          className="callback-retry-btn"
          onClick={() => navigate('/login')}
        >
          다시 로그인하기
        </button>
        <button 
          className="callback-home-btn"
          onClick={() => navigate('/')}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default Callback;