import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { captureException, addBreadcrumb } from "../../../error/sentry";
import { AppText } from "../../../ui/components/AppText";

type Props = {
  children: React.ReactNode;
  colors?: {
    error: string;
    errorContainer: string;
    onErrorContainer: string;
  };
  roundness?: number;
};

type State = {
  hasError: boolean;
};

export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("Widget error", error, info);
    addBreadcrumb({
      category: "widget",
      message: "widget_error",
      level: "error",
      data: { info },
    });
    captureException(error, { scope: "widget", info });
  }

  render() {
    const colors = this.props.colors || {
      error: "#b91c1c",
      errorContainer: "#fef2f2",
      onErrorContainer: "#7f1d1d",
    };
    const roundness = this.props.roundness ?? 10;
    if (this.state.hasError) {
      return (
        <View
          style={[
            styles.fallback,
            {
              backgroundColor: colors.errorContainer,
              borderColor: colors.error,
              borderRadius: roundness,
            },
          ]}
        >
          <AppText style={[styles.title, { color: colors.onErrorContainer }]}>This widget failed to load</AppText>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  title: {
    color: "#b91c1c",
    fontWeight: "600",
  },
});
