import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // Para ver los últimos mensajes con un número (admin / debugging)
  @Get('recent/:contactNumber')
  async getRecentConversation(
    @Param('contactNumber') contactNumber: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const messages = await this.messagesService.findRecentConversation(
      contactNumber,
      safeLimit,
    );

    return messages.map((m) => ({
      id: m.id,
      whatsappId: m.whatsappId,
      from: m.fromNumber,
      to: m.toNumber,
      direction: m.direction,
      body: m.body,
      toolUsed: m.toolUsed,
      createdAt: m.createdAt,
    }));
  }
}
