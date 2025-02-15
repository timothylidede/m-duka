import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Screens
import CreditCard from './index';
import SalesPage from './business';
import RetailProfile from './profile';

type TabBarIconProps = {
  focused: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
};

type RootTabParamList = {
  SalesDashboard: undefined;
  ManageBusiness: undefined;
  Inventory: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabBarIcon: React.FC<TabBarIconProps> = ({ focused, icon }) => {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    }}>
      {focused ? (
        <LinearGradient
          colors={['#2E3192', '#1BFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name={icon} size={20} color="white" />
        </LinearGradient>
      ) : (
        <View style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Feather name={icon} size={24} color="#64748B" />
        </View>
      )}
    </View>
  );
};

const MainContainer: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
          fontWeight: '500',
          marginTop: 5,
        },
        tabBarActiveTintColor: '#2E3192',
        tabBarInactiveTintColor: '#64748B',
        headerStyle: {
          backgroundColor: '#2E3192',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen 
        name="SalesDashboard" 
        component={CreditCard}
        options={{
          tabBarLabel: "Sales Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="credit-card" label="Sales Dashboard" />
          ),
        }}
      />
      <Tab.Screen 
        name="ManageBusiness" 
        component={SalesPage}
        options={{
          tabBarLabel: "Manage Business",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="bar-chart-2" label="Manage Business" />
          ),
        }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={RetailProfile}
        options={{
          tabBarLabel: "Inventory",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="user" label="Inventory" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainContainer;
