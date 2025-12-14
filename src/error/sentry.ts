// Lightweight Sentry placeholder that can be swapped with @sentry/react-native later.
// Respects env settings and no-ops when DSN is missing.

type Breadcrumb = {
  category: string;
  message: string;
  level?: "info" | "warning" | "error";
  data?: Record<string, unknown>;
  timestamp?: string;
};

type UserContext = {
  id?: string | null;
  customerId?: string | null;
  role?: string | null;
};

type TagContext = Record<string, string | number | boolean | null | undefined>;

let dsn = process.env.SENTRY_DSN;
let environment = process.env.SENTRY_ENV || process.env.NODE_ENV || "development";
let release = process.env.SENTRY_RELEASE || "unknown";
let user: UserContext = {};
let tags: TagContext = {};

export function initSentry(config?: { dsn?: string; environment?: string; release?: string }) {
  dsn = config?.dsn ?? dsn;
  environment = config?.environment ?? environment;
  release = config?.release ?? release;
}

export function setUserContext(ctx: UserContext) {
  user = { ...user, ...ctx };
}

export function setTags(extra: TagContext) {
  tags = { ...tags, ...extra };
}

export function addBreadcrumb(breadcrumb: Breadcrumb) {
  if (!dsn) return;
  // Breadcrumb logged to Sentry when DSN is configured
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!dsn) {
    console.error("[sentry disabled] exception", error);
    return;
  }
  console.error("[sentry capture]", {
    error,
    user,
    tags,
    environment,
    release,
    context,
    timestamp: new Date().toISOString(),
  });
}
