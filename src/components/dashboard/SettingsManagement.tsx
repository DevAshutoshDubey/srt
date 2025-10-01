"use client";

import { useState } from "react";
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

import {
  User,
  Building,
  Key,
  Shield,
  Bell,
  CreditCard,
  Save,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

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

interface SettingsManagementProps {
  profile: UserProfile;
  onProfileUpdate: () => void;
}

export default function SettingsManagement({ profile, onProfileUpdate }: SettingsManagementProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    email: profile.user.email,
  });

  // Organization form state
  const [orgForm, setOrgForm] = useState({
    name: profile.organization.name,
  });

  // API key visibility
  const [showApiKey, setShowApiKey] = useState(false);

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "organization", name: "Organization", icon: Building },
    { id: "api", name: "API Keys", icon: Key },
    { id: "security", name: "Security", icon: Shield },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "billing", name: "Billing", icon: CreditCard },
  ];

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Profile updated successfully!");
        onProfileUpdate();
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrgUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/organization", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orgForm),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Organization updated successfully!");
        onProfileUpdate();
      } else {
        setError(data.error || "Failed to update organization");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("API key copied to clipboard!");
    } catch (error) {
      setError("Failed to copy to clipboard");
    }
  };

  const regenerateApiKey = async () => {
    if (
      !confirm(
        "Are you sure you want to regenerate your API key? This will invalidate the current key."
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/organization/regenerate-key", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setMessage("API key regenerated successfully!");
        onProfileUpdate();
      } else {
        setError(data.error || "Failed to regenerate API key");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadge = (tier: string, status: string) => {
    const colors = {
      free: "bg-gray-100 text-gray-800",
      basic: "bg-blue-100 text-blue-800",
      pro: "bg-purple-100 text-purple-800",
      enterprise: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[tier as keyof typeof colors] || colors.free
        }`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
      </span>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <form
                onSubmit={handleProfileUpdate}
                className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, firstName: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                  <Save size={16} />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Account Role:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {profile.user.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">User ID:</span>
                  <span className="text-sm font-medium text-gray-900">#{profile.user.id}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "organization":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h3>
              <form
                onSubmit={handleOrgUpdate}
                className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Organization Slug
                  </label>
                  <input
                    type="text"
                    value={profile.organization.slug}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Slug cannot be changed</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                  <Save size={16} />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Plan:</span>
                  {getSubscriptionBadge(
                    profile.organization.subscriptionTier,
                    profile.organization.subscriptionStatus
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span
                    className={`text-sm font-medium ${
                      profile.organization.subscriptionStatus === "active"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                    {profile.organization.subscriptionStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Usage:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profile.organization.monthlyUrlsUsed} /{" "}
                    {profile.organization.monthlyUrlLimit > 0
                      ? profile.organization.monthlyUrlLimit
                      : "∞"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      profile.organization.monthlyUrlsUsed / profile.organization.monthlyUrlLimit >
                      0.8
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (profile.organization.monthlyUrlsUsed /
                          profile.organization.monthlyUrlLimit) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle
                    className="text-yellow-600 mr-2 mt-0.5"
                    size={16}
                  />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Keep your API key secure!</p>
                    <p>
                      Your API key provides full access to your account. Don&apos;t share it
                      publicly or include it in client-side code.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">Primary API Key</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-gray-500 hover:text-gray-700"
                      title={showApiKey ? "Hide API key" : "Show API key"}>
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(profile.organization.apiKey)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copy API key">
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={regenerateApiKey}
                      className="text-red-500 hover:text-red-700"
                      title="Regenerate API key">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
                <code className="block p-3 bg-gray-50 rounded border font-mono text-sm">
                  {showApiKey
                    ? profile.organization.apiKey
                    : profile.organization.apiKey.slice(0, 8) + "•".repeat(20)}
                </code>
                <p className="mt-2 text-xs text-gray-500">
                  Use this key in your API requests with the header:{" "}
                  <code>x-api-key: {profile.organization.apiKey.slice(0, 8)}...</code>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">URLs Created</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {profile.organization.monthlyUrlsUsed}
                  </p>
                  <p className="text-sm text-gray-500">This month</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">Rate Limit</h4>
                  <p className="text-2xl font-bold text-gray-900">100/hr</p>
                  <p className="text-sm text-gray-500">Requests per hour</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <div className="flex items-center mt-1">
                    <Check
                      className="text-green-500 mr-1"
                      size={16}
                    />
                    <p className="text-sm text-green-600">Active</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Documentation</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  Learn how to integrate with our API and manage your URLs programmatically.
                </p>
                <Link
                  href="/dashboard/docs"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View API Documentation →
                </Link>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Password & Security</h3>
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Change Password</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Update your password to keep your account secure.
                  </p>
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                    Change Password
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Add an extra layer of security to your account.
                  </p>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Enable 2FA
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Sign Out</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Sign out of your account on this device.
                  </p>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Active Sessions</h4>
                  <p className="text-sm text-gray-600 mb-4">Manage your active login sessions.</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-sm font-medium">Current Session</p>
                        <p className="text-xs text-gray-500">Chrome on Windows • Active now</p>
                      </div>
                      <span className="text-xs text-green-600">Current</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-600">
                          Receive email updates about your account
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Usage Alerts</h4>
                        <p className="text-sm text-gray-600">
                          Get notified when approaching limits
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Security Alerts</h4>
                        <p className="text-sm text-gray-600">Important security notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Product Updates</h4>
                        <p className="text-sm text-gray-600">New features and improvements</p>
                      </div>
                      <input
                        type="checkbox"
                        className="rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing & Subscription</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Current Plan</h4>
                    <p className="text-sm text-gray-600">Manage your subscription and billing</p>
                  </div>
                  {getSubscriptionBadge(
                    profile.organization.subscriptionTier,
                    profile.organization.subscriptionStatus
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly URLs:</span>
                    <span className="text-sm font-medium">
                      {profile.organization.monthlyUrlsUsed} /{" "}
                      {profile.organization.monthlyUrlLimit > 0
                        ? profile.organization.monthlyUrlLimit
                        : "Unlimited"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Custom Domains:</span>
                    <span className="text-sm font-medium">Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Analytics:</span>
                    <span className="text-sm font-medium">Included</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Upgrade Plan
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    View Billing History
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success/Error Messages */}
      {(message || error) && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
          {message || error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}>
                  <Icon size={16} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>
      </div>
    </div>
  );
}
