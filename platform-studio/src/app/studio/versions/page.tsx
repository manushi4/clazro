"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { History, RotateCcw, Eye, ChevronRight } from "lucide-react";

type ConfigVersion = {
  version: number;
  created_at: string;
  created_by: string;
  changes_summary: {
    tabs_modified: number;
    widgets_modified: number;
    theme_changed: boolean;
  };
};

// Demo versions
const DEMO_VERSIONS: ConfigVersion[] = [
  {
    version: 5,
    created_at: new Date().toISOString(),
    created_by: "admin@example.com",
    changes_summary: {
      tabs_modified: 2,
      widgets_modified: 5,
      theme_changed: false,
    },
  },
  {
    version: 4,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    created_by: "admin@example.com",
    changes_summary: {
      tabs_modified: 0,
      widgets_modified: 3,
      theme_changed: true,
    },
  },
  {
    version: 3,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    created_by: "admin@example.com",
    changes_summary: {
      tabs_modified: 1,
      widgets_modified: 8,
      theme_changed: false,
    },
  },
  {
    version: 2,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    created_by: "admin@example.com",
    changes_summary: {
      tabs_modified: 5,
      widgets_modified: 12,
      theme_changed: true,
    },
  },
  {
    version: 1,
    created_at: new Date(Date.now() - 345600000).toISOString(),
    created_by: "admin@example.com",
    changes_summary: {
      tabs_modified: 5,
      widgets_modified: 20,
      theme_changed: true,
    },
  },
];

export default function VersionHistory() {
  const [versions] = useState<ConfigVersion[]>(DEMO_VERSIONS);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const handleRollback = (version: number) => {
    if (confirm(`Are you sure you want to rollback to version ${version}?`)) {
      alert(`Rolling back to version ${version}...`);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Version History</h1>
          <p className="text-gray-500 mt-1">
            View and rollback to previous configurations
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <History size={16} />
            <span>{versions.length} versions</span>
          </div>
        </div>

        <div className="divide-y">
          {versions.map((version, index) => (
            <div
              key={version.version}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                selectedVersion === version.version ? "bg-primary-50" : ""
              }`}
              onClick={() => setSelectedVersion(version.version)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    v{version.version}
                  </div>

                  <div>
                    <div className="font-medium text-gray-900">
                      Version {version.version}
                      {index === 0 && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(version.created_at)} by {version.created_by}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    {version.changes_summary.tabs_modified} tabs,{" "}
                    {version.changes_summary.widgets_modified} widgets
                    {version.changes_summary.theme_changed && ", theme"}
                  </div>

                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRollback(version.version);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg"
                    >
                      <RotateCcw size={14} />
                      Rollback
                    </button>
                  )}

                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
