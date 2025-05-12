import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Evebox API')
    .setDescription('The Evebox API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
         type: 'http',
         scheme: 'bearer',
         bearerFormat: 'JWT',
         name: 'Authorization',
         in: 'header',
       },
       'access-token',
     ) 
    .build();
    
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
  console.log('Allowed origins:', allowedOrigins); 

  app.enableCors({
    // origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT);
}

bootstrap();
