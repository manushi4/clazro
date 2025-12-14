import { useCallback } from "react";
import { AppError } from "./AppError";
import { useConfigStore } from "../stores/configStore";
import { captureException } from "./sentry";

type ErrorContext = {
  scope?: string;
  screen?: string;
  widgetId?: string;
  extra?: Record<string, unknown>;
};

export function useHandleError() {
  const resetToSafeMode = useConfigStore((s) => s.resetToSafeMode);

  return useCallback(
    (error: unknown, ctx?: ErrorContext) => {
      const normalized =
        error instanceof AppError
          ? error
          : new AppError(error instanceof Error ? error.message : "Unknown error", { cause: error });

      // TODO: integrate Sentry/Analytics in Phase 13/12
      console.error("[AppError]", normalized.code ?? "unknown", normalized.message, {
        severity: normalized.severity,
        context: ctx,
        stack: normalized.stack,
      });
      captureException(normalized, { scope: ctx?.scope, screen: ctx?.screen, widgetId: ctx?.widgetId, extra: ctx?.extra });

      if (normalized.severity === "fatal") {
        resetToSafeMode();
      }
    },
    [resetToSafeMode]
  );
}
