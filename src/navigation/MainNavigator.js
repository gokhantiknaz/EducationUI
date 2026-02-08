import React from 'react';
import {Text} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import SearchScreen from '../screens/SearchScreen';
import MyCoursesScreen from '../screens/MyCoursesScreen';
import MyListScreen from '../screens/MyListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import {COLORS} from '../constants/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator (Main screens)
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
                    height: 90,
                },
            }}
            id={"screen"}>
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({color, size}) => (
                        <Text style={{fontSize: size, color}}>🏠</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarLabel: 'Search',
                    tabBarIcon: ({color, size}) => (
                        <Text style={{fontSize: size, color}}>🔍</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="MyCourses"
                component={MyCoursesScreen}
                options={{
                    tabBarLabel: 'My Courses',
                    tabBarIcon: ({color, size}) => (
                        <Text style={{fontSize: size, color}}>📚</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="MyList"
                component={MyListScreen}
                options={{
                    tabBarLabel: 'My List',
                    tabBarIcon: ({color, size}) => (
                        <Text style={{fontSize: size, color}}>❤️</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
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
            <Stack.Screen name="CourseDetail" component={CourseDetailScreen}/>
            <Stack.Screen
                name="VideoPlayer"
                component={VideoPlayerScreen}
                options={{
                    gestureEnabled: false, // Swipe back'i devre dışı bırak (video izlerken)
                }}
            />
        </Stack.Navigator>
    );
};

export default MainNavigator;
