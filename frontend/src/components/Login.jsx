/**
 * Login component
 */
import { useState } from 'react';
import { FaCoffee, FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.logoSection}>
          <FaCoffee style={styles.logoIcon} />
          <div>
            <h1 style={styles.title}>Roast Tracker</h1>
            <p style={styles.subtitle}>Coffee Roast Management System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <FaUser style={styles.labelIcon} />
              Username
            </label>
            <div style={styles.inputWrapper}>
              <FaUser style={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <FaLock style={styles.labelIcon} />
              Password
            </label>
            <div style={styles.inputWrapper}>
              <FaLock style={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            <FaSignInAlt style={styles.buttonIcon} />
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.defaultCreds}>
          <p style={styles.defaultCredsTitle}>Default Credentials:</p>
          <p>Username: <strong>admin</strong></p>
          <p>Password: <strong>roastmaster</strong></p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #616161 0%, #424242 50%, #212121 100%)',
    padding: 'clamp(20px, 3vw, 40px)',
    position: 'relative',
    overflow: 'hidden',
  },
  loginBox: {
    backgroundColor: 'white',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    padding: 'clamp(32px, 5vw, 48px)',
    width: '100%',
    maxWidth: 'min(480px, 90vw)',
    position: 'relative',
    border: '2px solid rgba(255, 255, 255, 0.3)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '2px solid #F0F0F0',
  },
  logoIcon: {
    fontSize: '56px',
    color: '#212121',
    animation: 'rotate 20s linear infinite',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#212121',
    margin: 0,
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#616161',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#212121',
  },
  labelIcon: {
    color: '#212121',
    fontSize: '14px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#616161',
    fontSize: '16px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    padding: '16px 20px 16px 48px',
    fontSize: '15px',
    border: '2px solid #E0E0E0',
    borderRadius: '12px',
    backgroundColor: 'white',
    color: '#212121',
    transition: 'all 0.3s ease',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  error: {
    padding: '14px 18px',
    background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
    color: '#C62828',
    borderRadius: '10px',
    fontSize: '14px',
    border: '2px solid #EF9A9A',
    fontWeight: '500',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '18px 32px',
    background: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '17px',
    fontWeight: '700',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
    transition: 'all 0.3s ease',
    marginTop: '8px',
  },
  buttonIcon: {
    fontSize: '18px',
  },
  buttonDisabled: {
    background: 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)',
    color: '#9E9E9E',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  defaultCreds: {
    marginTop: '28px',
    padding: '20px',
    background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
    borderRadius: '12px',
    border: '2px solid #90CAF9',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  defaultCredsTitle: {
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: '10px',
    marginTop: 0,
  },
};
