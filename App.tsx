import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { AppProviders } from "./src/app/AppProviders";
import { AppContent } from "./src/app/AppContent";
import { ResponsiveProvider } from "./src/context/ResponsiveContext";

console.log("[App] Module loaded");

/**
 * Root App component.
 * Wraps everything in providers first, then renders content.
 * Note: GlobalErrorBoundary is inside AppProviders to have access to QueryClient.
 * ResponsiveProvider wraps only on web for responsive layouts.
 */
const App: React.FC = () => {
  useEffect(() => {
    console.log("[App] Component mounted");
  }, []);

  console.log("[App] Rendering...");

  const content = (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );

  // Wrap with ResponsiveProvider only on web
  if (Platform.OS === 'web') {
    return <ResponsiveProvider>{content}</ResponsiveProvider>;
  }

  return content;
};

export default App;
