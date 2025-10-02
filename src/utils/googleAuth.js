// 구글 OAuth 2.0 클라이언트 ID (실제 사용시 환경변수로 관리)
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';

// 구글 OAuth 스코프
const GOOGLE_SCOPES = 'openid email profile';

// 구글 OAuth 인증 URL 생성
export const getGoogleAuthUrl = () => {
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  const state = Math.random().toString(36).substring(2, 15);
  
  // state를 localStorage에 저장 (CSRF 보호)
  localStorage.setItem('google_oauth_state', state);
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    state: state,
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// 구글 OAuth 콜백 처리
export const handleGoogleCallback = async (code, state) => {
  const storedState = localStorage.getItem('google_oauth_state');
  
  // CSRF 보호를 위한 state 검증
  if (state !== storedState) {
    throw new Error('Invalid state parameter');
  }
  
  // state 사용 후 제거
  localStorage.removeItem('google_oauth_state');
  
  try {
    // 실제 구현에서는 서버로 토큰 교환 요청을 보내야 함
    // 여기서는 데모용으로 가짜 사용자 정보를 반환
    const userInfo = await exchangeCodeForToken(code);
    return userInfo;
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw error;
  }
};

// 코드를 토큰으로 교환 (실제 구현에서는 서버에서 처리)
const exchangeCodeForToken = async (code) => {
  // 실제 구현에서는 서버 API를 호출해야 함
  // 여기서는 데모용으로 가짜 사용자 정보 반환
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'google_' + Math.random().toString(36).substring(2, 15),
        name: '구글 사용자',
        email: 'user@gmail.com',
        avatar: 'https://via.placeholder.com/150/4285F4/FFFFFF?text=G',
        loginMethod: 'Google',
        provider: 'google'
      });
    }, 1000);
  });
};

// 구글 로그인 버튼 클릭 핸들러
export const initiateGoogleLogin = () => {
  const authUrl = getGoogleAuthUrl();
  window.location.href = authUrl;
};

// URL에서 OAuth 코드와 state 추출
export const extractOAuthParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  
  return { code, state, error };
};
