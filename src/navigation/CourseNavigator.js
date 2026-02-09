import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CourseDashboardScreen from '../screens/CourseDashboardScreen';
import { COLORS } from '../constants/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Single Course Tab Navigator
const SingleCourseTabNavigator = ({ route }) => {
  const { courseId } = route.params || {};

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
      id="singleCourseTab"
    >
      <Tab.Screen
        name="CourseDashboard"
        component={CourseDashboardScreen}
        initialParams={{ courseId }}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="CourseContent"
        component={CourseDetailScreen}
        initialParams={{ courseId }}
        options={{
          tabBarLabel: 'Content',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📚</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Course Navigator - For single course apps
const CourseNavigator = ({ initialCourseId }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      id="courseNavigator"
    >
      <Stack.Screen
        name="SingleCourseTabs"
        component={SingleCourseTabNavigator}
        initialParams={{ courseId: initialCourseId }}
      />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default CourseNavigator;
