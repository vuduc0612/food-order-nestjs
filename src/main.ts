import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
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
