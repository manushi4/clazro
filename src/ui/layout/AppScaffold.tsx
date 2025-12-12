import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, ViewProps, I18nManager } from "react-native";
import { useAppTheme } from "../../theme/useAppTheme";
import { OfflineBanner } from "../../offline/OfflineBanner";

type Props = ViewProps & {
  scrollable?: boolean;
};

export const AppScaffold: React.FC<Props> = ({ children, scrollable = true, style }) => {
  const { colors } = useAppTheme();
  const Container = scrollable ? ScrollView : SafeAreaView;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <Container contentContainerStyle={[styles.content, style]}>
        {children}
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
});
