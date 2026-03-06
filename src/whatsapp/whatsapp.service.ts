import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AiService } from '../ai/ai.service';
import { MessagesService } from '../messages/messages.service';

// Estructura mínima del payload que envía Meta al webhook
export interface WhatsappWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          id: string;
          from: string;
          type: string;
          text?: { body: string };
        }>;
        metadata?: { display_phone_number?: string };
      };
    }>;
  }>;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly whatsappToken: string;
  private readonly phoneNumberId: string;
  private readonly verifyToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
    private readonly aiService: AiService,
    private readonly messagesService: MessagesService,
  ) {
    this.whatsappToken = this.configService.get<string>('WHATSAPP_TOKEN') ?? '';
    this.phoneNumberId =
      this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') ?? '';
    this.verifyToken =
      this.configService.get<string>('WHATSAPP_VERIFY_TOKEN') ?? '';
  }

  // Meta usa GET con hub.mode, hub.verify_token y hub.challenge para verificar el webhook
  verifyWebhook(mode?: string, token?: string, challenge?: string): string {
    if (mode === 'subscribe' && token === this.verifyToken && challenge) {
      this.logger.log('Webhook verificado correctamente.');
      return challenge;
    }
    this.logger.warn('Intento de verificación de webhook fallido.');
    return 'Error: verificación fallida';
  }

  // Flujo completo: extraigo mensaje, deduplico, guardo en BD, proceso con AI, envío respuesta
  async handleIncomingWebhook(payload: WhatsappWebhookPayload): Promise<void> {
    try {
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        this.logger.debug('Webhook recibido sin mensajes de usuario.');
        return;
      }

      const message = messages[0];

      // Solo proceso mensajes de texto; ignoro audio, imagen, stickers, etc.
      if (message.type !== 'text') {
        this.logger.debug(`Tipo de mensaje no soportado: ${message.type}`);
        return;
      }

      const fromNumber = message.from;
      const toNumber = value?.metadata?.display_phone_number ?? '';
      const text = message.text?.body ?? '';

      // ── FIX 1: Deduplicación ──────────────────────────────────────────────
      // Meta puede reenviar el mismo webhook varias veces; si ya procesamos
      // este whatsappId simplemente lo ignoramos para no duplicar respuestas.
      const alreadyProcessed = await this.messagesService.existsByWhatsappId(
        message.id,
      );
      if (alreadyProcessed) {
        this.logger.warn(
          `Mensaje duplicado ignorado. whatsappId: ${message.id}`,
        );
        return;
      }

      // Persisto el mensaje entrante antes de procesarlo
      await this.messagesService.createMessage({
        whatsappId: message.id,
        fromNumber,
        toNumber,
        direction: 'in',
        body: text,
        rawPayload: payload as object,
      });

      // ── FIX 5: Historial en orden cronológico correcto ────────────────────
      // findRecentConversation devuelve DESC (más reciente primero);
      // lo invierto para que OpenAI reciba los mensajes en orden cronológico.
      const recent = await this.messagesService.findRecentConversation(
        fromNumber,
        6,
      );
      const history = recent
        .filter((m) => m.body)
        .reverse() // ← corrección: cronológico ascendente para el modelo
        .map((m) => ({
          role:
            m.direction === 'in' ? ('user' as const) : ('assistant' as const),
          content: m.body,
        }));

      const aiResult = await this.aiService.processUserMessage(text, history);

      await this.sendWhatsappMessage({
        to: fromNumber,
        message: aiResult.replyText,
      });

      // ── FIX 6: whatsappId saliente como null en lugar de string vacío ─────
      await this.messagesService.createMessage({
        whatsappId: null,
        fromNumber: toNumber,
        toNumber: fromNumber,
        direction: 'out',
        body: aiResult.replyText,
        toolUsed: aiResult.toolUsed,
      });
    } catch (error) {
      this.logger.error('Error manejando webhook de WhatsApp', error as Error);
    }
  }

  // Reemplaza sendWhatsappMessage con esto para Twilio
  private async sendWhatsappMessage(params: {
    to: string;
    message: string;
  }): Promise<void> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.configService.get<string>('TWILIO_WHATSAPP_FROM');

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      From: from ?? '',
      To: `whatsapp:+${params.to}`,
      Body: params.message,
    });

    await firstValueFrom(
      this.http.post(url, body.toString(), {
        auth: { username: accountSid ?? '', password: authToken ?? '' },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
  }

  // Twilio envía form-urlencoded, no JSON como Meta
  // Los campos relevantes son: From, Body, MessageSid
  async handleTwilioIncoming(body: Record<string, string>): Promise<void> {
    try {
        this.logger.debug(`Body recibido: ${JSON.stringify(body)}`); // ← agrega esto
      const from = body['From']?.replace('whatsapp:+', '') ?? '';
      const text = body['Body'] ?? '';
      const messageId = body['MessageSid'] ?? '';
      const to = body['To']?.replace('whatsapp:+', '') ?? '';

      if (!text || !from) {
        this.logger.debug('Twilio webhook sin contenido útil.');
        return;
      }

      // Deduplicación igual que con Meta
      const alreadyProcessed = await this.messagesService.existsByWhatsappId(messageId);
      if (alreadyProcessed) {
        this.logger.warn(`Mensaje Twilio duplicado ignorado. MessageSid: ${messageId}`);
        return;
      }

      await this.messagesService.createMessage({
        whatsappId: messageId,
        fromNumber: from,
        toNumber: to,
        direction: 'in',
        body: text,
      });

      const recent = await this.messagesService.findRecentConversation(from, 6);
      const history = recent
        .filter((m) => m.body)
        .reverse()
        .map((m) => ({
          role: m.direction === 'in' ? ('user' as const) : ('assistant' as const),
          content: m.body,
        }));

      const aiResult = await this.aiService.processUserMessage(text, history);

      await this.sendWhatsappMessage({ to: from, message: aiResult.replyText });

      await this.messagesService.createMessage({
        whatsappId: null,
        fromNumber: to,
        toNumber: from,
        direction: 'out',
        body: aiResult.replyText,
        toolUsed: aiResult.toolUsed,
      });
    } catch (error) {
      this.logger.error('Error manejando webhook de Twilio', error as Error);
    }
  }
}