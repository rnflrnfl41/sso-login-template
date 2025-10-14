import { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, isTokenExpired, refreshAccessToken, revokeToken } from '../utils/oauth2Auth';

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

  useEffect(() => {
    // 페이지 로드 시 메모리 토큰 확인
    const checkAuthStatus = async () => {
      const token = getAccessToken();
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // 토큰 만료 확인
          if (isTokenExpired()) {
            // 만료된 경우 refresh 시도
            try {
              await refreshAccessToken();
              setUser(JSON.parse(savedUser));
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              // refresh 실패 시 로그아웃 처리
              localStorage.removeItem('user');
              window.oauth2Tokens = null;
            }
          } else {
            // 토큰이 유효하면 사용자 정보 설정
            setUser(JSON.parse(savedUser));
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // 오류 시 정리
          localStorage.removeItem('user');
          window.oauth2Tokens = null;
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuthStatus();
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

  // API 요청 시 자동으로 토큰 포함
  const apiRequest = async (url, options = {}) => {
    const token = getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }
    
    // 토큰 만료 확인 및 자동 갱신
    if (isTokenExpired()) {
      try {
        await refreshAccessToken();
      } catch (error) {
        // refresh 실패 시 로그아웃
        logout();
        throw new Error('Token refresh failed');
      }
    }
    
    const headers = {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    return fetch(url, {
      ...options,
      headers
    });
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    apiRequest,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
