export type AppErrorSeverity = "fatal" | "error" | "warn" | "info";

export class AppError extends Error {
  code?: string;
  severity: AppErrorSeverity;
  context?: Record<string, unknown>;

  constructor(message: string, opts?: { code?: string; severity?: AppErrorSeverity; context?: Record<string, unknown>; cause?: unknown }) {
    super(message);
    this.name = "AppError";
    this.code = opts?.code;
    this.severity = opts?.severity ?? "error";
    this.context = opts?.context;
    if (opts?.cause) {
      // @ts-expect-error: cause is allowed in modern runtimes
      this.cause = opts.cause;
    }
  }
}
