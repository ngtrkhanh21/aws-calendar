// src/services/config.js - FINAL CORRECTED VERSION
export const CONFIG = {
  // API Gateway endpoint
  API_BASE_URL: 'https://3igtxin245.execute-api.ap-southeast-1.amazonaws.com/prod',
  
  // Cognito Config (KHÔNG có https://)
  COGNITO_DOMAIN: 'ap-southeast-1tryyhpjm0.auth.ap-southeast-1.amazoncognito.com',
  COGNITO_CLIENT_ID: '5dct7sk93a0unassp7komfpidq',
  COGNITO_REGION: 'ap-southeast-1',
  REDIRECT_URI: 'http://localhost:5173/callback',
  
  // OAuth URLs
  get OAUTH_URL() {
    return `https://${this.COGNITO_DOMAIN}/oauth2/authorize?` +
           `client_id=${this.COGNITO_CLIENT_ID}&` +
           `response_type=code&` +
           `scope=email+openid+profile&` +
           `redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}`;
  },
  
  get LOGOUT_URL() {
    return `https://${this.COGNITO_DOMAIN}/logout?` +
           `client_id=${this.COGNITO_CLIENT_ID}&` +
           `logout_uri=${encodeURIComponent(window.location.origin)}`;
  }
};