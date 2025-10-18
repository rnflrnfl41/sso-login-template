import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, checkAuthStatus, revokeToken } from '../utils/oauth2Auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // 페이지 로드 시 URL 파라미터와 BFF 인증 상태 확인
    const checkAuthStatusOnLoad = async () => {
      try {
        // URL 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const loginStatus = urlParams.get('login');
        const error = urlParams.get('error');
        
        console.log('URL 파라미터:', { loginStatus, error });
        
        // BFF에서 에러가 발생한 경우
        if (loginStatus === 'failed' && error) {
          console.error('BFF 로그인 실패:', error);
          setUser(null);
          setAuthError(decodeURIComponent(error)); // URL 디코딩
          localStorage.removeItem('user');
          // URL 파라미터 제거
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        
        // BFF에서 리다이렉트된 경우 (login=success 또는 login=already)
        if (loginStatus === 'success' || loginStatus === 'already') {
          console.log('BFF 리다이렉트 플로우 감지:', loginStatus);
          
          // BFF에서 사용자 정보 가져오기
          const userData = await getCurrentUser();
          if (userData) {
            setUser(userData);
            setAuthError(null); // 성공 시 에러 상태 초기화
            localStorage.setItem('user', JSON.stringify(userData));
            
            // URL 파라미터 제거 (새로고침 시 중복 처리 방지)
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.error('BFF에서 사용자 정보를 가져올 수 없습니다');
            setUser(null);
            setAuthError('사용자 정보를 가져올 수 없습니다.');
            localStorage.removeItem('user');
          }
        } else {
          // 일반적인 경우: BFF에서 인증 상태 확인
          const isAuthenticated = await checkAuthStatus();
          
          if (isAuthenticated) {
            // BFF에서 사용자 정보 가져오기
            const userData = await getCurrentUser();
            if (userData) {
              setUser(userData);
              setAuthError(null); // 성공 시 에러 상태 초기화
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } else {
            // 인증되지 않은 경우 로컬 상태 정리
            setUser(null);
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // 오류 시 정리
        setUser(null);
        setAuthError(error.message || '인증 확인 중 오류가 발생했습니다.');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatusOnLoad();
  }, []);

  // OAuth2 로그인은 initiateOAuth2Login()으로 처리되므로 별도 login 함수 불필요
  const login = async (userData) => {
    setIsLoading(true);
    try {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // OAuth2 토큰 취소
      await revokeToken();
    } catch (error) {
      console.error('Token revocation failed:', error);
      // 토큰 취소 실패해도 클라이언트에서는 로그아웃 처리
    } finally {
      // 클라이언트 상태 정리
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  // API 요청 시 BFF를 통해 처리 (쿠키로 세션 관리)
  const apiRequest = async (url, options = {}) => {
    // BFF를 통한 API 요청은 쿠키로 세션 관리
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include' // 쿠키로 세션 관리
    });
  };

  const value = {
    user,
    isLoading,
    authError,
    login,
    logout,
    apiRequest,
    isAuthenticated: !!user,
    clearError: () => setAuthError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
