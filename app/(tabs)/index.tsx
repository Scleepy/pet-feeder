import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
  View,
  Animated,
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

interface DailyGrams {
  feedTimeId: string | number[];
  date: string;
  value: number;
}

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
      const dispenseRef = firebaseDatabase.ref("/commands/dispense");
      await dispenseRef.set(true);

      // const now = new Date();

      // const formattedDate = `${(now.getMonth() + 1)
      //   .toString()
      //   .padStart(2, "0")}/${now
      //   .getDate()
      //   .toString()
      //   .padStart(2, "0")}/${now.getFullYear()} - ${now
      //   .getHours()
      //   .toString()
      //   .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      // const newDailyGram: DailyGrams = {
      //   feedTimeId: uuid.v4(),
      //   date: formattedDate,
      //   value: 30,
      // };

      // await firebaseDatabase
      //   .ref(`/feedingData/dailyGrams/${newDailyGram.feedTimeId}`)
      //   .set(newDailyGram);

      setFeedback({ message: "Successfully dispensed food", type: "success" });
    } catch (error) {
      console.error("Error dispensing food:", error);
      setFeedback({ message: "Failed to dispense food", type: "failure" });
    }
  };

  const clearFeedback = () => {
    setFeedback({ message: "", type: "success" });
  };

  const rfidDispenseFood = async () => {
    try {
      const activeRFIDFeedingId = uuid.v4();

      const dispenseRef = firebaseDatabase.ref("/commands/activeRFIDFeedingId");
      await dispenseRef.set(activeRFIDFeedingId);

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

      <ThemedView style={styles.tokenContainer}>
        <ThemedText type="subtitle">FCM Token:</ThemedText>
        <Text style={styles.tokenText}>
          {fcmToken ? fcmToken : "Fetching FCM token..."}
        </Text>
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
  buttonContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#4CAF50",
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
});
