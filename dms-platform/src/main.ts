import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // ─── Swagger ──────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('DMS Platform API')
    .setDescription(
      `## Multi-Tenant Dealer Management System — Phase 0

**Autenticación:** Usa el botón \`Authorize\` para ingresar tu Bearer token.

**Header requerido:** Incluye \`x-tenant-id\` en cada request o úsalo en el campo Authorize.

**Tenant demo:**
- \`x-tenant-id: cmni0wb3c0000tx02ntsdv3np\`
- Admin: \`admin@demo-dealer.com\` / \`Admin123!\`
- Cajero: \`cajero@demo-dealer.com\` / \`Cashier123!\``,
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-tenant-id', in: 'header' },
      'x-tenant-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  // ──────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`DMS Platform running on port ${port}`);
  console.log(`Swagger UI:       http://localhost:${port}/api`);
  console.log(`Swagger JSON:     http://localhost:${port}/api-json`);
}
bootstrap();
