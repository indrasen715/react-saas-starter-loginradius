import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Globe } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Input } from "../ui/input";
import { useOrganization } from "../../contexts/OrganizationContext";

export const CreateOrganization: React.FC = () => {
  const navigate = useNavigate();
  const { createOrganization } = useOrganization();

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Organization name cannot be empty or spaces only.");
      return;
    }

    try {
      setSubmitting(true);
      await createOrganization({ name: name, domain });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to create organization. Please try again.");
      console.error("createOrganization error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Your Organization</h2>
          <p className="text-gray-600 mt-2">Set up your workspace to get started</p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Organization Name"
                name="orgName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corporation"
                required
                className="text-lg"
                disabled={submitting}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Organization Domain (optional)
                </label>
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <Input
                    name="orgDomain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="acme-corporation"
                    className="flex-1"
                    disabled={submitting}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  This is your organization identifier. You can change it later.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="w-full py-3 text-lg font-semibold rounded bg-blue-600 text-white disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                You can change these later in your organization settings.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
