import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import type { WhatsappWebhookPayload } from './whatsapp.service';

@Controller('webhook/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) { }

  // Meta: verificación GET
  @Get()
  @HttpCode(HttpStatus.OK)
  verifyWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ): string {
    return this.whatsappService.verifyWebhook(mode, token, challenge);
  }

  // Meta: mensajes entrantes
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: WhatsappWebhookPayload): Promise<void> {
    await this.whatsappService.handleIncomingWebhook(payload);
  }

  // Twilio: mensajes entrantes (formato distinto al de Meta)
  @Post('twilio')
  @HttpCode(HttpStatus.OK)
  async handleTwilioWebhook(
    @Body() body: Record<string, string>,
  ): Promise<void> {
    await this.whatsappService.handleTwilioIncoming(body);
  }
}