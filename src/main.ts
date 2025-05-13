import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Đường dẫn tuyệt đối đến file .env
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);
console.log(`File exists: ${fs.existsSync(envPath)}`);

// Nếu file tồn tại, log nội dung của file (cẩn thận với thông tin nhạy cảm)
if (fs.existsSync(envPath)) {
  console.log('File .env content:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  // Chỉ log một phần của file, không bao gồm thông tin nhạy cảm như mật khẩu
  console.log(envContent.split('\n')
    .filter(line => !line.includes('PASSWORD') && !line.includes('SECRET'))
    .join('\n'));
}

// Load .env file manually before bootstrap
dotenv.config({ path: envPath });

// Load biến môi trường trực tiếp
process.env.DB_USERNAME = process.env.DB_USERNAME || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_NAME = process.env.DB_NAME || 'food_delivery';

async function bootstrap() {
  console.log('Environment variables after loading:');
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_PORT: ${process.env.DB_PORT}`);
  console.log(`DB_USERNAME: ${process.env.DB_USERNAME || 'not set'}`);
  console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '12345' : 'not set'}`);
  console.log(`DB_DATABASE: ${process.env.DB_DATABASE || 'not set'}`);
  console.log(`Current working directory: ${process.cwd()}`);

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Accept',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Food Delivery API')
    .setDescription('API cho ứng dụng đặt món ăn')
    .setVersion('1.0')
    .addTag('Authentication', 'Xác thực người dùng')
    .addTag('Users', 'Quản lý người dùng')
    .addTag('Restaurants', 'Quản lý nhà hàng')
    .addTag('Dishes', 'Quản lý món ăn')
    .addTag('Orders', 'Quản lý đơn hàng')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
  console.log(`📚 Swagger UI đang chạy tại http://localhost:${port}/api`);
}
bootstrap();
