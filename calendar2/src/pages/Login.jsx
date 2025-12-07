// src/pages/Login.jsx - CHỈ GOOGLE LOGIN
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../services/config';

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check nếu đã login
    const idToken = localStorage.getItem('idToken');
    if (idToken) {
      navigate('/calendar');
    }
  }, [navigate]);

  const loginWithGoogle = () => {
    const params = new URLSearchParams({
      client_id: CONFIG.clientId,
      response_type: 'id_token token',
      scope: 'email openid profile',
      redirect_uri: CONFIG.redirectUri,
      identity_provider: 'Google'
    });
    
    const loginUrl = `${CONFIG.cognitoDomain}/oauth2/authorize?${params}`;
    console.log(' Redirecting to Google login:', loginUrl);
    window.location.href = loginUrl;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo/Icon */}
        <div style={styles.iconContainer}>
          <div style={styles.icon}>📅</div>
        </div>

        {/* Title */}
        <h1 style={styles.title}>Welcome to Calendar App</h1>
        <p style={styles.subtitle}>Sign in with your Google account to get started</p>

        {/* Google Login Button */}
        <button onClick={loginWithGoogle} style={styles.googleButton}>
          <svg width="20" height="20" viewBox="0 0 18 18" style={{marginRight: '12px'}}>
            <path fill="#fff" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#fff" d="M9.003 18c2.43 0 4.467-.806 5.956-2.183l-2.909-2.259c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"/>
            <path fill="#fff" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.55 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#fff" d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Info */}
        <div style={styles.infoBox}>
          <p style={styles.infoTitle}> Secure Authentication</p>
          <p style={styles.infoText}>
            Your data is protected with AWS Cognito and Google's secure authentication
          </p>
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    padding: '50px 40px',
    textAlign: 'center',
    animation: 'slideUp 0.5s ease-out'
  },
  iconContainer: {
    marginBottom: '30px'
  },
  icon: {
    fontSize: '64px',
    display: 'inline-block',
    animation: 'bounce 2s infinite'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 15px 0'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 40px 0',
    lineHeight: '1.5'
  },
  googleButton: {
    width: '100%',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(66, 133, 244, 0.4)',
    marginBottom: '30px'
  },
  infoBox: {
    padding: '20px',
    backgroundColor: '#f0f4ff',
    borderRadius: '12px',
    marginBottom: '30px'
  },
  infoTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px 0'
  },
  infoText: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
    lineHeight: '1.6'
  },
  features: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  featureIcon: {
    width: '24px',
    height: '24px',
    backgroundColor: '#4caf50',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  featureText: {
    fontSize: '14px',
    color: '#555'
  }
};

// CSS animations
const styleSheet = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(66, 133, 244, 0.5) !important;
  }
  
  button:active {
    transform: translateY(0);
  }
  
  @media (max-width: 480px) {
    .card {
      padding: 40px 30px !important;
    }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = styleSheet;
  document.head.appendChild(style);
}

export default Login;