import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { icon } from '@/constants/icon'
import { useTheme } from '@react-navigation/native';
import { useSharedValue } from 'react-native-reanimated';


import { GestureResponderEvent } from 'react-native';

type RouteName = 'index' | 'invest' | 'items' | 'profile' | 'business';

const TabBarButton = ({onPress, onLongPress, isFocused, routeName, color, label}: {onPress: (event: GestureResponderEvent) => void, onLongPress: (event: GestureResponderEvent) => void, isFocused:boolean, routeName: RouteName, color:string, label:string}) => {
    const scale = useSharedValue(0);
    const { colors } = useTheme();

    return (
    <Pressable
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabbarItem}
              >
                {icon[routeName](isFocused ? { color: colors.primary } : {})} 
                <Text style={{ color: isFocused ? colors.primary : colors.text }}>
                  {label}
                </Text>
              </Pressable> 
  )
}

export default TabBarButton

const styles = StyleSheet.create({
    tabbarItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    }
})

