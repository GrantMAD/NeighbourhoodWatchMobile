import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SignInScreen from './src/screens/SignInScreen'
import SignUpScreen from './src/screens/SignUpScreen'
import GroupAccessScreen from './src/screens/GroupAccessScreen'
import JoinGroupScreen from './src/screens/JoinGroupScreen' // you'll create soon
import CreateGroupScreen from './src/screens/CreateGroupScreen' // you'll create soon
import { NavigationContainer } from '@react-navigation/native'
import MainAppScreen from './src/screens/MainAppScreen';

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        {/* Auth screens */}
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />

        {/* Group access flow */}
        <Stack.Screen
          name="MainApp"
          component={MainAppScreen}
          options={{ headerShown: false }} // or true, if you want a header
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
