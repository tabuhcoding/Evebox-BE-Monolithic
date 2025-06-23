// src/domain/https-agent.ts
import https from 'https';

export const httpsAgentWithCA = new https.Agent({
  ca: process.env.CERT
});
