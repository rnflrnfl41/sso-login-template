// OAuth2 토큰 관리 유틸리티

// Base64URL 인코딩 헬퍼 함수
const base64UrlEncode = (array) => {
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// PKCE용 code_verifier 생성
const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
};

// PKCE용 code_challenge 생성
const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const generateState = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
};

// BFF 서버의 /login 엔드포인트로 리다이렉트
export const initiateOAuth2Login = async () => {
  // BFF 서버가 OAuth2 Authorization Server와의 모든 상호작용을 처리
  // SPA는 단순히 BFF의 로그인 엔드포인트로 리다이렉트
  const bffLoginUrl = 'http://localhost:9091/api/auth/login';
  window.location.href = bffLoginUrl;
};

// BFF에서 사용자 정보 가져오기 (세션 확인)
export const getCurrentUser = async () => {
  try {
    const response = await fetch('http://localhost:9091/api/auth/user/me', {
      method: 'GET',
      credentials: 'include', // 쿠키로 세션 관리
      mode: 'cors', // CORS 모드 명시적 설정
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // 인증되지 않은 경우
        console.log('사용자가 인증되지 않음 (401)');
        return null;
      }
      
      if (response.status === 500) {
        console.error('BFF 서버 내부 오류 (500)');
        throw new Error('BFF 서버 내부 오류가 발생했습니다. OAuth2 설정을 확인해주세요.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      console.error('사용자 정보 요청 실패:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const userData = await response.json();
    console.log('사용자 정보 가져오기 성공:', userData);
    
    // 서버에서 user 객체를 직접 반환하는 경우와 래핑된 응답을 모두 처리
    if (userData.user) {
      return userData.user; // { user: {...} } 형태인 경우
    } else if (userData.sub || userData.id) {
      return userData; // 사용자 정보가 직접 반환된 경우
    } else {
      console.warn('예상치 못한 사용자 데이터 형식:', userData);
      return userData;
    }
  } catch (error) {
    console.error('사용자 정보 가져오기 실패:', error);
    
    // CORS 에러인 경우 특별한 처리
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('BFF 서버에 연결할 수 없습니다. CORS 설정을 확인하거나 서버가 실행 중인지 확인해주세요.');
    }
    
    throw error; // 에러를 다시 던져서 상위에서 처리할 수 있도록 함
  }
};

// BFF에서 로그인 상태 확인
export const checkAuthStatus = async () => {
  try {
    const response = await fetch('http://localhost:9091/api/auth/status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 500) {
        console.error('BFF 서버 내부 오류 (500)');
        throw new Error('BFF 서버 내부 오류가 발생했습니다.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const isAuthenticated = data.authenticated === true;
    
    return isAuthenticated;
  } catch (error) {
    console.error('인증 상태 확인 실패:', error);
    
    // CORS 에러인 경우 특별한 처리
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('BFF 서버에 연결할 수 없습니다. CORS 설정을 확인하거나 서버가 실행 중인지 확인해주세요.');
    }
    
    throw error; // 에러를 다시 던져서 상위에서 처리할 수 있도록 함
  }
};

// OAuth2 로그아웃 (서버에서 세션 관리)
export const revokeToken = async () => {
  try {
    // 서버에 로그아웃 요청 (쿠키로 세션 관리)
    await fetch('http://localhost:9091/api/auth/logout', {
      method: 'POST',
      mode: 'cors', // CORS 모드 명시적 설정
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    
    return { success: true };
  } catch (error) {
    console.error('Logout failed:', error);
    return { success: false, error: error.message };
  }
};