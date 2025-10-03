// components/DomainVerification.tsx
'use client';
import { useState } from 'react';

interface DomainVerificationProps {
  domain: string;
  onVerificationComplete: (verified: boolean) => void;
}

export default function DomainVerification({ domain, onVerificationComplete }: DomainVerificationProps) {
  const [verificationMethod, setVerificationMethod] = useState<'TXT' | 'CNAME' | 'FILE'>('TXT');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [instructions, setInstructions] = useState<string>('');

  const generateVerificationCode = () => {
    const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setVerificationCode(code);
    updateInstructions(verificationMethod, code);
  };

  const updateInstructions = (method: string, code: string) => {
    switch (method) {
      case 'TXT':
        setInstructions(`Create a TXT record for _verification.${domain} with value: shortener-verification=${code}`);
        break;
      case 'CNAME':
        setInstructions(`Create a CNAME record for ${code}.${domain} pointing to verify.yourapp.com`);
        break;
      case 'FILE':
        setInstructions(`Upload a file named ${code}.html to https://${domain}/${code}.html containing: shortener-verification=${code}`);
        break;
    }
  };

  const handleVerification = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          verificationCode,
          method: verificationMethod,
        }),
      });

      const result = await response.json();
      onVerificationComplete(result.verified);
    } catch (error) {
      console.error('Verification failed:', error);
      onVerificationComplete(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Verify Domain: {domain}</h3>
      </div>
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Verification Method:</label>
          <select 
            value={verificationMethod}
            onChange={(e) => {
              const method = e.target.value as 'TXT' | 'CNAME' | 'FILE';
              setVerificationMethod(method);
              if (verificationCode) updateInstructions(method, verificationCode);
            }}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="TXT">DNS TXT Record</option>
            <option value="CNAME">DNS CNAME Record</option>
            <option value="FILE">HTML File Upload</option>
          </select>
        </div>

        {!verificationCode && (
          <button 
            onClick={generateVerificationCode}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Generate Verification Code
          </button>
        )}

        {verificationCode && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code:</label>
              <input 
                type="text"
                value={verificationCode} 
                readOnly
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
              <p className="text-sm text-blue-800">{instructions}</p>
            </div>

            <button 
              onClick={handleVerification}
              disabled={isVerifying}
              className={`w-full py-3 px-4 rounded-md transition-colors ${
                isVerifying 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              } text-white`}
            >
              {isVerifying ? 'Verifying...' : 'Verify Domain'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
