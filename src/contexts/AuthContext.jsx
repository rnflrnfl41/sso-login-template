import { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, isTokenExpired, refreshAccessToken } from '../utils/googleAuth';

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

  const login = async (credentials) => {
    setIsLoading(true);
    
    try {
      // 서버에 로그인 요청
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { user, access_token, refresh_token } = await response.json();
      
      // 서버에서 받은 정보 저장
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // 서버에 로그아웃 요청 (선택사항)
      const token = getAccessToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
      // 서버 요청이 실패해도 클라이언트에서는 로그아웃 처리
    } finally {
      // 클라이언트 상태 정리
      setUser(null);
      localStorage.removeItem('user');
      window.oauth2Tokens = null; // 메모리 토큰 정리
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
