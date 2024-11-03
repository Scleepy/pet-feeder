import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Platform,
  Alert,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import messaging from "@react-native-firebase/messaging";
import { PermissionsAndroid } from "react-native";
import { firebaseDatabase } from "../../firebase/firebase";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FeedbackMessage } from "@/components/FeedbackMessage";
import uuid from "react-native-uuid";

interface PetFeedingHistory {
  petFeedingHistoryId: string | number[];
  feedTimeId: string | number[] | null;
  petId: (string | number[])[] | [];
  feedTypeName: "Manual" | "Schedule" | "Manual RFID" | "Schedule RFID";
}

export default function ManualFeeding() {
  type FeedbackType = "success" | "failure";

  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: FeedbackType;
  }>({
    message: "",
    type: "success",
  });
  const [grams, setGrams] = useState<string>("30");
  
  useEffect(() => {
    const setExistingToken = async () => {
      const snapshot = await firebaseDatabase
        .ref("/deviceInfo/fcmToken")
        .once("value");
      const data: string | null = snapshot.val() || null;

      if (data) {
        setFcmToken(data);
      }
    };

    const fetchScheduleFeedingAmount = async () => {
      const snapshot = await firebaseDatabase.ref("/commands/manualFeedingValue").once("value");
      const data = snapshot.val();
      
      if (data !== null && typeof data === 'string') {
        setGrams(data);
      } else if (data !== null) {
        setGrams(String(data));
      }
    };

    fetchScheduleFeedingAmount();
    setExistingToken();
  }, []);

  useEffect(() => {
    const requestUserPermission = async () => {
      if (Platform.OS === "android" && Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("You can use the notifications");
            getFCMToken();
          } else {
            Alert.alert(
              "Permission denied",
              "You need to enable notifications for this app."
            );
          }
        } catch (err) {
          console.warn(err);
        }
      } else {
        getFCMToken();
      }
    };

    const upsertFCMToken = async (fcmToken: string) => {
      await firebaseDatabase.ref(`deviceInfo/fcmToken`).set(fcmToken);
    };

    const getFCMToken = async () => {
      const token = await messaging().getToken();

      if (token !== fcmToken) {
        setFcmToken(token);
        upsertFCMToken(token);
      }

      console.log("FCM Token:", token);
    };

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert("A new FCM message arrived!", JSON.stringify(remoteMessage));
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Message handled in the background!", remoteMessage);
    });

    const unsubscribeOnNotificationOpenedApp =
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log(
          "Notification caused app to open from background state:",
          remoteMessage
        );
      });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            "Notification caused app to open from quit state:",
            remoteMessage
          );
        }
      });

    requestUserPermission();

    return () => {
      unsubscribe();
      unsubscribeOnNotificationOpenedApp();
    };
  }, [fcmToken]);

  const dispenseFood = async () => {
    try {
      firebaseDatabase.ref("/commands/dispense").set(true);
      setFeedback({ message: "Successfully dispensed food", type: "success" });
    } catch (error) {
      console.error("Error dispensing food:", error);
      setFeedback({ message: "Failed to dispense food", type: "failure" });
    }
  };

  const clearFeedback = () => {
    setFeedback({ message: "", type: "success" });
  };

  const resetManualFeedingValues = () => {
    try {
      firebaseDatabase.ref("/commands/dispense").set(false);
      firebaseDatabase.ref("/commands/activeRFIDFeedingId").set("");

      setFeedback({ message: "Manual feeding values reset", type: "success" });
    } catch (error) {
      console.error("Error resetting manual feeding values:", error);
      setFeedback({ message: "Failed to reset manual feeding values", type: "failure" });
    }
  }

  const rfidDispenseFood = async () => {
    try {
      const activeRFIDFeedingId = uuid.v4();

      await firebaseDatabase.ref("/commands/activeRFIDFeedingId").set(activeRFIDFeedingId);

      const newPetFeedingHistoryData: PetFeedingHistory = {
        petFeedingHistoryId: activeRFIDFeedingId,
        feedTimeId: null,
        petId: [],
        feedTypeName: "Manual RFID",
      };

      await firebaseDatabase
        .ref(
          `/petFeedingHistory/${newPetFeedingHistoryData.petFeedingHistoryId}`
        )
        .set(newPetFeedingHistoryData);

      setFeedback({ message: "Successfully dispensed food", type: "success" });
    } catch (error) {
      console.error("Error dispensing food:", error);
      setFeedback({ message: "Failed to dispense food", type: "failure" });
    }
  };

  const setAmount = () => {
    try {
      const gramsValue = parseInt(grams);

      if (gramsValue < 10) {
        setFeedback({ message: "Cannot dispense less than\n10 grams of food", type: "failure" });
        return; 
      }
  
      firebaseDatabase.ref("/commands/manualFeedingValue").set(gramsValue);
      setFeedback({ message: "Successfully set amount", type: "success" });
    } catch (error){
      console.log(error);
      setFeedback({ message: "Failed to set amount", type: "failure" });
      return;
    }
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Manual Feeding</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.inputContainer}>
        <ThemedText style={styles.dispenseText}>Dispense value</ThemedText>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholderTextColor="lightgray"
            placeholder="Enter grams of food"
            keyboardType="numeric"
            value={grams}
            onChangeText={setGrams}
          />
          <TouchableOpacity style={styles.setButton} onPress={setAmount}>
            <ThemedText type="default">Set Amount</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={dispenseFood}>
          <ThemedText type="default">Dispense Food</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={rfidDispenseFood}>
          <ThemedText type="default">Manual RFID Feeding</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* <ThemedView style={styles.tokenContainer}>
        <ThemedText type="subtitle">Currently dispensing {grams} grams of food.</ThemedText>
        <Text style={styles.tokenText}>
          {fcmToken ? fcmToken : "Fetching FCM token..."}
        </Text>
      </ThemedView> */}

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonReset} onPress={resetManualFeedingValues}>
          <ThemedText type="default">Reset Manual Feeding Values</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {feedback.message !== "" && (
        <FeedbackMessage
          message={feedback.message}
          type={feedback.type}
          onAnimationEnd={clearFeedback}
        />
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  input: {
    height: 43,
    borderColor: "white",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    flex: 1,
    color: "white",
    backgroundColor: "#2E2E2E",
    marginRight: 10,
  },
  buttonContainer: {
    marginVertical: 5,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
  },
  buttonReset: {
    backgroundColor: "#1E90FF",
    padding: 15,
    borderRadius: 5,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  tokenContainer: {
    padding: 16,
    marginTop: 20,
  },
  tokenText: {
    color: "white",
    fontSize: 12,
    fontFamily: "monospace",
  },
  dispenseText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  setButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  }
});
