import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './exception';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 입력 데이터를 DTO 인스턴스로 자동 변환
      // whitelist: true, // DTO에서 선언되지 않은 속성을 요청 본문에서 제거
      // forbidNonWhitelisted: true, // DTO에서 선언되지 않은 속성이 요청에 포함되어 있으면 예외를 발생
      // 여기에 필요한 다른 옵션들을 추가할 수 있습니다.
    }),
  );

  await app.listen(3000);
}
bootstrap();
