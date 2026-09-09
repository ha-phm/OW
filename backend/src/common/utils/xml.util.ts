/**
 * Helper build XML cho các SOAP request gửi tới WAY4. Toàn bộ
 * `*.templates.ts` (card, client, contract) nên import từ đây thay vì
 * tự định nghĩa lại `escapeXml`.
 */

export function escapeXml(value?: string): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build một thẻ XML optional — trả chuỗi rỗng nếu value rỗng/undefined,
 * dùng khi request WAY4 chỉ nên gửi field nào thực sự có dữ liệu (ví dụ
 * EditClientV6/EditCardV2 — chỉ update field được truyền lên).
 */
export function buildOptionalTag(tag: string, value?: string): string {
  if (!value) return '';
  return `<wsin:${tag}>${escapeXml(value)}</wsin:${tag}>`;
}

/**
 * Wrapper chung cho mọi XML Request gửi lên WAY4.
 * Giúp loại bỏ việc copy/paste phần Header và Envelope ở các template khác.
 */
export function buildSoapEnvelope(
  bodyContent: string,
  officer: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
  <soapenv:Header>
    <wsin:SessionContextStr>?</wsin:SessionContextStr>
    <wsin:UserInfo>officer="${escapeXml(officer)}"</wsin:UserInfo>
    <wsin:CorrelationId>?</wsin:CorrelationId>
  </soapenv:Header>
  <soapenv:Body>
    ${bodyContent}
  </soapenv:Body>
</soapenv:Envelope>`;
}
