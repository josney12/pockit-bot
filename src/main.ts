import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.use(express.urlencoded({ extended: true })); 


  // Documentación Swagger para que puedan probar los endpoints desde el navegador
  const config = new DocumentBuilder()
    .setTitle('PockiBot API')
    .setDescription(
      'API backend para el reto Pocki Asistente Virtual, incluyendo webhook de WhatsApp, tools y mensajes.',
    )
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
