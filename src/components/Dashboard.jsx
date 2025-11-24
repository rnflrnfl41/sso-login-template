import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [accessTimeRemaining, setAccessTimeRemaining] = useState(null);
  const [refreshTimeRemaining, setRefreshTimeRemaining] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 시간 계산 헬퍼 함수
  const calculateTimeRemaining = (expTime) => {
    const now = new Date().getTime();
    // expTime이 초 단위인지 밀리초 단위인지 확인
    // 일반적으로 Unix timestamp는 초 단위이므로 1000을 곱함
    const expirationTime = expTime > 1000000000000 
      ? expTime 
      : expTime * 1000;
    
    const remaining = expirationTime - now;
    
    if (remaining <= 0) {
      return { expired: true, text: '만료됨' };
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return {
      expired: false,
      hours,
      minutes,
      seconds,
      text: hours > 0 
        ? `${hours}시간 ${minutes}분 ${seconds}초`
        : minutes > 0
        ? `${minutes}분 ${seconds}초`
        : `${seconds}초`
    };
  };

  // AccessToken 만료 시간 계산
  useEffect(() => {
    if (!user?.accessExp) {
      setAccessTimeRemaining(null);
      return;
    }

    const updateAccessTime = () => {
      setAccessTimeRemaining(calculateTimeRemaining(user.accessExp));
    };

    // 즉시 계산
    updateAccessTime();

    // 1초마다 업데이트
    const timer = setInterval(updateAccessTime, 1000);

    return () => clearInterval(timer);
  }, [user?.accessExp]);

  // RefreshToken 만료 시간 계산
  useEffect(() => {
    if (!user?.refreshExp) {
      setRefreshTimeRemaining(null);
      return;
    }

    const updateRefreshTime = () => {
      setRefreshTimeRemaining(calculateTimeRemaining(user.refreshExp));
    };

    // 즉시 계산
    updateRefreshTime();

    // 1초마다 업데이트
    const timer = setInterval(updateRefreshTime, 1000);

    return () => clearInterval(timer);
  }, [user?.refreshExp]);

  // 시간 포맷팅 함수
  const formatTime = (date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>대시보드</h1>
          <div className="header-right">
            <div className="time-display">
              <div className="time-value">{formatTime(currentTime)}</div>
            </div>
            <div className="user-info">
              <div className="user-avatar">
                {user.profileImg ? (
                  <img src={user.profileImg} alt="사용자 아바타" />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <div className="user-details">
                <span className="user-name">{user.name || '사용자'}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <button className="logout-button" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>환영합니다, {user.name || '사용자'}님!</h2>
          <p>SSO 로그인이 성공적으로 완료되었습니다.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <h3>기본 정보</h3>
              <p>이름: {user.name || '-'}</p>
              <p>이메일: {user.email || '-'}</p>
              <p>로그인 ID: {user.loginId || '-'}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🆔</div>
            <div className="stat-content">
              <h3>계정 정보</h3>
              <p>사용자 ID: {user.sub || '-'}</p>
              <p>전화번호: {user.phone || '-'}</p>
              <p>역할: {user.role || '-'}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔐</div>
            <div className="stat-content">
              <h3>보안 상태</h3>
              <p>인증 완료</p>
              <p>세션 활성</p>
              {accessTimeRemaining && (
                <p className={accessTimeRemaining.expired ? 'token-expired' : 'token-remaining'}>
                  AccessToken 만료까지: {accessTimeRemaining.text}
                </p>
              )}
              {refreshTimeRemaining && (
                <p className={refreshTimeRemaining.expired ? 'token-expired' : 'token-remaining'}>
                  RefreshToken 만료까지: {refreshTimeRemaining.text}
                </p>
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>활동 로그</h3>
              <p>로그인 시간: {new Date().toLocaleTimeString('ko-KR')}</p>
              <p>상태: 온라인</p>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-button primary">
            프로필 설정
          </button>
          <button className="action-button secondary">
            보안 설정
          </button>
          <button className="action-button secondary">
            도움말
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
