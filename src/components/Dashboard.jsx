import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>대시보드</h1>
          <div className="user-info">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="사용자 아바타" />
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
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>환영합니다, {user.name || '사용자'}님!</h2>
          <p>SSO 로그인이 성공적으로 완료되었습니다.</p>
          <div className="time-display">
            현재 시간: {currentTime.toLocaleString('ko-KR')}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <h3>사용자 정보</h3>
              <p>이메일: {user.email}</p>
              <p>로그인 방식: {user.loginMethod || '일반 로그인'}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔐</div>
            <div className="stat-content">
              <h3>보안 상태</h3>
              <p>인증 완료</p>
              <p>세션 활성</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>시스템 상태</h3>
              <p>정상 작동</p>
              <p>연결 안정</p>
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
