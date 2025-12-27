"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCustomerWithConfig, fetchCustomers } from "@/services/configService";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { BasicInfoStep } from "./wizard-steps/BasicInfoStep";
import { CloneSourceStep } from "./wizard-steps/CloneSourceStep";
import { BrandingStep } from "./wizard-steps/BrandingStep";
import { ReviewStep } from "./wizard-steps/ReviewStep";

type WizardData = {
  name: string;
  slug: string;
  subscription_tier: string;
  cloneFrom: string | null;
  app_name?: string;
  logo_url?: string;
  primary_color?: string;
};

const STEPS = [
  { id: 1, title: "Basic Info", component: BasicInfoStep },
  { id: 2, title: "Clone Source", component: CloneSourceStep },
  { id: 3, title: "Branding", component: BrandingStep },
  { id: 4, title: "Review & Create", component: ReviewStep },
];

type AddSchoolWizardProps = {
  onClose: () => void;
  onSuccess: (customerId: string) => void;
};

export function AddSchoolWizard({ onClose, onSuccess }: AddSchoolWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    name: "",
    slug: "",
    subscription_tier: "free",
    cloneFrom: "default",
  });

  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const createMutation = useMutation({
    mutationFn: async (data: WizardData) => {
      return createCustomerWithConfig({
        name: data.name,
        slug: data.slug,
        subscription_tier: data.subscription_tier,
        cloneFrom: data.cloneFrom === "default" ? undefined : data.cloneFrom || undefined,
        branding: data.app_name || data.logo_url ? {
          app_name: data.app_name,
          logo_url: data.logo_url,
        } : undefined,
        theme: data.primary_color ? {
          primary_color: data.primary_color,
        } : undefined,
      });
    },
    onSuccess: (customerId) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onSuccess(customerId);
    },
    onError: (error: any) => {
      console.error("Failed to create school:", error);
      alert(`Error: ${error.message || "Failed to create school"}`);
    },
  });

  const updateData = (updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    createMutation.mutate(wizardData);
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const canProceed = validateStep(currentStep, wizardData);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New School</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={createMutation.isPending}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep > step.id
                        ? "bg-green-500 text-white"
                        : currentStep === step.id
                        ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.id ? <Check size={16} /> : step.id}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 text-center">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <CurrentStepComponent
            data={wizardData}
            updateData={updateData}
            schools={schools || []}
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-2">
            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={!canProceed || createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? "Creating..." : "Create School"}
                {!createMutation.isPending && <Check size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function validateStep(step: number, data: WizardData): boolean {
  switch (step) {
    case 1:
      return !!data.name && !!data.slug && data.slug.length >= 3;
    case 2:
      return !!data.cloneFrom;
    case 3:
      return true;
    case 4:
      return true;
    default:
      return false;
  }
}
