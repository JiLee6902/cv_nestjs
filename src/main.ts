import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TransformInterceptor } from './core/transform.interceptor';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './core/http-exception.filter';


require('dotenv').config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);



  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  
  //config message của file khi lỗi upload
  //app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new TransformInterceptor(reflector))

  //3 dòng code này config cho frontend thấy được dữ liệu để hiển thị
  app.useStaticAssets(join(__dirname, '..', 'public'));  //css, js
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  //config view engine
  app.setViewEngine('ejs')

  //không truyền full data khi update bị mất dữ liệu
  // => thêm whitelist: true
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  //config cookie
  app.use(cookieParser());

  //config cors
  app.enableCors({
    // dấu * cho phép kết nối tới từ bất cứ nơi đâu
    "origin": true, //true: chỉ cho phép kết nối từ cùng origin với server
    "methods": "GET, HEAD, PUT, PATCH, POST, DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204,
    credentials: true,
  });

  //config versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1', '2']
  })

  app.use(helmet())

  //config swagger
  //cần config trong netsjs-cli.json
  //"plugins": ["@nestjs/swagger"]
  const config = new DocumentBuilder()
    .setTitle('NestJs APIs Document ')
    .setDescription('The NestJs API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'Bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'token',
    )
    .addSecurityRequirements('token')
    //  .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
     persistAuthorization: true, 
    }
  });

  await app.listen(configService.get<string>('PORT'));
}
bootstrap();

//mô hình chạy
//request => interceptor => pipe(file) => response (đối với file)
//request => guard => interceptor => response
// request => middleware => response