import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import XMLBuilder from 'fast-xml-builder';

interface SoapEnvelopeResponse {
  Envelope?: {
    Body?: Record<string, Record<string, SoapCallResult>>;
  };
}

interface SoapCallResult {
  RetCode: number;
  RetMsg?: string;
  ResultInfo?: string;
  OutObject?: unknown;
}

@Injectable()
export class SoapService {
  private readonly builder = new XMLBuilder({ ignoreAttributes: false });
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });

  constructor(private readonly config: ConfigService) {}

  // ---- Public API ----

  async call<T>(
    operation: string,
    params: Record<string, string | number>,
  ): Promise<T> {
    const officer = this.config.get<string>('OPENWAY_OFFICER');

    const envelope = this.builder.build({
      'soapenv:Envelope': {
        '@_xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        '@_xmlns:wsin': 'http://www.openwaygroup.com/wsint',
        'soapenv:Header': {
          'wsin:SessionContextStr': '?',
          'wsin:UserInfo': `officer="${officer}"`,
          'wsin:CorrelationId': '?',
        },
        'soapenv:Body': {
          [`wsin:${operation}`]: this.prefixKeys(params),
        },
      },
    });

    return this.postAndParse<T>(operation, envelope);
  }

  async sendRaw<T>(operation: string, xml: string): Promise<T> {
    return this.postAndParse<T>(operation, xml);
  }

  // ---- Private helpers ----

  private async postAndParse<T>(operation: string, xml: string): Promise<T> {
    const baseUrl = this.config.get<string>('OPENWAY_BASE_URL');

    const { data } = await axios.post<string>(baseUrl as string, xml, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
    });

    const parsed = this.parser.parse(data) as SoapEnvelopeResponse;
    const result =
      parsed.Envelope?.Body?.[`${operation}Response`]?.[`${operation}Result`];

    if (!result || result.RetCode !== 0) {
      throw new BadRequestException({
        retCode: result?.RetCode ?? null,
        message: result?.RetMsg ?? 'OpenWay không trả về kết quả hợp lệ',
      });
    }

    return (result.OutObject !== undefined ? result.OutObject : result) as T;
  }

  private prefixKeys(
    params: Record<string, string | number>,
  ): Record<string, string | number> {
    const prefixed: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(params)) {
      prefixed[`wsin:${key}`] = value;
    }
    return prefixed;
  }
}
