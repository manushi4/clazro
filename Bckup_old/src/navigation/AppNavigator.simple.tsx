import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';

// Simple Dashboard for testing
import StudentDashboard from '../screens/student/StudentDashboard';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const {user, isAuthenticated} = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  // Simple authenticated navigation for testing
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={StudentDashboard}
        options={{ title: 'Dashboard' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;