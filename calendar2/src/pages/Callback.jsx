// src/pages/Callback.jsx - FIXED VERSION
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../services/config';

function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false); // ← KEY FIX: Prevent double execution

  useEffect(() => {
    const handleCallback = async () => {
      // ← FIX 1: Chỉ chạy 1 lần duy nhất
      if (hasProcessed.current) {
        console.log('⏭️ Already processed, skipping...');
        return;
      }
      hasProcessed.current = true;

      console.log('=== Callback Handler Started ===');
      
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');

      console.log('URL:', window.location.href);
      console.log('Authorization code received:', code);

      // Check if already have tokens
      const existingTokens = localStorage.getItem('auth_tokens');
      if (existingTokens) {
        console.log('✅ Already have tokens, redirecting to calendar...');
        navigate('/calendar', { replace: true });
        return;
      }

      if (errorParam) {
        console.error('OAuth error:', errorParam);
        setError(`OAuth error: ${errorParam}`);
        setIsProcessing(false);
        return;
      }

      if (!code) {
        console.error('No authorization code found');
        setError('No authorization code received');
        setIsProcessing(false);
        return;
      }

      // ← FIX 2: Check if this code was already used
      const usedCodes = sessionStorage.getItem('used_codes') || '[]';
      const usedCodesArray = JSON.parse(usedCodes);
      
      if (usedCodesArray.includes(code)) {
        console.log('⚠️ This code was already used, redirecting...');
        navigate('/calendar', { replace: true });
        return;
      }

      try {
        const endpoint = `${CONFIG.API_BASE_URL}/auth/token`;
        console.log('🌐 Calling endpoint:', endpoint);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            redirectUri: CONFIG.REDIRECT_URI,
          }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend error response:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          throw new Error(
            errorData.message || 
            errorData.error || 
            `Authentication failed (${response.status})`
          );
        }

        const data = await response.json();
        console.log('✅ Token exchange successful');
        console.log('📦 Tokens received:', data);
        console.log('🔑 ID Token:', data.id_token);
        console.log('🎫 Access Token:', data.access_token);
        console.log('🔄 Refresh Token:', data.refresh_token);
        console.log('⏰ Expires in:', data.expires_in, 'seconds');

        // ← FIX 3: Mark code as used
        usedCodesArray.push(code);
        sessionStorage.setItem('used_codes', JSON.stringify(usedCodesArray));

        // Store tokens
        localStorage.setItem('auth_tokens', JSON.stringify(data));
        
        // ← FIX 4: Clear URL
        window.history.replaceState({}, document.title, '/callback');
        
        console.log('🎉 Authentication complete, redirecting to calendar...');
        navigate('/calendar', { replace: true });

      } catch (err) {
        console.error('❌ Token exchange error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, []); // Empty dependency array - only run once

  if (isProcessing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner"></div>
        <p>Completing authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '30px',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          backgroundColor: '#f8d7da',
          color: '#721c24'
        }}>
          <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            ❌ Authentication Error
          </h2>
          
          <div style={{
            backgroundColor: '#f5c6cb',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>⚠️ The login session has expired.</p>
          </div>

          <p style={{ marginBottom: '10px' }}>This usually happens when:</p>
          <ul style={{ marginBottom: '20px' }}>
            <li>You refreshed the page during login</li>
            <li>The authorization code was used already</li>
            <li>The code expired (10 min limit)</li>
          </ul>

          <p style={{ 
            padding: '10px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7',
            borderRadius: '5px',
            color: '#856404'
          }}>
            💡 <strong>Quick Tip:</strong><br/>
            Don't refresh the page during login process. If you see this error, simply go back to login and try again.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => navigate('/login', { replace: true })}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ← Back to Login
            </button>
            
            <button
              onClick={() => navigate('/calendar', { replace: true })}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Continue to Calendar →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default Callback;