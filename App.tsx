import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppProviders } from "./src/app/AppProviders";
import { AppContent } from "./src/app/AppContent";

console.log("[App] Module loaded");

/**
 * Root App component.
 * Wraps everything in providers first, then renders content.
 * Note: GlobalErrorBoundary is inside AppProviders to have access to QueryClient.
 */
const App: React.FC = () => {
  useEffect(() => {
    console.log("[App] Component mounted");
  }, []);

  console.log("[App] Rendering...");

  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;
