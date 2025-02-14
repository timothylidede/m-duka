import { Stack } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, StatusBar, ScrollView } from "react-native";
import LottieView from "lottie-react-native";

// Import under construction animation
const underConstructionAnimation = require("../assets/animations/underConstruction.json");

export default function UnderConstruction() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Under Construction",
          headerStyle: {
            backgroundColor: "#2E3192",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <LottieView
            source={underConstructionAnimation}
            autoPlay
            loop
            style={styles.animation}
          />
          <Text style={styles.title}>Under Construction</Text>
          <Text style={styles.message}>
            We're working hard to bring you this functionality. Please check
            back soon!
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  animation: {
    width: 300,
    height: 300,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E3192",
    marginTop: 20,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 24,
  },
});
