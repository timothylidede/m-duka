import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Page = () => {
  return (
    <View style={styles.container}>
      <Text>Invest Screen</Text>
    </View>
  )
}

export default Page

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    }
})