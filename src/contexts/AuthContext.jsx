import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, revokeToken } from '../utils/oauth2Auth';

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
        
        // BFF에서 리다이렉트된 경우 URL 파라미터 제거 (새로고침 시 중복 처리 방지)
        if (loginStatus === 'success' || loginStatus === 'already') {
          console.log('BFF 리다이렉트 플로우 감지:', loginStatus);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // BFF에서 사용자 정보 가져오기 (인증 상태 확인 포함)
        const userData = await getCurrentUser();
        if (userData) {
          // localStorage에서 기존 로그인 시간 확인
          const storedUser = localStorage.getItem('user');
          const existingLoginTime = storedUser ? JSON.parse(storedUser).loginTime : null;
          
          // 로그인 시간 추가 (이미 있으면 유지, 없으면 현재 시간 저장)
          const userWithLoginTime = {
            ...userData,
            loginTime: existingLoginTime || userData.loginTime || new Date().toISOString()
          };
          setUser(userWithLoginTime);
          setAuthError(null); // 성공 시 에러 상태 초기화
          localStorage.setItem('user', JSON.stringify(userWithLoginTime));
        } else {
          // 인증되지 않은 경우 로컬 상태 정리
          setUser(null);
          localStorage.removeItem('user');
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
      console.log('Login successful:', userData);
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
      // 서버에 로그아웃 요청 (서버에서 세션 정리)
      const result = await revokeToken();
      
      if (result.success) {
        // 서버에서 로그아웃 성공 시에만 로컬 상태 정리
        console.log('서버 로그아웃 성공:', result.message);
        setUser(null);
        localStorage.removeItem('user');
        setAuthError(null);
      } else {
        // 서버 로그아웃 실패 시 로컬 상태 유지 (사용자 세션 유지)
        console.error('서버 로그아웃 실패:', result.error);
        setAuthError(result.error || '로그아웃에 실패했습니다. 다시 시도해주세요.');
        // 사용자 정보는 유지 (setUser, localStorage 제거하지 않음)
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // 네트워크 오류 등으로 서버 요청 자체가 실패한 경우
      // 로컬 상태는 유지하고 에러 메시지만 표시
      setAuthError(error.message || '로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
      // 사용자 정보는 유지 (setUser, localStorage 제거하지 않음)
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
