import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import './App.css';

function AppContent() {
  const { user, isLoading, authError, clearError } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  // 인증 에러가 있는 경우 에러 메시지 표시
  if (authError) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>로그인 실패</h2>
        <p className="error-message">{authError}</p>
        <div className="error-actions">
          <button 
            className="retry-btn"
            onClick={() => window.location.href = '/login'}
          >
            다시 로그인하기
          </button>
          <button 
            className="clear-btn"
            onClick={clearError}
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : 
            <LoginForm />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            user ? <Dashboard /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
