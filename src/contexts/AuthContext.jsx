import { createContext, useContext, useState, useEffect } from 'react';
import { extractOAuthParams, handleGoogleCallback } from '../utils/googleAuth';

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
    // 페이지 로드 시 저장된 사용자 정보 확인
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // URL에서 OAuth 콜백 파라미터 확인
    const { code, state, error } = extractOAuthParams();
    
    if (error) {
      console.error('OAuth error:', error);
      setIsLoading(false);
      return;
    }
    
    if (code && state) {
      handleGoogleCallback(code, state)
        .then((userInfo) => {
          setUser(userInfo);
          localStorage.setItem('user', JSON.stringify(userInfo));
          // URL에서 OAuth 파라미터 제거
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((error) => {
          console.error('Google login failed:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    
    try {
      // 실제 구현에서는 서버 API를 호출해야 함
      // 여기서는 데모용으로 가짜 로그인 처리
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userInfo = {
        id: 'user_' + Math.random().toString(36).substring(2, 15),
        name: '일반 사용자',
        username: credentials.username,
        email: credentials.username + '@example.com', // 아이디를 기반으로 이메일 생성
        avatar: 'https://via.placeholder.com/150/667eea/FFFFFF?text=U',
        loginMethod: 'Username',
        provider: 'username'
      };
      
      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
