// lib/domain-monitor.ts
import { promises as dns } from 'dns';

export class DomainMonitor {
  private static instance: DomainMonitor;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): DomainMonitor {
    if (!DomainMonitor.instance) {
      DomainMonitor.instance = new DomainMonitor();
    }
    return DomainMonitor.instance;
  }

  async checkDomainBinding(domain: string, expectedIP: string): Promise<boolean> {
    try {
      const addresses = await dns.resolve4(domain);
      return addresses.includes(expectedIP);
    } catch (error) {
      console.error(`Domain binding check failed for ${domain}:`, error);
      return false;
    }
  }

  async checkCNAMEBinding(domain: string, expectedCNAME: string): Promise<boolean> {
    try {
      const cnameRecords = await dns.resolveCname(domain);
      return cnameRecords.includes(expectedCNAME);
    } catch (error) {
      console.error(`CNAME binding check failed for ${domain}:`, error);
      return false;
    }
  }

  startMonitoring(domain: string, callback: (status: boolean) => void, interval = 300000) {
    if (this.intervals.has(domain)) {
      clearInterval(this.intervals.get(domain));
    }

    const timer = setInterval(async () => {
      const isBound = await this.checkDomainBinding(domain, process.env.SERVER_IP || '');
      callback(isBound);
    }, interval);

    this.intervals.set(domain, timer);
  }

  stopMonitoring(domain: string) {
    const timer = this.intervals.get(domain);
    if (timer) {
      clearInterval(timer);
      this.intervals.delete(domain);
    }
  }
}
