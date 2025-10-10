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

// OAuth2 Authorization Server로 리다이렉트 (PKCE 포함)
export const initiateOAuth2Login = async () => {
  const clientId = 'frontend-client';
  const redirectUri = `${window.location.origin}/callback`;
  const scope = 'openid profile email';
  const responseType = 'code';
  const state = generateState();
  
  // PKCE 파라미터 생성
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // code_verifier를 세션 스토리지에 저장 (콜백에서 사용)
  sessionStorage.setItem('oauth2_code_verifier', codeVerifier);
  
  // OAuth2 Authorization Server 엔드포인트로 리다이렉트
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: responseType,
    redirect_uri: redirectUri,
    scope: scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state // CSRF 보호
  });
  
  const authUrl = `http://localhost:9090/oauth2/authorize?${params.toString()}`;
  window.location.href = authUrl;
};

// Authorization Code를 JWT 토큰으로 교환 (PKCE 포함)
export const exchangeCodeForToken = async (code) => {
  try {
    // 세션 스토리지에서 code_verifier 가져오기
    const codeVerifier = sessionStorage.getItem('oauth2_code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }
    
    const response = await fetch('http://localhost:9090/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa('frontend-client:frontend-secret')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${window.location.origin}/callback`,
        code_verifier: codeVerifier // PKCE 파라미터 추가
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tokenData = await response.json();
    
    // code_verifier 사용 후 제거
    sessionStorage.removeItem('oauth2_code_verifier');
    
    // 토큰을 메모리에 저장 (권장 방식)
    // localStorage 대신 메모리 변수에 저장
    window.oauth2Tokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || 'Bearer'
    };
    
    return tokenData;
  } catch (error) {
    console.error('Token exchange failed:', error);
    throw error;
  }
};

// Refresh Token으로 새로운 Access Token 발급
export const refreshAccessToken = async () => {
  try {
    const tokens = window.oauth2Tokens;
    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch('http://localhost:9090/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa('frontend-client:frontend-secret')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tokenData = await response.json();
    
    // 새로운 토큰으로 업데이트
    window.oauth2Tokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || tokens.refresh_token, // 새로운 refresh_token이 없으면 기존 것 유지
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || 'Bearer'
    };
    
    return tokenData;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // refresh 실패 시 토큰 정리
    window.oauth2Tokens = null;
    throw error;
  }
};

// 현재 Access Token 가져오기
export const getAccessToken = () => {
  return window.oauth2Tokens?.access_token || null;
};

// 토큰이 만료되었는지 확인
export const isTokenExpired = () => {
  const tokens = window.oauth2Tokens;
  if (!tokens) return true;
  
  // 토큰 만료 시간 확인 (JWT 토큰의 경우)
  try {
    const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (error) {
    // JWT가 아닌 경우 expires_in으로 확인
    return false; // 서버에서 만료 시간 관리
  }
};

// OAuth2 로그인 버튼 클릭 핸들러 (기존 함수명 유지)
export const initiateGoogleLogin = async () => {
  await initiateOAuth2Login();
};

// URL에서 OAuth 코드와 에러 추출
export const extractOAuthParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  
  return { code, error };
};

// 콜백 페이지에서 사용할 핸들러
export const handleOAuth2Callback = async () => {
  const { code, error } = extractOAuthParams();
  
  if (code) {
    try {
      // Authorization Code를 받았으므로 JWT 토큰 요청
      const tokenData = await exchangeCodeForToken(code);
      console.log('로그인 성공:', tokenData);
      return { success: true, tokenData };
    } catch (error) {
      console.error('토큰 교환 실패:', error);
      return { success: false, error: error.message };
    }
  } else if (error) {
    // 로그인 실패 처리
    console.error('OAuth2 로그인 실패:', error);
    return { success: false, error: error };
  }
  
  return { success: false, error: 'No code or error found' };
};
