import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SignInScreen from './src/screens/SignInScreen'
import SignUpScreen from './src/screens/SignUpScreen'
import GroupAccessScreen from './src/screens/GroupAccessScreen'
import JoinGroupScreen from './src/screens/JoinGroupScreen'
import CreateGroupScreen from './src/screens/CreateGroupScreen'
import { NavigationContainer } from '@react-navigation/native'
import MainAppScreen from './src/screens/MainAppScreen'
import WelcomeScreen from './src/screens/WelcomeScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#374151',
            borderBottomWidth: 1,
            borderBottomColor: '#4b5563',
            shadowColor: 'white',           
            shadowOpacity: 1,            
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            elevation: 5,                   
          },
          headerTintColor: '#f9fafb',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        {/* Welcome screen */}
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        {/* Auth screens */}
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />

        {/* Group access flow */}
        <Stack.Screen
          name="MainApp"
          component={MainAppScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroupAccess"
          component={GroupAccessScreen}
          options={{ title: 'Get Started' }}
        />
        <Stack.Screen
          name="JoinGroup"
          component={JoinGroupScreen}
          options={{ title: 'Join a Group' }}
        />
        <Stack.Screen
          name="CreateGroup"
          component={CreateGroupScreen}
          options={{ title: 'Create a Group' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
