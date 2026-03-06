import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ToolsModule } from '../tools/tools.module';
import { AiService } from './ai.service';

@Module({
  imports: [ConfigModule, ToolsModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
