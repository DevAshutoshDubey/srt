// components/dashboard/DomainManagement.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Copy,
  Settings,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface Domain {
  id: number;
  domain: string;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
  verification_code?: string;
  verification_method?: string;
  verification_attempts: number;
  last_verification_attempt?: string;
}

interface VerificationDetails {
  method: string;
  details: {
    expectedIP?: string;
    actualIPs?: string[];
    expectedCNAME?: string;
    actualCNAME?: string[];
    txtRecords?: string[];
    error?: string;
  };
}

export default function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyingDomain, setVerifyingDomain] = useState<number | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<number | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<{
    [key: number]: VerificationDetails;
  }>({});
  const [showTxtSetup, setShowTxtSetup] = useState<{ [key: number]: boolean }>({});

  const fetchDomains = async () => {
    try {
      const response = await fetch("/api/domains");
      const data = await response.json();
      if (data.success) {
        setDomains(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setNewDomain("");
        await fetchDomains();
      } else {
        setError(data.error || "Failed to add domain");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDomain = async (domainId: number, domainName: string) => {
    // Confirmation dialog
    if (
      !confirm(`Are you sure you want to delete "${domainName}"? This action cannot be undone.`)
    ) {
      return;
    }

    setDeletingDomain(domainId);
    setError("");

    try {
      const response = await fetch(`/api/domains/${domainId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();
      console.log("Delete response data:", data);

      if (data.success) {
        await fetchDomains();
        // Remove from local state for better UX
        setDomains(domains.filter((d) => d.id !== domainId));
      } else {
        setError(data.message || data.error || "Failed to delete domain");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setDeletingDomain(null);
    }
  };

  const handleVerifyDomain = async (domainId: number) => {
    setVerifyingDomain(domainId);
    setError("");

    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        await fetchDomains();
        setVerificationDetails({
          ...verificationDetails,
          [domainId]: data.data.verification,
        });
      } else {
        setError(data.message || "Domain verification failed");
        if (data.details) {
          setVerificationDetails({
            ...verificationDetails,
            [domainId]: { method: "FAILED", details: data.details },
          });
        }
      }
    } catch (error) {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifyingDomain(null);
    }
  };

  const generateTxtRecord = async (domainId: number) => {
    try {
      const response = await fetch(`/api/domains/${domainId}/generate-txt`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        await fetchDomains();
        setShowTxtSetup({
          ...showTxtSetup,
          [domainId]: true,
        });
      }
    } catch (error) {
      console.error("Failed to generate TXT record:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can replace this with a toast notification
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button.innerHTML;
      button.innerHTML = "✓ Copied!";
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy to clipboard");
    }
  };

  const getDomainStatus = (domain: Domain) => {
    if (domain.verified_at) {
      return {
        status: "verified",
        color: "green",
        icon: Check,
        text: `Verified via ${domain.verification_method || "DNS"}`,
      };
    }
    if (domain.verification_attempts > 0) {
      return {
        status: "failed",
        color: "red",
        icon: X,
        text: `Verification failed (${domain.verification_attempts} attempts)`,
      };
    }
    return {
      status: "pending",
      color: "yellow",
      icon: AlertCircle,
      text: "Pending Verification",
    };
  };

  const serverIP = process.env.NEXT_PUBLIC_SERVER_IP || "123.45.67.89";
  const cnameTarget = process.env.NEXT_PUBLIC_CNAME_TARGET || "app.urlshortener.com";

  return (
    <div className="space-y-6">
      {/* Add Domain Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe
            className="text-blue-500"
            size={24}
          />
          <h2 className="text-xl font-bold text-gray-900">Custom Domains</h2>
        </div>

        <form
          onSubmit={handleAddDomain}
          className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="yourdomain.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              pattern="[a-zA-Z0-9.-]+"
              title="Enter a valid domain name (e.g., yourdomain.com)"
            />
            <button
              type="submit"
              disabled={loading || !newDomain.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2">
              <Plus size={16} />
              {loading ? "Adding..." : "Add Domain"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>

        {/* Enhanced DNS Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Domain Setup Instructions</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-blue-800 mb-2">
                Option 1: A Record (Recommended)
              </p>
              <div className="bg-blue-100 p-2 rounded text-sm">
                <code>Type: A | Host: @ | Value: {serverIP}</code>
                <button
                  onClick={() => copyToClipboard(serverIP)}
                  className="ml-2 text-blue-600 hover:text-blue-800">
                  <Copy
                    size={12}
                    className="inline"
                  />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 mb-2">Option 2: CNAME Record</p>
              <div className="bg-blue-100 p-2 rounded text-sm">
                <code>Type: CNAME | Host: @ | Value: {cnameTarget}</code>
                <button
                  onClick={() => copyToClipboard(cnameTarget)}
                  className="ml-2 text-blue-600 hover:text-blue-800">
                  <Copy
                    size={12}
                    className="inline"
                  />
                </button>
              </div>
            </div>
            <p className="text-xs text-blue-700">
              DNS propagation can take up to 48 hours. Click &quot;Verify Domain&quot; to check
              status.
            </p>
          </div>
        </div>
      </div>

      {/* Domains List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Your Domains</h3>
        </div>

        {domains.length === 0 ? (
          <div className="p-6 text-center">
            <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No domains configured yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add your first custom domain above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {domains.map((domain) => {
              const status = getDomainStatus(domain);
              const StatusIcon = status.icon;
              const details = verificationDetails[domain.id];

              return (
                <div
                  key={domain.id}
                  className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{domain.domain}</h4>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-${status.color}-100 text-${status.color}-800`}>
                          <StatusIcon size={12} />
                          {status.text}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500 mb-3">
                        Added {new Date(domain.created_at).toLocaleDateString()}
                        {domain.verified_at && (
                          <span className="ml-4">
                            Verified {new Date(domain.verified_at).toLocaleDateString()}
                          </span>
                        )}
                        {domain.last_verification_attempt && !domain.verified_at && (
                          <span className="ml-4">
                            Last attempt:{" "}
                            {new Date(domain.last_verification_attempt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Verification Details */}
                      {details && (
                        <div className="mb-3 p-3 bg-gray-50 rounded border">
                          <h5 className="font-medium text-gray-700 mb-2">Verification Results:</h5>
                          <div className="text-sm space-y-1">
                            {details.details.actualIPs && (
                              <div>
                                <span className="font-medium">A Records:</span>{" "}
                                {details.details.actualIPs.join(", ") || "None found"}
                              </div>
                            )}
                            {details.details.actualCNAME && (
                              <div>
                                <span className="font-medium">CNAME:</span>{" "}
                                {details.details.actualCNAME.join(", ") || "None found"}
                              </div>
                            )}
                            {details.details.error && (
                              <div className="text-red-600">
                                <span className="font-medium">Error:</span> {details.details.error}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TXT Record Setup */}
                      {!domain.verified_at && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => generateTxtRecord(domain.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                              <Settings size={14} />
                              Alternative: Use TXT Record Verification
                            </button>
                          </div>

                          {(showTxtSetup[domain.id] || domain.verification_code) && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <h5 className="font-medium text-yellow-800 mb-2">
                                TXT Record Verification:
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">Host:</span>{" "}
                                  <code className="bg-yellow-100 px-1 rounded">
                                    _verification.{domain.domain}
                                  </code>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(`_verification.${domain.domain}`)
                                    }
                                    className="ml-2 text-yellow-600 hover:text-yellow-800">
                                    <Copy
                                      size={12}
                                      className="inline"
                                    />
                                  </button>
                                </div>
                                <div>
                                  <span className="font-medium">Value:</span>
                                  <code className="bg-yellow-100 px-1 rounded ml-1">
                                    shortener-verification={domain.verification_code}
                                  </code>
                                  {domain.verification_code && (
                                    <button
                                      onClick={() =>
                                        copyToClipboard(
                                          `shortener-verification=${domain.verification_code}`
                                        )
                                      }
                                      className="ml-2 text-yellow-600 hover:text-yellow-800">
                                      <Copy
                                        size={12}
                                        className="inline"
                                      />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!domain.verified_at && (
                        <button
                          onClick={() => handleVerifyDomain(domain.id)}
                          disabled={verifyingDomain === domain.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 text-sm flex items-center gap-2">
                          {verifyingDomain === domain.id ? (
                            <>
                              <RefreshCw
                                size={14}
                                className="animate-spin"
                              />
                              Verifying...
                            </>
                          ) : (
                            "Verify Domain"
                          )}
                        </button>
                      )}

                      {domain.verified_at && (
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          title="Test domain">
                          <ExternalLink size={16} />
                        </a>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteDomain(domain.id, domain.domain)}
                        disabled={deletingDomain === domain.id}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                        title="Delete domain">
                        {deletingDomain === domain.id ? (
                          <RefreshCw
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Success Message */}
                  {domain.verified_at && (
                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-2">✅ Domain Active</p>
                      <p className="text-sm text-green-700">
                        Your short URLs will now use:{" "}
                        <code className="bg-green-100 px-1 rounded">
                          https://{domain.domain}/shortcode
                        </code>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Domain Benefits - Keep your existing section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Why Use Custom Domains?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <Globe
                className="text-blue-600"
                size={16}
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Brand Recognition</h4>
              <p className="text-sm text-gray-600">
                Use your own domain to maintain brand consistency
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded">
              <Check
                className="text-green-600"
                size={16}
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Trust & Credibility</h4>
              <p className="text-sm text-gray-600">
                Users are more likely to click familiar domains
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded">
              <ExternalLink
                className="text-purple-600"
                size={16}
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Better Analytics</h4>
              <p className="text-sm text-gray-600">
                Track performance with your own domain metrics
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded">
              <AlertCircle
                className="text-orange-600"
                size={16}
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">No Dependencies</h4>
              <p className="text-sm text-gray-600">Your links work even if our service changes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
