// Script để khởi động server với biến môi trường được đặt trực tiếp
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Đường dẫn đến file .env
const envPath = path.resolve(__dirname, '.env');
console.log(`Looking for .env file at: ${envPath}`);

// Object chứa biến môi trường mặc định
const defaultEnv = {
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USERNAME: 'root', // Thay đổi thành tên người dùng MySQL của bạn
  DB_PASSWORD: '', // Thay đổi thành mật khẩu MySQL của bạn
  DB_NAME: 'food_delivery',
  PORT: '4000',
  NODE_ENV: 'development',
  CORS_ORIGIN: '*',
};

// Đọc biến môi trường từ file .env nếu có
let envVars = { ...defaultEnv };
if (fs.existsSync(envPath)) {
  console.log('.env file found, loading variables...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse file .env
  envContent.split('\n').forEach(line => {
    // Bỏ qua comment hoặc dòng trống
    if (!line || line.startsWith('#')) return;
    
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
} else {
  console.log('.env file not found, using default values.');
}

console.log('Environment variables to be used:');
Object.entries(envVars).forEach(([key, value]) => {
  // Ẩn các giá trị nhạy cảm
  if (key.includes('PASSWORD') || key.includes('SECRET')) {
    console.log(`${key}: ******`);
  } else {
    console.log(`${key}: ${value}`);
  }
});

// Kết hợp biến môi trường mặc định với môi trường hiện tại
const env = { ...process.env, ...envVars };

// Khởi động NestJS với biến môi trường được đặt trực tiếp
const nestProcess = spawn('node', ['dist/main'], {
  env,
  stdio: 'inherit',
});

nestProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
});

nestProcess.on('exit', (code, signal) => {
  if (code) {
    console.log(`Server process exited with code ${code}`);
  } else if (signal) {
    console.log(`Server process was killed with signal ${signal}`);
  } else {
    console.log('Server process exited');
  }
}); 