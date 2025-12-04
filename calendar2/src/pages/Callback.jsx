import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Calendar from './Calendar';

// Import config
import { CONFIG } from '../services/config';

export default function Callback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    console.log('==== Callback Handler Started ====');
    
    try {
      // Get authorization code from URL
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const errorParam = params.get('error');
      
      console.log('URL:', window.location.href);
      console.log('Authorization code received:', code ? code.substring(0, 20) + '...' : 'MISSING');

      // Check for OAuth errors
      if (errorParam) {
        const errorDescription = params.get('error_description') || 'OAuth error occurred';
        throw new Error(`OAuth Error: ${errorParam} - ${errorDescription}`);
      }

      // Validate authorization code
      if (!code) {
        throw new Error('No authorization code found in URL. Please try logging in again.');
      }

      setStatus('Exchanging code for tokens...');

      // Exchange code for tokens via backend
      console.log('Calling backend:', `${CONFIG.apiGatewayUrl}/auth/token`);
      
      const response = await fetch(`${CONFIG.apiGatewayUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirectUri: CONFIG.redirectUri
        })
      });

      console.log('Backend response status:', response.status);
      console.log('Backend response headers:', [...response.headers.entries()]);

      // Get response text first for debugging
      const responseText = await response.text();
      console.log('Backend response text:', responseText);

      // Parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from backend');
      }

      console.log('Parsed result:', result);
      console.log('Result type:', typeof result);
      console.log('Result keys:', Object.keys(result));

      // Check if response is successful
      if (!response.ok) {
        const errorMsg = result.message || result.error || 'Token exchange failed';
        throw new Error(errorMsg);
      }

      // Validate token response structure
      if (!result || typeof result !== 'object') {
        console.error('Invalid result structure:', result);
        throw new Error('Invalid token response from backend');
      }

      // Extract tokens - support both camelCase and snake_case
      const tokens = {
        accessToken: result.accessToken || result.access_token,
        idToken: result.idToken || result.id_token,
        refreshToken: result.refreshToken || result.refresh_token,
        expiresIn: result.expiresIn || result.expires_in,
        tokenType: result.tokenType || result.token_type
      };

      console.log(' Tokens extracted:', {
        hasAccessToken: !!tokens.accessToken,
        hasIdToken: !!tokens.idToken,
        hasRefreshToken: !!tokens.refreshToken
      });

      // Validate required tokens
      if (!tokens.accessToken || !tokens.idToken) {
        console.error('Missing required tokens:', tokens);
        throw new Error('Missing required tokens in response');
      }

      // Store tokens in localStorage
      console.log('Storing tokens in localStorage...');
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('idToken', tokens.idToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }

      // Decode ID token to get user info (optional)
      try {
        const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
        console.log('User info:', {
          email: payload.email,
          name: payload.name,
          sub: payload.sub
        });
        localStorage.setItem('userEmail', payload.email || '');
        localStorage.setItem('userName', payload.name || '');
      } catch (decodeError) {
        console.warn('Failed to decode ID token:', decodeError);
      }

      console.log(' Login successful! Redirecting...');
      setStatus('Login successful! Redirecting...');

      // Redirect to home page
      setTimeout(() => {
        navigate('/Calendar');
      }, 1000);

    } catch (error) {
      console.error('  Token Exchange Error ');
      console.error(' Error:', error);
      console.error(' Error message:', error.message);
      console.error(' Error stack:', error.stack);
      
      setError(error.message);
      setStatus('Authentication failed');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {error ? (
          <>
            <div style={{
              fontSize: '48px',
              textAlign: 'center',
              marginBottom: '20px',
              color: '#dc3545'
            }}>
              ✕
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '20px',
              color: '#333'
            }}>
              Authentication Error
            </h2>
            <div style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              padding: '15px',
              marginBottom: '20px',
              color: '#c33'
            }}>
              {error}
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ← Back to Login
            </button>
          </>
        ) : (
          <>
            <div style={{
              fontSize: '48px',
              textAlign: 'center',
              marginBottom: '20px',
              animation: 'spin 1s linear infinite'
            }}>
              ⟳
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '10px',
              color: '#333'
            }}>
              Authenticating
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#666',
              marginBottom: '20px'
            }}>
              {status}
            </p>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#e0e0e0',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: '50%',
                backgroundColor: '#007bff',
                animation: 'progress 1.5s ease-in-out infinite'
              }} />
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}