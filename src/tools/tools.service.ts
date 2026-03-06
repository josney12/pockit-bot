import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface TrmResult {
  value: number;
  source: string;
  dateText?: string;
}

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);

  constructor(private readonly http: HttpService) {}

  // Scraping de la TRM desde dolar-colombia.com (tool que pide el reto)
  async getCurrentTrm(): Promise<TrmResult> {
    const url = 'https://www.dolar-colombia.com/';
    const response = await firstValueFrom(this.http.get<string>(url));
    const html = response.data;

    const match = html.match(/1\s*USD\s*=\s*([\d.,]+)\s*COP/);
    if (!match) {
      this.logger.warn('No TRM match found in dolar-colombia.com HTML');
      throw new Error('No se pudo obtener la TRM actual.');
    }

    const rawValue = match[1].replace(/\./g, '').replace(/,/g, '.');
    const value = Number(rawValue);

    const dateMatch = html.match(
      /TRM vigente al\s+([^-\n<]+)-\s*¿A cómo está el Dólar hoy\?/i,
    );

    return {
      value,
      source: url,
      dateText: dateMatch ? dateMatch[1].trim() : undefined,
    };
  }
}
