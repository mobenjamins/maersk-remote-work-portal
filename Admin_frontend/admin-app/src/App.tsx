import { useState, useEffect } from 'react';
import { initAuth, isAuthenticated, logout } from './services/api';
import type { User } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth from localStorage
    const savedUser = initAuth();
    if (savedUser && isAuthenticated()) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (loginUser: User) => {
    setUser(loginUser);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
