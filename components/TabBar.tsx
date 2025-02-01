import { View, Platform, StyleSheet, TouchableOpacity } from 'react-native';

import type { RouteName } from '../types/RouteName'; // Ensure this import points to the correct file where RouteName is defined
import Feather from 'react-native-vector-icons/Feather';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Text, PlatformPressable } from '@react-navigation/elements';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import TabBarButton from './TabBarButton';

export function TabBar({ state, descriptors, navigation } : BottomTabBarProps) {
  const { colors } = useTheme();
  const { buildHref } = useLinkBuilder();

  return (
    <View style={styles.tabbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
            <TabBarButton 
                key={route.name}
                onPress={onPress}
                onLongPress={onLongPress}
                isFocused={isFocused}
                routeName={route.name as RouteName}
                color={isFocused ? colors.primary : colors.text}
                label={label}

            />
        //   <TouchableOpacity
        //     key={route.name}
        //     accessibilityState={isFocused ? { selected: true } : {}}
        //     accessibilityLabel={options.tabBarAccessibilityLabel}
        //     testID={options.tabBarButtonTestID}
        //     onPress={onPress}
        //     onLongPress={onLongPress}
        //     style={styles.tabbarItem}
        //   >
        //     {icon[route.name](isFocused ? { color: colors.primary } : {})} 
        //     <Text style={{ color: isFocused ? colors.primary : colors.text }}>
        //       {label}
        //     </Text>
        //   </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
    tabbar: {
        position: 'absolute',
        bottom: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', 
        backgroundColor: '#fff',
        marginHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 35,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 10},
        shadowRadius: 10,
        shadowOpacity: 0.1,
    }, 
    tabbarItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    }
})