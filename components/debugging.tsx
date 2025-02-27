// this source file describes a component that takes in a string as input and returns a dialog box with the string as the content
import {Alert} from 'react-native';
import React from 'react';

export default function DebuggingAlert({message}: {message: string}) {
  Alert.alert('Debugging Alert', message);
}

// export a function that takes in a string and los it on the console
export function logMessage(message: string) {
  console.log(message);
}