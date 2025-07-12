import { ApiProperty } from '@nestjs/swagger';

export class CheckInTicketByQrDto {
  @ApiProperty({
    example: 'U2FsdGVkX1+7lK1UCg...',
    description: 'Ciphertext string (Base64) content scanned from QR',
  })
  encryptedQrData: string;
}