Tổng quan (Project Overview)
AuroraTime là ứng dụng web giúp cá nhân hóa việc quản lý thời gian bằng cách kết hợp lịch sự kiện và danh sách công việc vào một giao diện duy nhất.
Thay vì phải sử dụng nhiều ứng dụng rời rạc, dự án này cung cấp giải pháp "All-in-one" để bạn lập kế hoạch, theo dõi deadline và nhận thông báo nhắc nhở tự động. Hệ thống được xây dựng trên nền tảng AWS Serverless, đảm bảo khả năng mở rộng, chi phí thấp và hoạt động ổn định 24/7.
Bước 2: Setup Frontend (React Dashboard)
Thư mục này chứa giao diện web. Bạn cần cài đặt các gói phụ thuộc (dependencies) để chạy được web dưới local.
Clone repo dự án về máy sau đó chạy lệnh npm install để tải các thư viện cần thiết.
Lệnh chạy thử: npm run dev (Mở web tại localhost để xem giao diện).
Lệnh đóng gói: npm run build (Tạo file tĩnh để upload lên AWS S3).
