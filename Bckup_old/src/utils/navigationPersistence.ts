/**
 * Navigation State Persistence
 * Saves and restores navigation state across app restarts
 * Handles deep links gracefully
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationState, PartialState, InitialState } from '@react-navigation/native';

const NAVIGATION_STATE_KEY = 'NAVIGATION_STATE_V1';

/**
 * Save navigation state to AsyncStorage
 */
export async function saveNavigationState(state: NavigationState | undefined) {
  try {
    if (!state) {
      return;
    }

    const stateString = JSON.stringify(state);
    await AsyncStorage.setItem(NAVIGATION_STATE_KEY, stateString);
    console.log('💾 [NavPersist] State saved');
  } catch (error) {
    console.error('❌ [NavPersist] Failed to save state:', error);
  }
}

/**
 * Restore navigation state from AsyncStorage
 * Returns undefined if no saved state or if expired
 */
export async function restoreNavigationState(): Promise<
  InitialState | undefined
> {
  try {
    const stateString = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);

    if (!stateString) {
      console.log('📍 [NavPersist] No saved state found');
      return undefined;
    }

    const state = JSON.parse(stateString) as NavigationState;

    console.log('💾 [NavPersist] State restored');
    return state;
  } catch (error) {
    console.error('❌ [NavPersist] Failed to restore state:', error);
    return undefined;
  }
}

/**
 * Clear saved navigation state
 * Call this on logout or when you want fresh navigation
 */
export async function clearNavigationState() {
  try {
    await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
    console.log('🗑️ [NavPersist] State cleared');
  } catch (error) {
    console.error('❌ [NavPersist] Failed to clear state:', error);
  }
}

/**
 * Check if we should restore state
 * You might want to skip restoration in some cases:
 * - App version changed (data structure might be incompatible)
 * - User logged out
 * - Deep link present (deep link should take precedence)
 */
export async function shouldRestoreNavigationState(options?: {
  hasDeepLink?: boolean;
  isLoggedIn?: boolean;
  appVersion?: string;
}): Promise<boolean> {
  const { hasDeepLink = false, isLoggedIn = true, appVersion } = options || {};

  // Don't restore if deep link present (deep link takes precedence)
  if (hasDeepLink) {
    console.log('🔗 [NavPersist] Skipping restore (deep link present)');
    return false;
  }

  // Don't restore if user not logged in
  if (!isLoggedIn) {
    console.log('🔐 [NavPersist] Skipping restore (not logged in)');
    await clearNavigationState();
    return false;
  }

  // Optional: Check app version
  if (appVersion) {
    try {
      const savedVersion = await AsyncStorage.getItem('APP_VERSION');
      if (savedVersion && savedVersion !== appVersion) {
        console.log('🔄 [NavPersist] Skipping restore (app version changed)');
        await clearNavigationState();
        await AsyncStorage.setItem('APP_VERSION', appVersion);
        return false;
      }
    } catch (error) {
      console.error('❌ [NavPersist] Version check failed:', error);
    }
  }

  return true;
}

/**
 * Example Usage in App.tsx:
 *
 * ```tsx
 * function App() {
 *   const [isReady, setIsReady] = useState(false);
 *   const [initialState, setInitialState] = useState<InitialState>();
 *
 *   useEffect(() => {
 *     const restoreState = async () => {
 *       try {
 *         // Check if we should restore
 *         const shouldRestore = await shouldRestoreNavigationState({
 *           isLoggedIn: true,
 *           appVersion: '1.0.0',
 *         });
 *
 *         if (shouldRestore) {
 *           const savedState = await restoreNavigationState();
 *           if (savedState) {
 *             setInitialState(savedState);
 *           }
 *         }
 *       } finally {
 *         setIsReady(true);
 *       }
 *     };
 *
 *     restoreState();
 *   }, []);
 *
 *   if (!isReady) {
 *     return <LoadingScreen />;
 *   }
 *
 *   return (
 *     <NavigationContainer
 *       initialState={initialState}
 *       onStateChange={(state) => {
 *         // Save state on every navigation
 *         saveNavigationState(state);
 *       }}
 *     >
 *       <ParentNavigator />
 *     </NavigationContainer>
 *   );
 * }
 * ```
 *
 * Example with deep link handling:
 *
 * ```tsx
 * const linking = {
 *   prefixes: ['myapp://'],
 *   config: { ... },
 *   async getInitialURL() {
 *     // Check if app was opened from a deep link
 *     const url = await Linking.getInitialURL();
 *     if (url) {
 *       // Deep link present - don't restore state
 *       await clearNavigationState();
 *       return url;
 *     }
 *
 *     return null;
 *   },
 * };
 *
 * <NavigationContainer
 *   linking={linking}
 *   initialState={initialState}
 *   onStateChange={saveNavigationState}
 * >
 *   <ParentNavigator />
 * </NavigationContainer>
 * ```
 *
 * Example on logout:
 *
 * ```tsx
 * const handleLogout = async () => {
 *   await clearNavigationState();
 *   await logout();
 *   navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
 * };
 * ```
 */
