import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  // Healthcheck para ver que el backend está arriba
  getHello(): string {
    return this.appService.getHello();
  }
}
