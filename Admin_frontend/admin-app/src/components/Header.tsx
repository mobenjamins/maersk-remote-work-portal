import { User } from '../types';
import '../styles/Header.css';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="brand-title">Admin Portal</h1>
          <p className="brand-subtitle">Global Mobility Management</p>
        </div>

        <div className="header-user">
          <span className="user-email">{user.email}</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
