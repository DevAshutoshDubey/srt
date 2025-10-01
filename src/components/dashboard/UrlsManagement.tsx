"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Link,
  Copy,
  ExternalLink,
  BarChart3,
  Calendar,
  Globe,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
} from "lucide-react";
import SessionCreateUrlForm from "./SessionCreateUrlForm";

interface Url {
  id: number;
  short_code: string;
  original_url: string;
  click_count: number;
  created_at: string;
  expires_at?: string;
  domain?: string;
}

interface Domain {
  id: number;
  domain: string;
  is_active: boolean;
  verified_at: string | null;
}

export default function UrlsManagement() {
  const [urls, setUrls] = useState<Url[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "click_count">("created_at");
  const [filterDomain, setFilterDomain] = useState<string>("all");

  useEffect(() => {
    loadUrls();
    loadDomains();
  }, []);

  const loadUrls = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/urls");
      const data = await response.json();

      if (data.success) {
        setUrls(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load URLs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDomains = async () => {
    try {
      const response = await fetch("/api/domains");
      const data = await response.json();

      if (data.success) {
        const verifiedDomains = data.data.filter((d: Domain) => d.verified_at);
        setDomains(verifiedDomains);
      }
    } catch (error) {
      console.error("Failed to load domains:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getShortUrl = (url: Url) => {
    const domain = url.domain || "localhost:3000";
    const protocol = domain.includes("localhost") ? "http" : "https";
    return `${protocol}://${domain}/${url.short_code}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAndSortedUrls = urls
    .filter((url) => {
      const matchesSearch =
        !searchQuery ||
        url.original_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        url.short_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDomain =
        filterDomain === "all" ||
        (filterDomain === "default" && !url.domain) ||
        url.domain === filterDomain;

      return matchesSearch && matchesDomain;
    })
    .sort((a, b) => {
      if (sortBy === "click_count") {
        return b.click_count - a.click_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-gray-200 h-64 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "created_at" | "click_count")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="created_at">Latest First</option>
            <option value="click_count">Most Clicks</option>
          </select>

          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Domains</option>
            <option value="default">Default Domain</option>
            {domains.map((domain) => (
              <option
                key={domain.id}
                value={domain.domain}>
                {domain.domain}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          Create URL
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="border rounded-lg p-1">
          <SessionCreateUrlForm
            onUrlCreated={() => {
              loadUrls();
              setShowCreateForm(false);
            }}
          />
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Link
              className="text-blue-500 mr-3"
              size={24}
            />
            <div>
              <p className="text-sm text-gray-500">Total URLs</p>
              <p className="text-2xl font-bold">{urls.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BarChart3
              className="text-green-500 mr-3"
              size={24}
            />
            <div>
              <p className="text-sm text-gray-500">Total Clicks</p>
              <p className="text-2xl font-bold">
                {urls.reduce((sum, url) => sum + url.click_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Globe
              className="text-purple-500 mr-3"
              size={24}
            />
            <div>
              <p className="text-sm text-gray-500">Active Domains</p>
              <p className="text-2xl font-bold">{domains.length + 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* URLs List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Your URLs ({filteredAndSortedUrls.length})
          </h2>
        </div>

        {filteredAndSortedUrls.length === 0 ? (
          <div className="p-12 text-center">
            <Link className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filterDomain !== "all"
                ? "No URLs match your filters"
                : "No URLs created yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || filterDomain !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first short URL to get started"}
            </p>
            {!searchQuery && filterDomain === "all" && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={16} />
                Create Your First URL
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedUrls.map((url) => (
              <div
                key={url.id}
                className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Short URL */}
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-lg font-medium text-blue-600 font-mono">
                        {getShortUrl(url)}
                      </code>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(getShortUrl(url))}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Copy to clipboard">
                          <Copy size={16} />
                        </button>
                        <a
                          href={getShortUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Open URL">
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>

                    {/* Original URL */}
                    <p className="text-gray-600 truncate mb-3 max-w-2xl">→ {url.original_url}</p>

                    {/* Stats and Meta */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <BarChart3 size={14} />
                        <span>{url.click_count} clicks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Created {formatDate(url.created_at)}</span>
                      </div>
                      {url.domain && (
                        <div className="flex items-center gap-1">
                          <Globe size={14} />
                          <span>{url.domain}</span>
                        </div>
                      )}
                      {url.expires_at && (
                        <div
                          className={`flex items-center gap-1 ${
                            new Date(url.expires_at) < new Date()
                              ? "text-red-500"
                              : new Date(url.expires_at).getTime() - new Date().getTime() < 86400000 // 24 hours
                              ? "text-orange-500"
                              : "text-yellow-600"
                          }`}>
                          <Calendar size={14} />
                          <span>
                            {new Date(url.expires_at) < new Date()
                              ? "Expired"
                              : `Expires ${formatDate(url.expires_at)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{url.click_count}</div>
                      <div className="text-sm text-gray-500">clicks</div>
                    </div>

                    <div className="relative">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                      </button>
                      {/* Dropdown menu would go here */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination (if needed) */}
      {filteredAndSortedUrls.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Showing {filteredAndSortedUrls.length} of {urls.length} URLs
          </p>
          {/* Add pagination controls here if needed */}
        </div>
      )}
    </div>
  );
}
