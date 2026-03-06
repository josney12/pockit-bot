import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { AiModule } from '../ai/ai.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [HttpModule, ConfigModule, AiModule, MessagesModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}