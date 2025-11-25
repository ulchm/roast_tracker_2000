/**
 * Main App component for Roast Tracker 2000
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Upload from './components/Upload';
import SearchFilters from './components/SearchFilters';
import RoastList from './components/RoastList';
import RoastDetail from './components/RoastDetail';
import Login from './components/Login';
import { roastAPI } from './api';
import './App.css';
import { FaCoffee, FaList, FaUpload, FaSignOutAlt } from 'react-icons/fa';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roasts, setRoasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    if (isAuthenticated && (location.pathname === '/' || location.pathname.startsWith('/roast/'))) {
      loadRoasts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isAuthenticated, location.pathname]);

  const loadRoasts = async () => {
    try {
      setLoading(true);
      const response = await roastAPI.getAll(filters);
      setRoasts(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to load roasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoast = (roastId) => {
    navigate(`/roast/${roastId}`);
  };

  const handleBackToList = () => {
    navigate('/');
  };

  const handleUploadSuccess = () => {
    navigate('/');
    loadRoasts(); // Refresh list
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    navigate('/');
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection} onClick={() => navigate('/')} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && navigate('/')}>
            <FaCoffee style={styles.logoIcon} />
            <h1 style={styles.title}>Roast Tracker 2000</h1>
          </div>
          <nav style={styles.nav}>
            <button
              onClick={() => navigate('/')}
              style={{
                ...styles.navButton,
                ...(isActive('/') ? styles.navButtonActive : {}),
              }}
            >
              <FaList style={styles.buttonIcon} />
              <span>Browse</span>
            </button>
            <button
              onClick={() => navigate('/upload')}
              style={{
                ...styles.navButton,
                ...(isActive('/upload') ? styles.navButtonActive : {}),
              }}
            >
              <FaUpload style={styles.buttonIcon} />
              <span>Upload</span>
            </button>
            <button
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              <FaSignOutAlt style={styles.buttonIcon} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SearchFilters onFilterChange={handleFilterChange} />
                <RoastList
                  roasts={roasts}
                  onSelectRoast={handleSelectRoast}
                  loading={loading}
                />
              </>
            }
          />
          <Route
            path="/roast/:id"
            element={<RoastDetail onBack={handleBackToList} />}
          />
          <Route
            path="/upload"
            element={<Upload onUploadSuccess={handleUploadSuccess} />}
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f8f8f8 0%, #e8e8e8 100%)',
    width: '100%',
    overflowX: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #212121 0%, #424242 50%, #616161 100%)',
    color: 'white',
    padding: '20px 0',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
    width: '100%',
    boxSizing: 'border-box',
  },
  headerContent: {
    width: '100%',
    padding: '0 clamp(20px, 3vw, 60px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    boxSizing: 'border-box',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  logoIcon: {
    fontSize: '36px',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
    animation: 'rotate 20s linear infinite',
    color: 'white',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    color: 'white',
    textShadow: '2px 2px 6px rgba(0, 0, 0, 0.4)',
  },
  nav: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  navButtonActive: {
    background: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-2px)',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    color: 'white',
    border: '2px solid rgba(244, 67, 54, 0.4)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
  },
  buttonIcon: {
    fontSize: '16px',
  },
  main: {
    width: '100%',
    padding: '32px clamp(20px, 3vw, 60px)',
    boxSizing: 'border-box',
  },
};

export default App;
