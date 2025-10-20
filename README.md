# SSO 로그인 템플릿

React와 Vite를 사용한 Single Sign-On (SSO) 로그인 템플릿 프로젝트입니다. OAuth2 인증을 통해 BFF(Backend for Frontend) 서버와 연동하여 안전한 사용자 인증을 제공합니다.

## 🚀 주요 기능

- **OAuth2 기반 SSO 인증**: BFF 서버를 통한 안전한 OAuth2 인증 플로우
- **React Context API**: 전역 상태 관리로 사용자 인증 상태 관리
- **반응형 UI**: 모던하고 직관적인 사용자 인터페이스
- **실시간 대시보드**: 로그인 후 사용자 정보 및 시스템 상태 표시
- **에러 처리**: 포괄적인 에러 핸들링 및 사용자 피드백
- **세션 관리**: 쿠키 기반 세션 관리로 보안성 강화

## 🛠️ 기술 스택

- **Frontend**: React 19.1.1, React Router DOM 7.9.3
- **Build Tool**: Vite 7.1.7
- **Styling**: CSS3 (모던 CSS 기능 활용)
- **Authentication**: OAuth2 + BFF 패턴
- **Development**: ESLint, React Hooks

## 📁 프로젝트 구조

```
sso-login-template/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx          # 대시보드 컴포넌트
│   │   ├── Dashboard.css          # 대시보드 스타일
│   │   ├── LoginForm.jsx          # 로그인 폼 컴포넌트
│   │   └── LoginForm.css          # 로그인 폼 스타일
│   ├── contexts/
│   │   └── AuthContext.jsx        # 인증 컨텍스트
│   ├── utils/
│   │   └── oauth2Auth.js          # OAuth2 인증 유틸리티
│   ├── App.jsx                    # 메인 앱 컴포넌트
│   ├── App.css                    # 앱 스타일
│   ├── main.jsx                   # 앱 진입점
│   └── index.css                  # 글로벌 스타일
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 시작하기

### 필수 조건

- Node.js (v16 이상)
- npm 또는 yarn
- BFF 서버 (포트 9091에서 실행 중)

### 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```

3. **브라우저에서 확인**
   - http://localhost:3000 에서 애플리케이션 확인

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 🔐 인증 플로우

### 1. 로그인 프로세스

1. 사용자가 "로그인하러가기" 버튼 클릭
2. BFF 서버(`http://localhost:9091/api/auth/login`)로 리다이렉트
3. BFF에서 OAuth2 Authorization Server와 상호작용
4. 인증 성공 시 사용자를 SPA로 리다이렉트
5. SPA에서 사용자 정보를 BFF에서 가져와 상태 업데이트

### 2. 인증 상태 관리

- **AuthContext**: 전역 인증 상태 관리
- **세션 확인**: 페이지 로드 시 BFF에서 인증 상태 확인
- **자동 로그인**: 유효한 세션이 있으면 자동으로 로그인 상태 유지

### 3. 로그아웃 프로세스

1. 사용자가 로그아웃 버튼 클릭
2. BFF 서버에 로그아웃 요청 전송
3. 서버에서 세션 무효화
4. 클라이언트 상태 정리

## 🌐 API 엔드포인트

프로젝트는 다음 BFF API 엔드포인트와 연동됩니다:

- `GET /api/auth/login` - OAuth2 로그인 시작
- `GET /api/auth/user/me` - 현재 사용자 정보 조회
- `GET /api/auth/status` - 인증 상태 확인
- `POST /api/auth/logout` - 로그아웃 처리

## 🎨 UI/UX 특징

### 로그인 페이지
- 깔끔하고 직관적인 로그인 인터페이스
- 로딩 상태 표시
- 에러 메시지 표시

### 대시보드
- 실시간 시계 표시
- 사용자 정보 카드
- 시스템 상태 모니터링
- 반응형 그리드 레이아웃

## 🔧 설정

### Vite 설정
- 포트: 3000
- 호스트: true (외부 접근 허용)

### CORS 설정
- BFF 서버와의 CORS 통신 지원
- 쿠키 기반 세션 관리

## 🐛 문제 해결

### 일반적인 문제

1. **BFF 서버 연결 실패**
   - BFF 서버가 포트 9091에서 실행 중인지 확인
   - CORS 설정 확인

2. **인증 실패**
   - OAuth2 서버 설정 확인
   - BFF 서버 로그 확인

3. **빌드 오류**
   - Node.js 버전 확인 (v16 이상)
   - 의존성 재설치: `rm -rf node_modules && npm install`

## 📝 개발 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 코드 린팅
npm run lint
```

## 🤝 기여하기

1. 프로젝트 포크
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**참고**: 이 프로젝트는 BFF 서버와 함께 작동하도록 설계되었습니다. BFF 서버가 실행 중이어야 정상적으로 작동합니다.