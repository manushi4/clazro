"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomers } from "@/services/configService";
import { Plus, Building2, Edit2, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { AddSchoolWizard } from "@/components/schools/AddSchoolWizard";
import { useConfigStore } from "@/stores/configStore";

type Customer = {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscription_tier?: string;
  created_at: string;
};

export default function SchoolsPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const queryClient = useQueryClient();
  const { setCustomerId } = useConfigStore();

  const { data: schools, isLoading } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const handleSchoolCreated = (newSchoolId: string) => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    setIsWizardOpen(false);
    setCustomerId(newSchoolId);
    alert("School created successfully! Switching to the new school.");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="text-gray-500 mt-1">
            Manage all schools in the platform
          </p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          Add School
        </button>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                School Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    Loading schools...
                  </div>
                </td>
              </tr>
            ) : !schools || schools.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No schools found. Create one to get started.
                </td>
              </tr>
            ) : (
              schools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{school.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {school.slug}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={school.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                    {school.subscription_tier || "free"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(school.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit school (coming soon)"
                        disabled
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete school (coming soon)"
                        disabled
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add School Wizard Modal */}
      {isWizardOpen && (
        <AddSchoolWizard
          onClose={() => setIsWizardOpen(false)}
          onSuccess={handleSchoolCreated}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isActive
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
      {status}
    </span>
  );
}
