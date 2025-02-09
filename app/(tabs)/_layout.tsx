import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import CreditCard from './index';
import SalesPage from './business';
import RetailProfile from './profile';

// Screen names
const index = "Earnings";
const business = "Business";
const profile = "Profile";

const Tab = createBottomTabNavigator();

function MainContainer() {
  return (
    <Tab.Navigator
      initialRouteName={index}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          let rn = route.name;
          if (rn === index) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (rn === business) {
            iconName = focused ? 'list' : 'list-outline';
          } else if (rn === profile) {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'grey',
        tabBarLabelStyle: { paddingBottom: 10, fontSize: 10 },
        tabBarStyle: { padding: 10, height: 70 },
      })}
    >
      <Tab.Screen name={business} component={SalesPage} />
      <Tab.Screen name={index} component={CreditCard} />
      <Tab.Screen name={profile} component={RetailProfile} />
    </Tab.Navigator>
  );
}

export default MainContainer;
