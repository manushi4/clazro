"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { useConfigStore } from "@/stores/configStore";
import { Building2, ChevronDown } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export function CustomerSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { customerId, setCustomerId, customers, setCustomers } = useConfigStore();

  // Fetch customers from Supabase
  const { data: fetchedCustomers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, slug, status")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data as Customer[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update store when customers are fetched
  useEffect(() => {
    if (fetchedCustomers && fetchedCustomers.length > 0) {
      setCustomers(fetchedCustomers);

      // If no customer selected, select the first one
      if (!customerId) {
        setCustomerId(fetchedCustomers[0].id);
      }
    }
  }, [fetchedCustomers, customerId, setCustomers, setCustomerId]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Building2 size={16} />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-[180px]"
      >
        <Building2 size={16} className="text-gray-500" />
        <span className="flex-1 text-left truncate">
          {selectedCustomer?.name || "Select School"}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
            {customers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  setCustomerId(customer.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                  customer.id === customerId ? "bg-primary-50 text-primary-600" : "text-gray-700"
                }`}
              >
                <Building2 size={14} className={customer.id === customerId ? "text-primary-600" : "text-gray-400"} />
                <span className="truncate">{customer.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
