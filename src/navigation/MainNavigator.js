import React from 'react';
import {Text} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import {COLORS} from '../constants/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator (Ana ekranlar için)
const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textLight,
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
            }}
            id={"screen"}>
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Ana Sayfa',
                    tabBarIcon: ({color, size}) => (
                        <Text style={{fontSize: size, color}}>🏠</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Courses"
                component={DashboardScreen} // Geçici olarak Dashboard kullanıyoruz
                options={{
                    tabBarLabel: 'Kurslar',
                    tabBarIcon: ({color, size}) => (
                        <Text style={{fontSize: size, color}}>📚</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={DashboardScreen} // Geçici olarak Dashboard kullanıyoruz
                options={{
                    tabBarLabel: 'Profil',
                    tabBarIcon: ({color, size}) => (
                        <Text style={{fontSize: size, color}}>👤</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

// Main Stack Navigator
const MainNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
            id={"main"}>
            <Stack.Screen name="MainTabs" component={TabNavigator}/>
        </Stack.Navigator>
    );
};

export default MainNavigator;
