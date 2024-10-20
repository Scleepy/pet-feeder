import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Platform, Alert, Text, TouchableOpacity } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid } from 'react-native';
import { firebaseDatabase } from '../../firebase/firebase';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const requestUserPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("You can use the notifications");
            getFCMToken();
          } else {
            Alert.alert('Permission denied', 'You need to enable notifications for this app.');
          }
        } catch (err) {
          console.warn(err);
        }
      } else {
        getFCMToken();
      }
    };

    const getFCMToken = async () => {
      const token = await messaging().getToken();

      if (token !== fcmToken) {
        setFcmToken(token);
      }

      console.log('FCM Token:', token);
    };

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
        }
      });

    requestUserPermission();

    return () => {
      unsubscribe();
      unsubscribeOnNotificationOpenedApp();
    };
  }, [fcmToken]);

  const setTrue = async () => {
    try {
      const dispenseRef = firebaseDatabase.ref('/commands/dispense');
      await dispenseRef.set(true);
    } catch (error) {
      console.error('Error writing data:', error);
    }
  };

  const setFalse = async () => {
    try {
      const dispenseRef = firebaseDatabase.ref('/commands/dispense');
      await dispenseRef.set(false);
    } catch (error) {
      console.error('Error writing data:', error);
    }
  };

  const dispenseFood = async () => {
    try {
      const dispenseRef = firebaseDatabase.ref('/commands/dispense');

      const snapshot = await dispenseRef.once('value');
      if (snapshot.exists()) {
        const currentValue = snapshot.val();
        console.log('Current value of /commands/dispense:', currentValue);
      } else {
        console.log('No data available at /commands/dispense');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Control Panel</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={setTrue}>
          <ThemedText type="default">Set True</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={setFalse}>
          <ThemedText type="default">Set False</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={dispenseFood}>
          <ThemedText type="default">Print</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => { console.log('test')} }>
          <ThemedText type="default">Just Print</ThemedText>
        </TouchableOpacity>
      </ThemedView>  
    
      
      <ThemedView style={styles.tokenContainer}>
        <ThemedText type="subtitle">FCM Token:</ThemedText>
        <Text style={styles.tokenText}>
          {fcmToken ? fcmToken : 'Fetching FCM token...'}
        </Text>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  tokenContainer: {
    padding: 16,
    marginTop: 20,
  },
  tokenText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
