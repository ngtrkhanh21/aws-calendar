// src/pages/Login.jsx
import { CONFIG } from '../services/config';

function Login() {
  const handleGoogleLogin = () => {
    console.log('🔐 Initiating Google login...');
    console.log('OAuth URL:', CONFIG.OAUTH_URL);
    console.log('Client ID:', CONFIG.COGNITO_CLIENT_ID);
    console.log('Redirect URI:', CONFIG.REDIRECT_URI);
    
    // Redirect to Cognito OAuth page
    window.location.href = CONFIG.OAUTH_URL;
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1>Calendar App Login</h1>
      <button 
        onClick={handleGoogleLogin}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Continue with Google
      </button>
    </div>
  );
}

export default Login;