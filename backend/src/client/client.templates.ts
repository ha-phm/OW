import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildCreateClientXml(
  dto: CreateClientDto,
  officer: string,
): string {
  const shortName =
    `${dto.lastName} ${dto.middleName ?? ''} ${dto.firstName}`.trim();

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
   <soapenv:Header>
      <wsin:SessionContextStr>?</wsin:SessionContextStr>
      <wsin:UserInfo>officer="${officer}"</wsin:UserInfo>
      <wsin:CorrelationId>?</wsin:CorrelationId>
   </soapenv:Header>
   <soapenv:Body>
      <wsin:CreateClientV4>
         <wsin:Reason>Create client</wsin:Reason>
         <wsin:CreateClient_InObject>
            <wsin:InstitutionCode>0001</wsin:InstitutionCode>
            <wsin:Branch>0101</wsin:Branch>
            <wsin:ClientTypeCode>PR</wsin:ClientTypeCode>
            <wsin:ClientCategory></wsin:ClientCategory>
            <wsin:ServiceGroup></wsin:ServiceGroup>
            <wsin:ProductCategory></wsin:ProductCategory>
            <wsin:LanguageCode></wsin:LanguageCode>
            <wsin:SalutationSuffix></wsin:SalutationSuffix>
            <wsin:ShortName>${escapeXml(shortName)}</wsin:ShortName>
            <wsin:FirstName>${escapeXml(dto.firstName)}</wsin:FirstName>
            <wsin:LastName>${escapeXml(dto.lastName)}</wsin:LastName>
            <wsin:MiddleName>${escapeXml(dto.middleName ?? '')}</wsin:MiddleName>
            <wsin:MaritalStatusCode>${dto.maritalStatusCode}</wsin:MaritalStatusCode>
            <wsin:SocialSecurityNumber>${dto.socialSecurityNumber}</wsin:SocialSecurityNumber>
            <wsin:SalutationCode>${dto.salutationCode}</wsin:SalutationCode>
            <wsin:BirthDate>${dto.birthDate}</wsin:BirthDate>
            <wsin:Gender>${dto.gender}</wsin:Gender>
            <wsin:BirthPlace></wsin:BirthPlace>
            <wsin:BirthName></wsin:BirthName>
            <wsin:Citizenship>VNM</wsin:Citizenship>
            <wsin:TaxBracket></wsin:TaxBracket>
            <wsin:IndividualTaxpayerNumber>${dto.socialSecurityNumber}</wsin:IndividualTaxpayerNumber>
            <wsin:SecretPhrase></wsin:SecretPhrase>
            <wsin:CompanyName>${escapeXml(dto.companyName ?? '')}</wsin:CompanyName>
            <wsin:Trademark></wsin:Trademark>
            <wsin:Department></wsin:Department>
            <wsin:EmbossedTitleCode></wsin:EmbossedTitleCode>
            <wsin:EmbossedFirstName></wsin:EmbossedFirstName>
            <wsin:EmbossedLastName></wsin:EmbossedLastName>
            <wsin:EmbossedCompanyName></wsin:EmbossedCompanyName>
            <wsin:IdentityCardType></wsin:IdentityCardType>
            <wsin:IdentityCardNumber>${dto.identityCardNumber}</wsin:IdentityCardNumber>
            <wsin:IdentityCardDetails>${escapeXml(dto.identityCardDetails ?? '')}</wsin:IdentityCardDetails>
            <wsin:ClientNumber>${dto.clientNumber ?? ''}</wsin:ClientNumber>
            <wsin:Profession>${escapeXml(dto.profession ?? '')}</wsin:Profession>
            <wsin:EMail>${escapeXml(dto.email)}</wsin:EMail>
            <wsin:AddressLine1>${escapeXml(dto.addressLine1)}</wsin:AddressLine1>
            <wsin:AddressLine2></wsin:AddressLine2>
            <wsin:AddressLine3></wsin:AddressLine3>
            <wsin:AddressLine4></wsin:AddressLine4>
            <wsin:City>${escapeXml(dto.city)}</wsin:City>
            <wsin:HomePhone>${dto.homePhone ?? ''}</wsin:HomePhone>
            <wsin:MobilePhone>${dto.mobilePhone}</wsin:MobilePhone>
            <wsin:BusinessPhone></wsin:BusinessPhone>
         </wsin:CreateClient_InObject>
         <wsin:SetCustomData_InObject></wsin:SetCustomData_InObject>
      </wsin:CreateClientV4>
   </soapenv:Body>
</soapenv:Envelope>`;
}

// ==========================================
// 2. TEMPLATE DÀNH CHO API EDIT CLIENT
// ==========================================

// Hàm helper chỉ sinh thẻ XML nếu có dữ liệu truyền vào
function buildOptionalTag(tag: string, value: string | undefined): string {
  if (value === undefined || value === null) return '';
  return `<wsin:${tag}>${escapeXml(value)}</wsin:${tag}>`;
}

export function buildEditClientXml(
  clientIdentifier: string,
  dto: UpdateClientDto,
  officer: string,
): string {
  // Chỉ cập nhật ShortName nếu gửi lên đủ cả First và Last name
  let shortNameTag = '';
  if (dto.firstName && dto.lastName) {
    const shortName =
      `${dto.lastName} ${dto.middleName ?? ''} ${dto.firstName}`.trim();
    shortNameTag = `<wsin:ShortName>${escapeXml(shortName)}</wsin:ShortName>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsin="http://www.openwaygroup.com/wsint">
   <soapenv:Header>
      <wsin:SessionContextStr>?</wsin:SessionContextStr>
      <wsin:UserInfo>officer="${officer}"</wsin:UserInfo>
      <wsin:CorrelationId>?</wsin:CorrelationId>
   </soapenv:Header>
   <soapenv:Body>
      <wsin:EditClientV6>
         <wsin:ClientSearchMethod>CLIENT_ID</wsin:ClientSearchMethod>
         <wsin:ClientIdentifier>${escapeXml(clientIdentifier)}</wsin:ClientIdentifier>
         <wsin:Reason>Update Client Information</wsin:Reason>
         <wsin:EditClient_InObject>
            ${shortNameTag}
            ${buildOptionalTag('FirstName', dto.firstName)}
            ${buildOptionalTag('MiddleName', dto.middleName)}
            ${buildOptionalTag('LastName', dto.lastName)}
            ${buildOptionalTag('BirthDate', dto.birthDate)}
            ${buildOptionalTag('Gender', dto.gender)}
            ${buildOptionalTag('MaritalStatusCode', dto.maritalStatusCode)}
            ${buildOptionalTag('SalutationCode', dto.salutationCode)}
            ${buildOptionalTag('MobilePhone', dto.mobilePhone)}
            ${buildOptionalTag('EMail', dto.email)}
            ${buildOptionalTag('IdentityCardNumber', dto.identityCardNumber)}
            ${buildOptionalTag('IdentityCardDetails', dto.identityCardDetails)}
            ${buildOptionalTag('IndividualTaxpayerNumber', dto.socialSecurityNumber)}
            ${buildOptionalTag('SocialSecurityNumber', dto.socialSecurityNumber)}
            ${buildOptionalTag('AddressLine1', dto.addressLine1)}
            ${buildOptionalTag('City', dto.city)}
            ${buildOptionalTag('HomePhone', dto.homePhone)}
            ${buildOptionalTag('CompanyName', dto.companyName)}
            ${buildOptionalTag('Profession', dto.profession)}
         </wsin:EditClient_InObject>
         <wsin:SetCustomData_InObject></wsin:SetCustomData_InObject>
      </wsin:EditClientV6>
   </soapenv:Body>
</soapenv:Envelope>`;
}
