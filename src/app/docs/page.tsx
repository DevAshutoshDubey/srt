export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">API Documentation</h1>

          {/* Authentication */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication</h2>
            <p className="text-gray-600 mb-4">
              Include your API key in the request header. You can find your API key in your
              dashboard settings.
            </p>
            <div className="bg-gray-900 text-white p-4 rounded-lg mb-4">
              <pre className="text-sm overflow-x-auto">
                {`curl -X POST https://yourapp.com/api/v1/shorten \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"url": "https://example.com"}'`}
              </pre>
            </div>
          </section>

          {/* Shorten URL */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Shorten URL</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <code className="text-green-800 font-bold">POST /api/v1/shorten</code>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-2">Request Body</h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <pre className="text-sm overflow-x-auto">
                {`{
  "url": "https://example.com/very/long/url",
  "customCode": "my-code",    // optional, 3-20 characters
  "domain": "yourdomain.com", // optional, must be verified
  "expiresAt": "2024-12-31T23:59:59Z" // optional, ISO date string
}`}
              </pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-2">Response</h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <pre className="text-sm overflow-x-auto">
                {`{
  "success": true,
  "data": {
    "id": 123,
    "originalUrl": "https://example.com/very/long/url",
    "shortCode": "abc123",
    "shortUrl": "https://yourdomain.com/abc123",
    "domain": "yourdomain.com",
    "createdAt": "2024-01-01T00:00:00Z",
    "expiresAt": null,
    "clickCount": 0
  }
}`}
              </pre>
            </div>
          </section>

          {/* Get URL Info */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Get URL Information</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <code className="text-blue-800 font-bold">GET /api/v1/shorten?code=SHORT_CODE</code>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-2">Response</h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <pre className="text-sm overflow-x-auto">
                {`{
  "success": true,
  "data": {
    "id": 123,
    "originalUrl": "https://example.com/very/long/url",
    "shortCode": "abc123",
    "clickCount": 42,
    "createdAt": "2024-01-01T00:00:00Z",
    "expiresAt": null
  }
}`}
              </pre>
            </div>
          </section>

          {/* Error Codes */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Codes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600">
                      MISSING_API_KEY
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      API key is required
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600">
                      INVALID_API_KEY
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      API key is not valid
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600">
                      LIMIT_EXCEEDED
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Monthly URL limit exceeded
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600">
                      CODE_EXISTS
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Custom code already in use
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600">
                      INVALID_URL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      URL format is invalid
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Rate Limits */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Rate Limits</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ul className="text-sm text-yellow-800 space-y-2">
                <li>
                  • <strong>Free Plan:</strong> 100 requests per hour
                </li>
                <li>
                  • <strong>Basic Plan:</strong> 1,000 requests per hour
                </li>
                <li>
                  • <strong>Pro Plan:</strong> 10,000 requests per hour
                </li>
                <li>
                  • <strong>Enterprise Plan:</strong> Custom limits
                </li>
              </ul>
            </div>
          </section>

          {/* SDKs */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">SDKs & Examples</h2>

            <h3 className="text-lg font-semibold text-gray-700 mb-2">JavaScript/Node.js</h3>
            <div className="bg-gray-900 text-white p-4 rounded-lg mb-4">
              <pre className="text-sm overflow-x-auto">
                {`const shortenUrl = async (url, apiKey) => {
  const response = await fetch('https://yourapp.com/api/v1/shorten', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({ url })
  });
  
  const data = await response.json();
  return data.data.shortUrl;
};

// Usage
const shortUrl = await shortenUrl('https://example.com', 'your-api-key');
console.log(shortUrl); // https://yourapp.com/abc123`}
              </pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-2">Python</h3>
            <div className="bg-gray-900 text-white p-4 rounded-lg mb-4">
              <pre className="text-sm overflow-x-auto">
                {`import requests

def shorten_url(url, api_key):
    response = requests.post(
        'https://yourapp.com/api/v1/shorten',
        headers={
            'Content-Type': 'application/json',
            'x-api-key': api_key
        },
        json={'url': url}
    )
    
    data = response.json()
    return data['data']['shortUrl']

# Usage
short_url = shorten_url('https://example.com', 'your-api-key')
print(short_url)  # https://yourapp.com/abc123`}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
