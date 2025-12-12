import React from "react";
import { View, StyleSheet, Button } from "react-native";
import { useAppTheme } from "../theme/useAppTheme";
import { useHandleError } from "./useHandleError";
import { useConfigStore } from "../stores/configStore";
import { AppText } from "../ui/components/AppText";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

class BoundaryInner extends React.Component<
  Props & { onErrorCaptured: (error: Error) => void; onReset: () => void; colors: ReturnType<typeof useAppTheme>["colors"] }
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    console.error("[GlobalErrorBoundary] Caught error:", error.message);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[GlobalErrorBoundary] componentDidCatch:", error.message);
    console.error("[GlobalErrorBoundary] Component stack:", errorInfo.componentStack);
    this.props.onErrorCaptured(error);
  }

  render() {
    const { hasError, error } = this.state;
    const { children, colors, onReset } = this.props;
    if (!hasError) return children;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppText variant="title" style={[styles.title, { color: colors.onBackground }]}>Something went wrong</AppText>
        <AppText style={[styles.message, { color: colors.onSurfaceVariant }]}>{error?.message ?? "Unexpected error"}</AppText>
        <Button title="Restart App" onPress={onReset} color={colors.primary} />
      </View>
    );
  }
}

export const GlobalErrorBoundary: React.FC<Props> = ({ children }) => {
  const { colors } = useAppTheme();
  const handleError = useHandleError();
  const resetToSafeMode = useConfigStore((s) => s.resetToSafeMode);

  const onReset = () => {
    resetToSafeMode();
  };

  return (
    <BoundaryInner
      colors={colors}
      onErrorCaptured={(err) => {
        console.error("[GlobalErrorBoundary] Error captured:", err.message);
        handleError(err, { scope: "global" });
      }}
      onReset={onReset}
    >
      {children}
    </BoundaryInner>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
  },
});
