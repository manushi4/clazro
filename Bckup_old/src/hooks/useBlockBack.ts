/**
 * Hardware Back Button Guard Hook
 * Prevents accidental data loss when user presses Android back button
 * Shows confirmation dialog for dirty forms
 *
 * Usage:
 * useBlockBack(isDirty, 'You have unsaved changes. Are you sure you want to leave?');
 */

import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface BlockBackOptions {
  /** Whether to block back navigation */
  enabled: boolean;
  /** Title for confirmation dialog */
  title?: string;
  /** Message for confirmation dialog */
  message?: string;
  /** Custom handler - if provided, dialog won't be shown */
  onBackPress?: () => boolean | void;
}

/**
 * Hook to block Android hardware back button with confirmation
 *
 * @param enabled - Whether to block back navigation (e.g., form is dirty)
 * @param message - Optional custom message for confirmation dialog
 * @param title - Optional custom title for confirmation dialog
 *
 * @example
 * // Basic usage - block when form is dirty
 * const [formData, setFormData] = useState({});
 * const isDirty = formData.name !== originalData.name;
 * useBlockBack(isDirty);
 *
 * @example
 * // Custom message
 * useBlockBack(
 *   hasUnsavedChanges,
 *   'You have unsaved payment information. Discard changes?',
 *   'Unsaved Payment'
 * );
 *
 * @example
 * // Custom handler (no dialog)
 * useBlockBack({
 *   enabled: isRecording,
 *   onBackPress: () => {
 *     stopRecording();
 *     return true; // Block navigation
 *   }
 * });
 */
export function useBlockBack(
  enabledOrOptions: boolean | BlockBackOptions,
  message?: string,
  title?: string
) {
  const navigation = useNavigation();

  useEffect(() => {
    // Parse options
    const options: BlockBackOptions =
      typeof enabledOrOptions === 'boolean'
        ? {
            enabled: enabledOrOptions,
            message,
            title,
          }
        : enabledOrOptions;

    const {
      enabled,
      title: optionsTitle,
      message: optionsMessage,
      onBackPress,
    } = options;

    if (!enabled) {
      return;
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If custom handler provided, use it
      if (onBackPress) {
        const result = onBackPress();
        return result === true; // Return true to block default behavior
      }

      // Show confirmation dialog
      Alert.alert(
        optionsTitle || 'Unsaved Changes',
        optionsMessage || 'You have unsaved changes. Are you sure you want to leave?',
        [
          {
            text: 'Stay',
            style: 'cancel',
            onPress: () => {
              console.log('📌 [BackGuard] User chose to stay');
            },
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              console.log('🚪 [BackGuard] User chose to leave');
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ],
        { cancelable: false }
      );

      // Block default back behavior
      return true;
    });

    // Cleanup
    return () => backHandler.remove();
  }, [enabledOrOptions, message, title, navigation]);
}

/**
 * Simple version - just pass boolean and optional message
 */
export function useConfirmBack(isDirty: boolean, customMessage?: string) {
  useBlockBack(isDirty, customMessage);
}

/**
 * Example: Form with unsaved changes protection
 *
 * ```tsx
 * const EditProfileScreen = () => {
 *   const [formData, setFormData] = useState(initialData);
 *   const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
 *
 *   // Protect against accidental data loss
 *   useBlockBack(isDirty, 'You have unsaved profile changes.');
 *
 *   return (
 *     <View>
 *       <TextInput value={formData.name} onChange={...} />
 *       <Button onPress={save}>Save</Button>
 *     </View>
 *   );
 * };
 * ```
 *
 * Example: Recording screen
 *
 * ```tsx
 * const VoiceRecorderScreen = () => {
 *   const [isRecording, setIsRecording] = useState(false);
 *
 *   useBlockBack({
 *     enabled: isRecording,
 *     onBackPress: () => {
 *       Alert.alert(
 *         'Recording in Progress',
 *         'Stop recording before leaving?',
 *         [
 *           { text: 'Keep Recording', style: 'cancel' },
 *           {
 *             text: 'Stop & Leave',
 *             onPress: () => {
 *               stopRecording();
 *               navigation.goBack();
 *             }
 *           }
 *         ]
 *       );
 *       return true; // Block default back
 *     }
 *   });
 *
 *   return <VoiceRecorder />;
 * };
 * ```
 */
