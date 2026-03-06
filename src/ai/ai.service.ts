import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ToolsService } from '../tools/tools.service';

interface DecisionResponse {
  useTool: boolean;
  toolName: 'trm' | null;
  answer?: string;
}

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly toolsService: ToolsService,
  ) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1', // ← solo agrega esta línea
    });
  }

  // Recibo el texto del usuario y el historial (ya en orden cronológico); devuelvo la respuesta y si usé alguna tool
  async processUserMessage(
    text: string,
    history: ConversationTurn[] = [],
  ): Promise<{ replyText: string; toolUsed?: string | null }> {
    const decision = await this.decideAction(text);

    // ── FIX 2: Fallback en error de scraping ─────────────────────────────────
    // Si OpenAI decidió usar la tool TRM pero el scraping falla, respondemos
    // con un mensaje amigable en lugar de dejar que la excepción se propague.
    if (decision.useTool && decision.toolName === 'trm') {
      try {
        const trm = await this.toolsService.getCurrentTrm();
        const replyText = [
          `La TRM actual del dólar en Colombia es aproximadamente ${trm.value.toLocaleString(
            'es-CO',
            { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          )} COP por 1 USD.`,
          trm.dateText
            ? `Fuente: ${trm.source} (${trm.dateText.trim()}).`
            : `Fuente: ${trm.source}.`,
        ].join(' ');

        return { replyText, toolUsed: 'trm' };
      } catch (error) {
        this.logger.error(
          'Error al obtener la TRM desde la tool de scraping',
          error as Error,
        );
        return {
          replyText:
            'Lo siento, en este momento no pude obtener la TRM actualizada. ' +
            'Intenta de nuevo en unos minutos o consulta directamente en https://www.dolar-colombia.com/',
          toolUsed: 'trm',
        };
      }
    }

    if (decision.answer) {
      return { replyText: decision.answer, toolUsed: null };
    }

    // Si no usó tool ni dio answer directa, llamo a OpenAI con el historial para generar respuesta conversacional
    const messages = [
      {
        role: 'system' as const,
        content:
          'Eres un asistente conversacional breve y amable que responde en español neutro. ' +
          'Tienes acceso a un pequeño historial de conversación para mantener el contexto.',
      },
      ...history.map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user' as const, content: text },
    ];

    const completion = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
    });

    const replyText =
      completion.choices[0].message.content ??
      'Lo siento, hubo un problema al generar la respuesta.';
    return { replyText, toolUsed: null };
  }

  // Pregunto a OpenAI si debo usar una tool o responder directo; devuelve useTool, toolName, answer
  private async decideAction(text: string): Promise<DecisionResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Eres un orquestador que decide si usar herramientas (tools) para responder al usuario. ' +
              'Dispones de UNA sola tool: "trm", que obtiene la TRM actual del dólar en Colombia desde un sitio web. ' +
              'Solo debes usar la tool cuando el usuario pregunte explícitamente por el precio del dólar, TRM, tasa de cambio USD/COP, ' +
              'o haga preguntas equivalentes. Si no es necesario usar una tool, responde directamente en el campo "answer". ' +
              'Responde SIEMPRE un JSON válido con esta forma: ' +
              '{ "useTool": boolean, "toolName": "trm" | null, "answer": string | null }.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
      });

      const raw = completion.choices[0].message.content ?? '{}';
      const parsed = JSON.parse(raw) as DecisionResponse;

      if (typeof parsed.useTool !== 'boolean') {
        throw new Error('Invalid decision JSON from OpenAI');
      }

      return {
        useTool: parsed.useTool,
        toolName: parsed.toolName ?? null,
        answer: parsed.answer,
      };
    } catch (error) {
      this.logger.error('Error decidiendo acción con OpenAI', error as Error);
      return {
        useTool: false,
        toolName: null,
        answer:
          'En este momento no puedo procesar tu solicitud. ¿Puedes reformular tu pregunta?',
      };
    }
  }
}