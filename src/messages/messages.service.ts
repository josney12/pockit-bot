import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageDirection } from './message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) { }

  // Persisto cada mensaje (entrante o saliente) en la BD
  async createMessage(params: {
    whatsappId: string | null;
    fromNumber: string;
    toNumber: string;
    direction: MessageDirection;
    body: string;
    toolUsed?: string | null;
    rawPayload?: object;
  }): Promise<Message> {
    const entity = this.messageRepository.create(params);
    return this.messageRepository.save(entity);
  }

  // ── FIX 1: Deduplicación ─────────────────────────────────────────────────
  // Verifico si un whatsappId ya fue procesado antes de volver a manejarlo.
  // Meta puede reenviar el mismo evento varias veces; esto evita duplicados.
  async existsByWhatsappId(whatsappId: string): Promise<boolean> {
    const count = await this.messageRepository.count({
      where: { whatsappId },
    });
    return count > 0;
  }

  // Recupero los últimos N mensajes con un contacto para armar el historial de OpenAI
  // Nota: se devuelven en orden DESC (más reciente primero); el llamador debe invertir si necesita orden cronológico
  async findRecentConversation(
    contactNumber: string,
    limit = 10,
  ): Promise<Message[]> {
    return this.messageRepository.find({
      where: [{ fromNumber: contactNumber }, { toNumber: contactNumber }],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}