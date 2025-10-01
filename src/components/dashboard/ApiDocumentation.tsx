'use client';

import { useState } from 'react';
import { 
  Copy, 
  Play, 
  Code, 
  Terminal, 
  Globe, 
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  Zap,
  Shield
} from 'lucide-react';

interface UserProfile {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  organization: {
    id: number;
    name: string;
    slug: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    monthlyUrlsUsed: number;
    monthlyUrlLimit: number;
    apiKey: string;
  };
}

interface ApiDocumentationProps {
  profile: UserProfile;
}

export default function ApiDocumentation({ profile }: ApiDocumentationProps) {
  const [activeSection, setActiveSection] = useState('quickstart');
  const [copiedText, setCopiedText] = useState('');

  const apiKey = profile.organization.apiKey;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com';

  const sections = [
    { id: 'quickstart', name: 'Quick Start', icon: Zap },
    { id: 'authentication', name: 'Authentication', icon: Key },
    { id: 'endpoints', name: 'API Endpoints', icon: Globe },
    { id: 'examples', name: 'Code Examples', icon: Code },
    { id: 'errors', name: 'Error Handling', icon: AlertTriangle },
    { id: 'rate-limits', name: 'Rate Limits', icon: Shield },
    { id: 'webhooks', name: 'Webhooks', icon: Terminal },
  ];

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const CodeBlock = ({ children, language = 'bash', copyLabel }: { 
    children: string; 
    language?: string; 
    copyLabel?: string;
  }) => (
    <div className="relative">
      <div className="flex justify-between items-center bg-gray-800 text-white px-4 py-2 rounded-t-lg">
        <span className="text-sm font-medium">{language}</span>
        {copyLabel && (
          <button
            onClick={() => copyToClipboard(children, copyLabel)}
            className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
          >
            <Copy size={14} />
            {copiedText === copyLabel ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
      <pre className="bg-gray-900 text-white p-4 rounded-b-lg overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'quickstart':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome to the API!</h3>
              <p className="text-blue-800">
                Get started with your URL shortener API in minutes. Your personal API key is ready to use.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Your API Credentials</h3>
              <div className="bg-white border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <div className="flex">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded-l border text-sm font-mono">
                        {apiKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(apiKey, 'api-key')}
                        className="px-3 py-2 bg-gray-200 border border-l-0 rounded-r hover:bg-gray-300"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                    <code className="block bg-gray-100 px-3 py-2 rounded border text-sm">
                      {baseUrl}/api/v1
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Test Your First Request</h3>
              <p className="text-gray-600 mb-4">Try creating a short URL right now:</p>
              <CodeBlock language="curl" copyLabel="test-request">
{`curl -X POST ${baseUrl}/api/v1/shorten \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "url": "https://example.com",
    "customCode": "my-test-link"
  }'`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Expected Response</h3>
              <CodeBlock language="json">
{`{
  "success": true,
  "data": {
    "id": 123,
    "originalUrl": "https://example.com",
    "shortCode": "my-test-link",
    "shortUrl": "${baseUrl}/my-test-link",
    "domain": "${new URL(baseUrl).host}",
    "createdAt": "2025-01-01T12:00:00Z",
    "clickCount": 0
  }
}`}
              </CodeBlock>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="text-green-600 mr-2 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-green-800">You're all set!</h4>
                  <p className="text-sm text-green-700">
                    Your API is ready to use. Check out the other sections for detailed documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'authentication':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">API Key Authentication</h3>
              <p className="text-gray-600 mb-4">
                All API requests must include your API key in the request headers. Your key is tied to your organization: <strong>{profile.organization.name}</strong>.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Header Format</h4>
              <CodeBlock language="http">
{`x-api-key: ${apiKey}`}
              </CodeBlock>
            </div>

            <div>
              <h4 className="font-medium mb-2">Alternative: Authorization Header</h4>
              <CodeBlock language="http">
{`Authorization: Bearer ${apiKey}`}
              </CodeBlock>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-600 mr-2 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-yellow-800">Security Best Practices</h4>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Never expose your API key in client-side code</li>
                    <li>• Store your API key securely as an environment variable</li>
                    <li>• Regenerate your key if you suspect it's been compromised</li>
                    <li>• Use HTTPS for all API requests</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'endpoints':
        return (
          <div className="space-y-8">
            {/* Shorten URL */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded">POST</span>
                <code className="text-lg font-semibold">/api/v1/shorten</code>
              </div>
              <p className="text-gray-600 mb-4">Create a new short URL</p>
              
              <h4 className="font-medium mb-2">Request Body</h4>
              <CodeBlock language="json">
{`{
  "url": "https://example.com",           // Required: URL to shorten
  "customCode": "my-link",               // Optional: Custom short code (3-20 chars)
  "domain": "yourdomain.com",            // Optional: Custom domain
  "expiresAt": "2025-12-31T23:59:59Z"    // Optional: Expiration date (ISO 8601)
}`}
              </CodeBlock>

              <h4 className="font-medium mb-2 mt-4">Response</h4>
              <CodeBlock language="json">
{`{
  "success": true,
  "data": {
    "id": 123,
    "originalUrl": "https://example.com",
    "shortCode": "my-link",
    "shortUrl": "${baseUrl}/my-link",
    "domain": "${new URL(baseUrl).host}",
    "createdAt": "2025-01-01T12:00:00Z",
    "expiresAt": "2025-12-31T23:59:59Z",
    "clickCount": 0
  }
}`}
              </CodeBlock>
            </div>

            {/* Get URL Info */}
            <div className="border-t pt-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded">GET</span>
                <code className="text-lg font-semibold">/api/v1/shorten?code=SHORT_CODE</code>
              </div>
              <p className="text-gray-600 mb-4">Retrieve information about a short URL</p>
              
              <h4 className="font-medium mb-2">Example Request</h4>
              <CodeBlock language="curl" copyLabel="get-url">
{`curl -H "x-api-key: ${apiKey}" \\
  "${baseUrl}/api/v1/shorten?code=my-link"`}
              </CodeBlock>

              <h4 className="font-medium mb-2 mt-4">Response</h4>
              <CodeBlock language="json">
{`{
  "success": true,
  "data": {
    "id": 123,
    "originalUrl": "https://example.com",
    "shortCode": "my-link",
    "clickCount": 42,
    "createdAt": "2025-01-01T12:00:00Z",
    "expiresAt": null
  }
}`}
              </CodeBlock>
            </div>

            {/* List URLs */}
            <div className="border-t pt-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded">GET</span>
                <code className="text-lg font-semibold">/api/urls</code>
              </div>
              <p className="text-gray-600 mb-4">List all your short URLs (requires session authentication)</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This endpoint uses session-based authentication. Use it from your web application after login.
                </p>
              </div>
            </div>
          </div>
        );

      case 'examples':
        return (
          <div className="space-y-8">
            {/* JavaScript */}
            <div>
              <h3 className="text-lg font-semibold mb-3">JavaScript / Node.js</h3>
              <CodeBlock language="javascript" copyLabel="js-example">
{`// Using fetch API
async function createShortUrl(originalUrl, options = {}) {
  try {
    const response = await fetch('${baseUrl}/api/v1/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '${apiKey}'
      },
      body: JSON.stringify({
        url: originalUrl,
        customCode: options.customCode,
        expiresAt: options.expiresAt
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.shortUrl;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error creating short URL:', error);
    throw error;
  }
}

// Usage
createShortUrl('https://example.com', {
  customCode: 'my-link',
  expiresAt: '2025-12-31T23:59:59Z'
}).then(shortUrl => {
  console.log('Short URL created:', shortUrl);
});`}
              </CodeBlock>
            </div>

            {/* Python */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Python</h3>
              <CodeBlock language="python" copyLabel="python-example">
{`import requests
from datetime import datetime, timedelta

class UrlShortener:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = '${baseUrl}/api/v1'
    
    def create_short_url(self, url, custom_code=None, expires_in_days=None):
        payload = {'url': url}
        
        if custom_code:
            payload['customCode'] = custom_code
        
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
            payload['expiresAt'] = expires_at.isoformat() + 'Z'
        
        response = requests.post(
            f'{self.base_url}/shorten',
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': self.api_key
            }
        )
        
        data = response.json()
        
        if data['success']:
            return data['data']['shortUrl']
        else:
            raise Exception(data['error'])

# Usage
shortener = UrlShortener('${apiKey}')
short_url = shortener.create_short_url(
    'https://example.com',
    custom_code='python-test',
    expires_in_days=30
)
print(f'Short URL created: {short_url}')`}
              </CodeBlock>
            </div>

            {/* PHP */}
            <div>
              <h3 className="text-lg font-semibold mb-3">PHP</h3>
              <CodeBlock language="php" copyLabel="php-example">
{`<?php

class UrlShortener {
    private $apiKey;
    private $baseUrl = '${baseUrl}/api/v1';
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    public function createShortUrl($url, $customCode = null, $expiresAt = null) {
        $data = ['url' => $url];
        
        if ($customCode) {
            $data['customCode'] = $customCode;
        }
        
        if ($expiresAt) {
            $data['expiresAt'] = $expiresAt;
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . '/shorten');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-api-key: ' . $this->apiKey
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        if ($result['success']) {
            return $result['data']['shortUrl'];
        } else {
            throw new Exception($result['error']);
        }
    }
}

// Usage
$shortener = new UrlShortener('${apiKey}');
$shortUrl = $shortener->createShortUrl(
    'https://example.com',
    'php-test',
    '2025-12-31T23:59:59Z'
);
echo "Short URL created: " . $shortUrl;

?>`}
              </CodeBlock>
            </div>
          </div>
        );

      case 'errors':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Error Response Format</h3>
              <p className="text-gray-600 mb-4">All error responses follow this consistent format:</p>
              <CodeBlock language="json">
{`{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "message": "Detailed error description"
}`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Common Error Codes</h3>
              <div className="space-y-4">
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">HTTP Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Error Code</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm text-red-600 font-mono">400</td>
                        <td className="px-4 py-3 text-sm font-mono">MISSING_URL</td>
                        <td className="px-4 py-3 text-sm text-gray-600">URL parameter is required</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-red-600 font-mono">400</td>
                        <td className="px-4 py-3 text-sm font-mono">INVALID_URL</td>
                        <td className="px-4 py-3 text-sm text-gray-600">URL format is invalid</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-red-600 font-mono">401</td>
                        <td className="px-4 py-3 text-sm font-mono">MISSING_API_KEY</td>
                        <td className="px-4 py-3 text-sm text-gray-600">API key is required</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-red-600 font-mono">401</td>
                        <td className="px-4 py-3 text-sm font-mono">INVALID_API_KEY</td>
                        <td className="px-4 py-3 text-sm text-gray-600">API key is not valid</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-red-600 font-mono">403</td>
                        <td className="px-4 py-3 text-sm font-mono">LIMIT_EXCEEDED</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Monthly URL limit exceeded</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-red-600 font-mono">409</td>
                        <td className="px-4 py-3 text-sm font-mono">CODE_EXISTS</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Custom code already in use</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-red-600 font-mono">429</td>
                        <td className="px-4 py-3 text-sm font-mono">RATE_LIMIT_EXCEEDED</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Too many requests</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Error Handling Examples</h3>
              <CodeBlock language="javascript" copyLabel="error-handling">
{`// JavaScript error handling
async function createShortUrl(url) {
  try {
    const response = await fetch('${baseUrl}/api/v1/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '${apiKey}'
      },
      body: JSON.stringify({ url })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      switch (data.code) {
        case 'LIMIT_EXCEEDED':
          console.error('Monthly limit reached. Please upgrade your plan.');
          break;
        case 'INVALID_URL':
          console.error('Please provide a valid URL');
          break;
        case 'CODE_EXISTS':
          console.error('Custom code already in use. Try a different one.');
          break;
        default:
          console.error('Error:', data.message);
      }
      throw new Error(data.error);
    }
    
    return data.data.shortUrl;
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
}`}
              </CodeBlock>
            </div>
          </div>
        );

      case 'rate-limits':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Current Rate Limits</h3>
              <div className="bg-white border rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Your Plan: {profile.organization.subscriptionTier}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Requests per hour:</span>
                        <span className="font-medium">1,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly URLs:</span>
                        <span className="font-medium">{profile.organization.monthlyUrlsUsed} / {profile.organization.monthlyUrlLimit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Burst limit:</span>
                        <span className="font-medium">100 per minute</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span className="text-sm text-green-600">All limits normal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Rate Limit Headers</h3>
              <p className="text-gray-600 mb-4">Every API response includes rate limit information in the headers:</p>
              <CodeBlock language="http">
{`HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1640995200
X-RateLimit-Used: 13`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Handling Rate Limits</h3>
              <CodeBlock language="javascript" copyLabel="rate-limit-handling">
{`async function makeApiRequest(url, options) {
  const response = await fetch(url, options);
  
  // Check rate limit headers
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
  const reset = parseInt(response.headers.get('X-RateLimit-Reset'));
  
  if (response.status === 429) {
    const resetTime = new Date(reset * 1000);
    console.log(\`Rate limit exceeded. Resets at: \${resetTime}\`);
    
    // Wait until reset time
    const waitTime = resetTime.getTime() - Date.now();
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Retry the request
    return makeApiRequest(url, options);
  }
  
  // Log remaining requests for monitoring
  if (remaining < 10) {
    console.warn(\`Only \${remaining} requests remaining\`);
  }
  
  return response;
}`}
              </CodeBlock>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-600 mr-2 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-yellow-800">Rate Limit Best Practices</h4>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Monitor rate limit headers in your responses</li>
                    <li>• Implement exponential backoff for retries</li>
                    <li>• Cache API responses when possible</li>
                    <li>• Use batch operations when available</li>
                    <li>• Contact support if you need higher limits</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'webhooks':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Terminal className="text-blue-600 mr-2 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-blue-800">Coming Soon</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Webhook functionality is currently in development. Soon you'll be able to receive real-time notifications for URL clicks and other events.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Planned Webhook Events</h3>
              <div className="space-y-3">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-1">url.clicked</h4>
                  <p className="text-sm text-gray-600">Triggered when someone clicks your short URL</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-1">url.created</h4>
                  <p className="text-sm text-gray-600">Triggered when a new URL is created</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-1">url.expired</h4>
                  <p className="text-sm text-gray-600">Triggered when a URL expires</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-1">limit.reached</h4>
                  <p className="text-sm text-gray-600">Triggered when you approach your monthly limits</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Example Webhook Payload</h3>
              <CodeBlock language="json">
{`{
  "event": "url.clicked",
  "timestamp": "2025-01-01T12:00:00Z",
  "organization_id": "${profile.organization.id}",
  "data": {
    "url_id": 123,
    "short_code": "abc123",
    "original_url": "https://example.com",
    "click_data": {
      "ip": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "referrer": "https://google.com",
      "country": "US",
      "timestamp": "2025-01-01T12:00:00Z"
    }
  }
}`}
              </CodeBlock>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Want to be notified when webhooks are ready?</strong> 
                <br />
                Contact us at support@urlshortener.com and we'll let you know as soon as this feature is available.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                    activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {section.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}
