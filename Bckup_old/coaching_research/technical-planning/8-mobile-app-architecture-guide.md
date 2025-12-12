# Mobile App Architecture & Development Guide
## Coaching Management Mobile App - React Native Implementation Specifications

### Executive Summary
This document provides comprehensive mobile app architecture specifications, including React Native project structure, state management, navigation patterns, offline capabilities, and performance optimization strategies for the Coaching Management Mobile App.

---

## 1. React Native Project Architecture

### 1.1 Project Structure

**Scalable Folder Organization**
```
coaching-mobile-app/
├── android/                     # Android-specific code
├── ios/                        # iOS-specific code
├── src/                        # Source code
│   ├── api/                    # API layer
│   │   ├── client.ts           # HTTP client configuration
│   │   ├── endpoints.ts        # API endpoints
│   │   ├── types.ts           # API response types
│   │   └── services/          # API service modules
│   │       ├── authService.ts
│   │       ├── studentService.ts
│   │       ├── teacherService.ts
│   │       ├── paymentService.ts
│   │       └── aiService.ts
│   │
│   ├── components/             # Reusable components
│   │   ├── common/            # Generic components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── LoadingSpinner/
│   │   │   └── ErrorBoundary/
│   │   ├── forms/             # Form components
│   │   │   ├── LoginForm/
│   │   │   ├── AssignmentForm/
│   │   │   └── PaymentForm/
│   │   └── layout/            # Layout components
│   │       ├── Header/
│   │       ├── TabBar/
│   │       └── Drawer/
│   │
│   ├── screens/               # Screen components
│   │   ├── Auth/             # Authentication screens
│   │   │   ├── LoginScreen/
│   │   │   ├── RegisterScreen/
│   │   │   └── ForgotPasswordScreen/
│   │   ├── Student/          # Student-specific screens
│   │   │   ├── DashboardScreen/
│   │   │   ├── AssignmentScreen/
│   │   │   ├── ScheduleScreen/
│   │   │   └── DoubtScreen/
│   │   ├── Teacher/          # Teacher-specific screens
│   │   ├── Parent/           # Parent-specific screens
│   │   └── Shared/           # Common screens
│   │
│   ├── navigation/           # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── StudentNavigator.tsx
│   │   ├── TeacherNavigator.tsx
│   │   └── ParentNavigator.tsx
│   │
│   ├── store/               # State management
│   │   ├── index.ts         # Store configuration
│   │   ├── rootReducer.ts   # Root reducer
│   │   └── slices/          # Redux Toolkit slices
│   │       ├── authSlice.ts
│   │       ├── userSlice.ts
│   │       ├── studentSlice.ts
│   │       ├── assignmentSlice.ts
│   │       └── notificationSlice.ts
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useOffline.ts
│   │   ├── useNotifications.ts
│   │   └── useSocket.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── storage.ts
│   │
│   ├── services/            # App services
│   │   ├── authService.ts
│   │   ├── storageService.ts
│   │   ├── notificationService.ts
│   │   ├── offlineService.ts
│   │   ├── socketService.ts
│   │   └── analyticsService.ts
│   │
│   ├── types/               # TypeScript definitions
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── navigation.ts
│   │   ├── user.ts
│   │   └── assignment.ts
│   │
│   ├── assets/              # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   ├── fonts/
│   │   └── animations/
│   │
│   └── styles/              # Styling
│       ├── theme.ts         # Design system
│       ├── colors.ts        # Color palette
│       ├── typography.ts    # Typography scale
│       ├── spacing.ts       # Spacing system
│       └── components/      # Component styles
│
├── __tests__/               # Test files
├── .env.example            # Environment variables template
├── app.json               # Expo configuration
├── metro.config.js        # Metro bundler config
├── babel.config.js        # Babel configuration
└── package.json           # Dependencies
```

### 1.2 Core Configuration Files

**Metro Bundler Configuration**
```javascript
// metro.config.js
const {getDefaultConfig} = require('metro-config');

module.exports = (async () => {
  const {
    resolver: {sourceExts, assetExts},
  } = await getDefaultConfig();
  
  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
      // Enable Hermes for better performance
      hermesCommand: 'hermes',
      minifierConfig: {
        mangle: {
          keep_fnames: true,
        },
        output: {
          ascii_only: true,
          quote_keys: false,
          wrap_iife: true,
        },
        sourceMap: {
          includeSources: false,
        },
      },
    },
    resolver: {
      sourceExts: process.env.NODE_ENV === 'test' ? ['e2e.js'].concat(sourceExts) : sourceExts,
      assetExts: assetExts.filter(ext => ext !== 'svg').concat(['svg']),
    },
    serializer: {
      // Custom module ID factory for better caching
      createModuleIdFactory: () => {
        const fileToIdMap = new Map();
        let nextId = 0;
        return (path) => {
          if (!fileToIdMap.has(path)) {
            fileToIdMap.set(path, nextId++);
          }
          return fileToIdMap.get(path);
        };
      },
    },
  };
})();
```

**Babel Configuration**
```javascript
// babel.config.js
module.exports = {
  presets: [
    ['module:metro-react-native-babel-preset', {useTransformReactJSXExperimental: true}],
    '@babel/preset-typescript',
  ],
  plugins: [
    [
      '@babel/plugin-transform-react-jsx',
      {
        runtime: 'automatic',
      },
    ],
    ['module-resolver', {
      root: ['./src'],
      alias: {
        '@': './src',
        '@components': './src/components',
        '@screens': './src/screens',
        '@navigation': './src/navigation',
        '@store': './src/store',
        '@hooks': './src/hooks',
        '@utils': './src/utils',
        '@services': './src/services',
        '@types': './src/types',
        '@assets': './src/assets',
        '@styles': './src/styles',
      },
    }],
    'react-native-reanimated/plugin', // Must be last
  ],
  env: {
    production: {
      plugins: [
        'transform-remove-console',
        'react-native-paper/babel',
      ],
    },
  },
};
```

---

## 2. Design System and Theming

### 2.1 Design System Implementation

**Theme Configuration**
```typescript
// src/styles/theme.ts
import {DefaultTheme} from 'react-native-paper';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // Primary colors
    primary: '#4A90E2',
    primaryDark: '#2E5BDA',
    primaryLight: '#7BB3F0',
    
    // Secondary colors
    secondary: '#50C878',
    secondaryDark: '#2E8B57',
    secondaryLight: '#90EE90',
    
    // Accent colors
    accent: '#FF6B35',
    accentLight: '#FF8C69',
    
    // Neutral colors
    background: '#FFFFFF',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    
    // Text colors
    text: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    
    // State colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    // Role-specific colors
    student: '#4A90E2',
    teacher: '#9C27B0',
    parent: '#FF9800',
    admin: '#607D8B',
    
    // Border colors
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
  },
  roundness: 8,
  // Custom theme extensions
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semiBold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      title: 28,
      heading: 32,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      loose: 1.75,
    },
  },
  shadows: {
    small: {
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    // Dark theme overrides
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textMuted: '#999999',
    border: '#333333',
    borderLight: '#2A2A2A',
  },
};

export type AppTheme = typeof lightTheme;
```

**Typography System**
```typescript
// src/styles/typography.ts
import {StyleSheet} from 'react-native';
import {AppTheme} from './theme';

export const createTypographyStyles = (theme: AppTheme) =>
  StyleSheet.create({
    // Headings
    h1: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.heading,
      lineHeight: theme.typography.fontSize.heading * theme.typography.lineHeight.tight,
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.title,
      lineHeight: theme.typography.fontSize.title * theme.typography.lineHeight.tight,
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    h3: {
      fontFamily: theme.typography.fontFamily.semiBold,
      fontSize: theme.typography.fontSize.xl,
      lineHeight: theme.typography.fontSize.xl * theme.typography.lineHeight.normal,
      color: theme.colors.text,
    },
    h4: {
      fontFamily: theme.typography.fontFamily.semiBold,
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
      color: theme.colors.text,
    },
    
    // Body text
    bodyLarge: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
      color: theme.colors.text,
    },
    body: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
      color: theme.colors.text,
    },
    bodySmall: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
      color: theme.colors.textSecondary,
    },
    
    // Labels and captions
    label: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.md,
      lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
      color: theme.colors.text,
    },
    labelSmall: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
      color: theme.colors.text,
    },
    caption: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.xs,
      lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.normal,
      color: theme.colors.textMuted,
    },
    
    // Interactive elements
    button: {
      fontFamily: theme.typography.fontFamily.semiBold,
      fontSize: theme.typography.fontSize.md,
      lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.tight,
      textAlign: 'center' as const,
    },
    link: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.md,
      lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
      color: theme.colors.primary,
      textDecorationLine: 'underline' as const,
    },
  });
```

### 2.2 Component Library

**Base Button Component**
```typescript
// src/components/common/Button/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '@react-navigation/native';
import {AppTheme} from '@styles/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  testID,
}) => {
  const theme = useTheme() as AppTheme;
  const styles = createStyles(theme);

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.surface : theme.colors.primary}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    base: {
      borderRadius: theme.roundness,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...theme.shadows.small,
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    
    // Variants
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    text: {
      backgroundColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0,
    },
    
    // Sizes
    small: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      minHeight: 32,
    },
    medium: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: 44,
    },
    large: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      minHeight: 52,
    },
    
    // Text styles
    primaryText: {
      color: theme.colors.surface,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    secondaryText: {
      color: theme.colors.surface,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    outlineText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    textText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.medium,
    },
    
    smallText: {
      fontSize: theme.typography.fontSize.sm,
    },
    mediumText: {
      fontSize: theme.typography.fontSize.md,
    },
    largeText: {
      fontSize: theme.typography.fontSize.lg,
    },
    
    // Disabled states
    disabled: {
      opacity: 0.6,
    },
    disabledText: {
      color: theme.colors.textMuted,
    },
  });
```

---

## 3. State Management Architecture

### 3.1 Redux Toolkit Setup

**Store Configuration**
```typescript
// src/store/index.ts
import {configureStore} from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {rootReducer} from './rootReducer';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'settings', 'offline'], // Persist these reducers
  blacklist: ['api'], // Don't persist these reducers
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat([
      // Add custom middleware here
    ]),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Root Reducer**
```typescript
// src/store/rootReducer.ts
import {combineReducers} from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import studentSlice from './slices/studentSlice';
import teacherSlice from './slices/teacherSlice';
import assignmentSlice from './slices/assignmentSlice';
import classSlice from './slices/classSlice';
import messageSlice from './slices/messageSlice';
import notificationSlice from './slices/notificationSlice';
import paymentSlice from './slices/paymentSlice';
import offlineSlice from './slices/offlineSlice';
import settingsSlice from './slices/settingsSlice';

export const rootReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  student: studentSlice,
  teacher: teacherSlice,
  assignment: assignmentSlice,
  class: classSlice,
  message: messageSlice,
  notification: notificationSlice,
  payment: paymentSlice,
  offline: offlineSlice,
  settings: settingsSlice,
});
```

### 3.2 Feature-Specific Slices

**Authentication Slice**
```typescript
// src/store/slices/authSlice.ts
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {authService} from '@services/authService';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: string | null;
  };
  biometricEnabled: boolean;
  loginAttempts: number;
  lastLoginAttempt: string | null;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  tokens: {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  },
  biometricEnabled: false,
  loginAttempts: 0,
  lastLoginAttempt: null,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (
    credentials: {email: string; password: string; rememberMe?: boolean},
    {rejectWithValue}
  ) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterUserData, {rejectWithValue}) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const refreshTokens = createAsyncThunk(
  'auth/refreshTokens',
  async (_, {getState, rejectWithValue}) => {
    try {
      const state = getState() as RootState;
      const refreshToken = state.auth.tokens.refreshToken;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authService.refreshToken(refreshToken);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, {getState}) => {
    const state = getState() as RootState;
    const refreshToken = state.auth.tokens.refreshToken;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
  }
);

export const enableBiometric = createAsyncThunk(
  'auth/enableBiometric',
  async (_, {rejectWithValue}) => {
    try {
      const isSupported = await authService.isBiometricSupported();
      if (!isSupported) {
        throw new Error('Biometric authentication not supported');
      }
      
      const isEnrolled = await authService.isBiometricEnrolled();
      if (!isEnrolled) {
        throw new Error('No biometric data enrolled');
      }
      
      await authService.enableBiometric();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTokens: (state, action: PayloadAction<{accessToken: string; expiresAt: string}>) => {
      state.tokens.accessToken = action.payload.accessToken;
      state.tokens.expiresAt = action.payload.expiresAt;
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.loginAttempts += 1;
        state.lastLoginAttempt = new Date().toISOString();
      });

    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh tokens
    builder
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.tokens = action.payload.tokens;
      })
      .addCase(refreshTokens.rejected, (state) => {
        // Token refresh failed, logout user
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = initialState.tokens;
      });

    // Logout user
    builder.addCase(logoutUser.fulfilled, (state) => {
      return initialState;
    });

    // Enable biometric
    builder
      .addCase(enableBiometric.fulfilled, (state) => {
        state.biometricEnabled = true;
      })
      .addCase(enableBiometric.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {clearError, updateTokens, resetLoginAttempts, incrementLoginAttempts} =
  authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAccessToken = (state: RootState) => state.auth.tokens.accessToken;
```

**Assignment Management Slice**
```typescript
// src/store/slices/assignmentSlice.ts
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {assignmentService} from '@api/services/assignmentService';

export interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  submissions: AssignmentSubmission[];
  loading: {
    assignments: boolean;
    submission: boolean;
    grading: boolean;
  };
  error: string | null;
  filters: {
    status: 'all' | 'pending' | 'submitted' | 'graded';
    subject: string | null;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: AssignmentState = {
  assignments: [],
  currentAssignment: null,
  submissions: [],
  loading: {
    assignments: false,
    submission: false,
    grading: false,
  },
  error: null,
  filters: {
    status: 'all',
    subject: null,
    dateRange: {
      start: null,
      end: null,
    },
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
};

// Async thunks
export const fetchAssignments = createAsyncThunk(
  'assignment/fetchAssignments',
  async (
    params: {
      page?: number;
      filters?: Partial<AssignmentState['filters']>;
      refresh?: boolean;
    } = {},
    {getState, rejectWithValue}
  ) => {
    try {
      const state = getState() as RootState;
      const currentFilters = {...state.assignment.filters, ...params.filters};
      const page = params.page || 1;
      
      const response = await assignmentService.getAssignments({
        page,
        limit: state.assignment.pagination.limit,
        ...currentFilters,
      });
      
      return {
        assignments: response.data,
        pagination: response.pagination,
        page,
        refresh: params.refresh || false,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAssignmentDetails = createAsyncThunk(
  'assignment/fetchAssignmentDetails',
  async (assignmentId: string, {rejectWithValue}) => {
    try {
      const response = await assignmentService.getAssignmentById(assignmentId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitAssignment = createAsyncThunk(
  'assignment/submitAssignment',
  async (
    data: {
      assignmentId: string;
      content: string;
      attachments?: File[];
    },
    {rejectWithValue}
  ) => {
    try {
      const response = await assignmentService.submitAssignment(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const gradeAssignment = createAsyncThunk(
  'assignment/gradeAssignment',
  async (
    data: {
      submissionId: string;
      marks: number;
      feedback: string;
    },
    {rejectWithValue}
  ) => {
    try {
      const response = await assignmentService.gradeAssignment(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<AssignmentState['filters']>>) => {
      state.filters = {...state.filters, ...action.payload};
      state.pagination.page = 1; // Reset to first page
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    setCurrentAssignment: (state, action: PayloadAction<Assignment | null>) => {
      state.currentAssignment = action.payload;
    },
    updateAssignmentInList: (state, action: PayloadAction<Assignment>) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index >= 0) {
        state.assignments[index] = action.payload;
      }
    },
    addSubmission: (state, action: PayloadAction<AssignmentSubmission>) => {
      const existingIndex = state.submissions.findIndex(
        s => s.id === action.payload.id
      );
      
      if (existingIndex >= 0) {
        state.submissions[existingIndex] = action.payload;
      } else {
        state.submissions.unshift(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch assignments
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.loading.assignments = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading.assignments = false;
        
        if (action.payload.refresh || action.payload.page === 1) {
          state.assignments = action.payload.assignments;
        } else {
          state.assignments.push(...action.payload.assignments);
        }
        
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
          page: action.payload.page,
        };
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading.assignments = false;
        state.error = action.payload as string;
      });

    // Fetch assignment details
    builder
      .addCase(fetchAssignmentDetails.fulfilled, (state, action) => {
        state.currentAssignment = action.payload;
        
        // Update in list if exists
        const index = state.assignments.findIndex(a => a.id === action.payload.id);
        if (index >= 0) {
          state.assignments[index] = action.payload;
        }
      });

    // Submit assignment
    builder
      .addCase(submitAssignment.pending, (state) => {
        state.loading.submission = true;
        state.error = null;
      })
      .addCase(submitAssignment.fulfilled, (state, action) => {
        state.loading.submission = false;
        
        // Add submission to list
        const existingIndex = state.submissions.findIndex(
          s => s.assignmentId === action.payload.assignmentId
        );
        
        if (existingIndex >= 0) {
          state.submissions[existingIndex] = action.payload;
        } else {
          state.submissions.unshift(action.payload);
        }
      })
      .addCase(submitAssignment.rejected, (state, action) => {
        state.loading.submission = false;
        state.error = action.payload as string;
      });

    // Grade assignment
    builder
      .addCase(gradeAssignment.pending, (state) => {
        state.loading.grading = true;
      })
      .addCase(gradeAssignment.fulfilled, (state, action) => {
        state.loading.grading = false;
        
        // Update submission in list
        const index = state.submissions.findIndex(s => s.id === action.payload.id);
        if (index >= 0) {
          state.submissions[index] = action.payload;
        }
      })
      .addCase(gradeAssignment.rejected, (state, action) => {
        state.loading.grading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setCurrentAssignment,
  updateAssignmentInList,
  addSubmission,
} = assignmentSlice.actions;

export default assignmentSlice.reducer;

// Selectors
export const selectAssignments = (state: RootState) => state.assignment.assignments;
export const selectCurrentAssignment = (state: RootState) => state.assignment.currentAssignment;
export const selectAssignmentSubmissions = (state: RootState) => state.assignment.submissions;
export const selectAssignmentLoading = (state: RootState) => state.assignment.loading;
export const selectAssignmentError = (state: RootState) => state.assignment.error;
export const selectAssignmentFilters = (state: RootState) => state.assignment.filters;
export const selectAssignmentPagination = (state: RootState) => state.assignment.pagination;

// Memoized selectors
export const selectFilteredAssignments = createSelector(
  [selectAssignments, selectAssignmentFilters],
  (assignments, filters) => {
    return assignments.filter(assignment => {
      // Apply status filter
      if (filters.status !== 'all') {
        if (assignment.status !== filters.status) {
          return false;
        }
      }
      
      // Apply subject filter
      if (filters.subject && assignment.subject.id !== filters.subject) {
        return false;
      }
      
      // Apply date range filter
      if (filters.dateRange.start && assignment.dueDate < filters.dateRange.start) {
        return false;
      }
      
      if (filters.dateRange.end && assignment.dueDate > filters.dateRange.end) {
        return false;
      }
      
      return true;
    });
  }
);
```

---

## 4. Navigation Architecture

### 4.1 Navigation Structure

**Main App Navigator**
```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {AuthNavigator} from './AuthNavigator';
import {StudentNavigator} from './StudentNavigator';
import {TeacherNavigator} from './TeacherNavigator';
import {ParentNavigator} from './ParentNavigator';
import {AdminNavigator} from './AdminNavigator';
import {LoadingScreen} from '@screens/LoadingScreen';
import {selectAuth} from '@store/slices/authSlice';
import {navigationRef} from './NavigationService';
import {linking} from './LinkingConfig';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  const {isAuthenticated, isLoading, user} = useSelector(selectAuth);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            {user?.role === 'student' && (
              <Stack.Screen name="Student" component={StudentNavigator} />
            )}
            {user?.role === 'teacher' && (
              <Stack.Screen name="Teacher" component={TeacherNavigator} />
            )}
            {user?.role === 'parent' && (
              <Stack.Screen name="Parent" component={ParentNavigator} />
            )}
            {user?.role === 'admin' && (
              <Stack.Screen name="Admin" component={AdminNavigator} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

**Role-specific Navigation**
```typescript
// src/navigation/StudentNavigator.tsx
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import {StudentDashboardScreen} from '@screens/Student/DashboardScreen';
import {AssignmentListScreen} from '@screens/Student/AssignmentListScreen';
import {AssignmentDetailScreen} from '@screens/Student/AssignmentDetailScreen';
import {ScheduleScreen} from '@screens/Student/ScheduleScreen';
import {GradesScreen} from '@screens/Student/GradesScreen';
import {DoubtScreen} from '@screens/Student/DoubtScreen';
import {ProfileScreen} from '@screens/Student/ProfileScreen';
import {ClassroomScreen} from '@screens/Student/ClassroomScreen';
import {PaymentScreen} from '@screens/Student/PaymentScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="DashboardHome"
      component={StudentDashboardScreen}
      options={{title: 'Dashboard'}}
    />
    <Stack.Screen
      name="ClassroomDetail"
      component={ClassroomScreen}
      options={{title: 'Live Class'}}
    />
  </Stack.Navigator>
);

const AssignmentStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="AssignmentList"
      component={AssignmentListScreen}
      options={{title: 'Assignments'}}
    />
    <Stack.Screen
      name="AssignmentDetail"
      component={AssignmentDetailScreen}
      options={{title: 'Assignment Details'}}
    />
  </Stack.Navigator>
);

const ScheduleStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ScheduleHome"
      component={ScheduleScreen}
      options={{title: 'Schedule'}}
    />
  </Stack.Navigator>
);

const GradesStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="GradesHome"
      component={GradesScreen}
      options={{title: 'Grades'}}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileHome"
      component={ProfileScreen}
      options={{title: 'Profile'}}
    />
    <Stack.Screen
      name="DoubtHistory"
      component={DoubtScreen}
      options={{title: 'My Doubts'}}
    />
    <Stack.Screen
      name="PaymentHistory"
      component={PaymentScreen}
      options={{title: 'Payments'}}
    />
  </Stack.Navigator>
);

export const StudentNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Assignments':
              iconName = focused ? 'book-open' : 'book-open-outline';
              break;
            case 'Schedule':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Grades':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text + '80',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Assignments" component={AssignmentStack} />
      <Tab.Screen name="Schedule" component={ScheduleStack} />
      <Tab.Screen name="Grades" component={GradesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};
```

### 4.2 Deep Linking and Navigation Service

**Deep Linking Configuration**
```typescript
// src/navigation/LinkingConfig.ts
import {LinkingOptions} from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: ['coachingapp://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          ResetPassword: 'reset-password/:token',
        },
      },
      Student: {
        screens: {
          Dashboard: {
            screens: {
              DashboardHome: 'dashboard',
              ClassroomDetail: 'class/:classId',
            },
          },
          Assignments: {
            screens: {
              AssignmentList: 'assignments',
              AssignmentDetail: 'assignments/:assignmentId',
            },
          },
          Schedule: 'schedule',
          Grades: 'grades',
          Profile: {
            screens: {
              ProfileHome: 'profile',
              DoubtHistory: 'doubts',
              PaymentHistory: 'payments',
            },
          },
        },
      },
      Teacher: {
        screens: {
          Dashboard: 'teacher/dashboard',
          Classes: 'teacher/classes',
          Students: 'teacher/students',
          Assignments: {
            screens: {
              AssignmentList: 'teacher/assignments',
              AssignmentDetail: 'teacher/assignments/:assignmentId',
              CreateAssignment: 'teacher/assignments/create',
            },
          },
        },
      },
      Parent: {
        screens: {
          Dashboard: 'parent/dashboard',
          Children: 'parent/children',
          Payments: 'parent/payments',
          Reports: 'parent/reports',
        },
      },
    },
  },
};
```

**Navigation Service**
```typescript
// src/navigation/NavigationService.ts
import {createNavigationContainerRef, StackActions, CommonActions} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

class NavigationService {
  navigate(name: string, params?: object) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    }
  }

  push(name: string, params?: object) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.push(name, params));
    }
  }

  goBack() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  }

  reset(routeName: string, params?: object) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: routeName, params}],
        })
      );
    }
  }

  getCurrentRoute() {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute();
    }
    return null;
  }

  getRootState() {
    if (navigationRef.isReady()) {
      return navigationRef.getRootState();
    }
    return null;
  }

  // Role-specific navigation helpers
  navigateToAssignment(assignmentId: string, userRole: string) {
    if (userRole === 'student') {
      this.navigate('Student', {
        screen: 'Assignments',
        params: {
          screen: 'AssignmentDetail',
          params: {assignmentId},
        },
      });
    } else if (userRole === 'teacher') {
      this.navigate('Teacher', {
        screen: 'Assignments',
        params: {
          screen: 'AssignmentDetail',
          params: {assignmentId},
        },
      });
    }
  }

  navigateToClass(classId: string, userRole: string) {
    if (userRole === 'student') {
      this.navigate('Student', {
        screen: 'Dashboard',
        params: {
          screen: 'ClassroomDetail',
          params: {classId},
        },
      });
    } else if (userRole === 'teacher') {
      this.navigate('Teacher', {
        screen: 'Classes',
        params: {
          screen: 'ClassDetail',
          params: {classId},
        },
      });
    }
  }

  navigateToPayment(paymentId?: string) {
    this.navigate('Student', {
      screen: 'Profile',
      params: {
        screen: 'PaymentHistory',
        params: paymentId ? {paymentId} : {},
      },
    });
  }
}

export const navigationService = new NavigationService();
```

This comprehensive mobile app architecture guide provides development teams with detailed React Native implementation specifications, including project structure, state management, navigation patterns, and best practices for building a scalable, maintainable coaching management mobile application.