// lib/domain-verification.ts
import { promises as dns } from 'dns';

export interface DomainVerificationResult {
  isVerified: boolean;
  method: 'A_RECORD' | 'CNAME' | 'TXT' | 'NONE';
  details: {
    expectedIP?: string;
    actualIPs?: string[];
    expectedCNAME?: string;
    actualCNAME?: string[];
    txtRecords?: string[];
    error?: string;
  };
}

export async function verifyDomainDNS(domain: string): Promise<DomainVerificationResult> {
  const expectedIP = process.env.SERVER_IP || '123.45.67.89'; // Your server IP
  const expectedCNAME = process.env.CNAME_TARGET || 'app.urlshortener.com'; // Your CNAME target
  
  try {
    // Method 1: Check A Record
    const aRecordResult = await checkARecord(domain, expectedIP);
    if (aRecordResult.isVerified) {
      return aRecordResult;
    }

    // Method 2: Check CNAME Record
    const cnameResult = await checkCNAMERecord(domain, expectedCNAME);
    if (cnameResult.isVerified) {
      return cnameResult;
    }

    // Method 3: Check TXT Record for verification code
    const txtResult = await checkTXTRecord(domain);
    if (txtResult.isVerified) {
      return txtResult;
    }

    return {
      isVerified: false,
      method: 'NONE',
      details: {
        error: 'No valid DNS configuration found. Please configure A record, CNAME, or TXT verification.'
      }
    };

  } catch (error) {
    return {
      isVerified: false,
      method: 'NONE',
      details: {
        error: `DNS verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    };
  }
}

async function checkARecord(domain: string, expectedIP: string): Promise<DomainVerificationResult> {
  try {
    const addresses = await dns.resolve4(domain);
    const isVerified = addresses.includes(expectedIP);
    
    return {
      isVerified,
      method: 'A_RECORD',
      details: {
        expectedIP,
        actualIPs: addresses
      }
    };
  } catch (error) {
    return {
      isVerified: false,
      method: 'A_RECORD',
      details: {
        expectedIP,
        actualIPs: [],
        error: `A record lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    };
  }
}

async function checkCNAMERecord(domain: string, expectedCNAME: string): Promise<DomainVerificationResult> {
  try {
    const cnameRecords = await dns.resolveCname(domain);
    const isVerified = cnameRecords.some(record => 
      record.toLowerCase() === expectedCNAME.toLowerCase()
    );
    
    return {
      isVerified,
      method: 'CNAME',
      details: {
        expectedCNAME,
        actualCNAME: cnameRecords
      }
    };
  } catch (error) {
    return {
      isVerified: false,
      method: 'CNAME',
      details: {
        expectedCNAME,
        actualCNAME: [],
        error: `CNAME lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    };
  }
}

async function checkTXTRecord(domain: string): Promise<DomainVerificationResult> {
  try {
    const txtRecords = await dns.resolveTxt(`_verification.${domain}`);
    const flatRecords = txtRecords.flat();
    
    // Look for verification record format: "shortener-verification=CODE"
    const verificationRecord = flatRecords.find(record => 
      record.startsWith('shortener-verification=')
    );
    
    return {
      isVerified: !!verificationRecord,
      method: 'TXT',
      details: {
        txtRecords: flatRecords
      }
    };
  } catch (error) {
    return {
      isVerified: false,
      method: 'TXT',
      details: {
        txtRecords: [],
        error: `TXT record lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    };
  }
}

export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function isValidDomain(domain: string): boolean {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  return domainRegex.test(domain);
}
