import React from "react";
import { View, StyleSheet } from "react-native";
import { useAppTheme } from "../theme/useAppTheme";
import { useHandleError } from "./useHandleError";
import { AppText } from "../ui/components/AppText";

type Props = {
  screenId: string;
  children: React.ReactNode;
};

type State = { hasError: boolean; error?: Error };

export class ScreenErrorBoundary extends React.Component<
  Props & { onErrorCaptured: (error: Error) => void; colors: ReturnType<typeof useAppTheme>["colors"] },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onErrorCaptured(error);
  }

  render() {
    const { hasError, error } = this.state;
    const { children, colors, screenId } = this.props;
    if (!hasError) return children;
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <AppText variant="title" style={[styles.title, { color: colors.onSurface }]}>Screen error</AppText>
        <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{screenId}</AppText>
        <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{error?.message}</AppText>
      </View>
    );
  }
}

export const ScreenErrorBoundaryWrapper: React.FC<Props> = ({ children, screenId }) => {
  const { colors } = useAppTheme();
  const handleError = useHandleError();

  return (
    <ScreenErrorBoundary
      screenId={screenId}
      colors={colors}
      onErrorCaptured={(err) => handleError(err, { scope: "screen", screen: screenId })}
    >
      {children}
    </ScreenErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
});
