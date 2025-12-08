import axios from 'axios';

// ⚠️ QUAN TRỌNG: Thêm tên stage (ví dụ /prod hoặc /dev) vào cuối URL
// Kiểm tra trong AWS Console > API Gateway > Stages để biết chính xác
const API_URL_EVENT = import.meta.env.VITE_API_URL_1 || 'https://zpq60ia453.execute-api.ap-southeast-1.amazonaws.com';
const API_URL_TODO = import.meta.env.VITE_API_URL_2 || 'https://wb2s9crxy5.execute-api.ap-southeast-1.amazonaws.com';

const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config) => {
      // 1. Lấy chuỗi JSON từ đúng key 'auth_tokens' như trong ảnh bạn gửi
      const storedAuthData = localStorage.getItem('auth_tokens'); 
      
      let token = null;

      if (storedAuthData) {
        try {
          // 2. Vì dữ liệu lưu dạng JSON string, phải parse ra object
          const parsedData = JSON.parse(storedAuthData);
          
          // 3. Lấy idToken (thường dùng cho Cognito Authorizer). 
          // Nếu backend yêu cầu accessToken thì đổi thành parsedData.accessToken
          token = parsedData.idToken; 
        } catch (error) {
          console.error("Lỗi khi parse auth_tokens từ localStorage:", error);
        }
      }

      if (token) {
        // config.headers.Authorization = `Bearer ${token}`; // Dùng dòng này nếu token chuẩn
        
        // Đôi khi token bị ngoặc kép thừa (tùy cách lưu), code này để an toàn:
        config.headers.Authorization = `Bearer ${token.replace(/"/g, '')}`;
      } else {
        console.warn(`No token found (or parse failed) for request to ${baseURL}`);
        // Tùy chọn: Redirect về login nếu không có token
        // window.location.href = '/login'; 
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => Promise.reject(error)
  );

  return instance;
};

export const apiEvent = createApiInstance(API_URL_EVENT);
export const apiTodo = createApiInstance(API_URL_TODO);

// ⚠️ Khuyên dùng: Bỏ dòng export default để tránh nhầm lẫn khi import
// export default apiEvent;