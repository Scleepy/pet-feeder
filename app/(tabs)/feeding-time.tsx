import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import React, { useEffect, useState } from "react";
import { firebaseDatabase } from "../../firebase/firebase";
import uuid from "react-native-uuid";
import { FeedbackMessage } from "@/components/FeedbackMessage";

interface FeedTime {
  feedTimeId: string | number[];
  time: string;
  isActive: boolean;
  lastTriggerDate: String;
  isRFID: boolean;
}

export default function FeedingTime() {
  type FeedbackType = "success" | "failure";

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [feedTimes, setFeedTimes] = useState<FeedTime[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: FeedbackType;
  }>({
    message: "",
    type: "success",
  });
  const [grams, setGrams] = useState<string>("30");

  useEffect(() => {
    const fetchFeedTimes = async () => {
      const snapshot = await firebaseDatabase.ref("/feedTimes").once("value");
      const data: Record<string, FeedTime> | null = snapshot.val();

      const feedTimesData = data || {};
      setFeedTimes(
        Object.values(feedTimesData).map((entry) => ({
          feedTimeId: entry.feedTimeId,
          time: entry.time,
          isActive: entry.isActive,
          lastTriggerDate: entry.lastTriggerDate,
          isRFID: entry.isRFID,
        }))
      );
    };

    const fetchScheduleFeedingAmount = async () => {
      const snapshot = await firebaseDatabase.ref("/commands/scheduleFeedingValue").once("value");
      const data = snapshot.val();
      
      if (data !== null && typeof data === 'string') {
        setGrams(data);
      } else if (data !== null) {
        setGrams(String(data));
      }
    };

    fetchFeedTimes();
    fetchScheduleFeedingAmount();
  }, []);

  const handleConfirm = (selectedDate: Date) => {
    if (selectedIndex !== null) {
      const formattedTime = selectedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const updatedFeedTimes = feedTimes.map((feedTime, index) =>
        index === selectedIndex
          ? { ...feedTime, time: formattedTime }
          : feedTime
      );

      setFeedTimes(updatedFeedTimes);
      updateFeedTime(updatedFeedTimes[selectedIndex]);
    } else {
      const newFeedTime: FeedTime = {
        feedTimeId: uuid.v4(),
        time: selectedDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        isActive: true,
        lastTriggerDate: "1970-01-01",
        isRFID: false,
      };

      setFeedTimes((prev) => [...prev, newFeedTime]);
      insertFeedTime(newFeedTime);
    }

    hidePicker();
  };

  const hidePicker = () => {
    setShowPicker(false);
    setSelectedIndex(null);
  };

  const handleLongPress = (index: number) => {
    Alert.alert(
      "Delete Feeding Time",
      "Are you sure you want to delete this feeding time?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => deleteFeedTime(index),
        },
      ]
    );
  };

  const handleEditPress = (index: number) => {
    setSelectedIndex(index);
    setDate(new Date(`1970-01-01T${feedTimes[index].time}:00`));
    setShowPicker(true);
  };

  const handleToggle = (index: number) => {
    const updatedFeedTimes = feedTimes.map((feedTime, i) =>
      i === index ? { ...feedTime, isActive: !feedTime.isActive } : feedTime
    );
    setFeedTimes(updatedFeedTimes);
    updateFeedTime(updatedFeedTimes[index]);
  };

  const insertFeedTime = async (feedTime: FeedTime) => {
    await firebaseDatabase
      .ref(`/feedTimes/${feedTime.feedTimeId}`)
      .set(feedTime);
  };

  const updateFeedTime = async (feedTime: FeedTime) => {
    await firebaseDatabase
      .ref(`/feedTimes/${feedTime.feedTimeId}`)
      .set(feedTime);
  };

  const deleteFeedTime = async (index: number) => {
    const feedTimeIdToDelete = feedTimes[index].feedTimeId;
    setFeedTimes((prev) => prev.filter((_, i) => i !== index));
    await firebaseDatabase.ref(`/feedTimes/${feedTimeIdToDelete}`).remove();
  };


  const handleEditRFIDMode = async (feedTime: FeedTime) => {
    const updatedIsRFID = !feedTime.isRFID;

    await firebaseDatabase
      .ref(`/feedTimes/${feedTime.feedTimeId}/isRFID`)
      .set(updatedIsRFID);

    const updatedFeedTimes = feedTimes.map((ft) =>
      ft.feedTimeId === feedTime.feedTimeId ? { ...ft, isRFID: updatedIsRFID } : ft
    );
    
    setFeedTimes(updatedFeedTimes);    
  }

  const clearFeedback = () => {
    setFeedback({ message: "", type: "success" });
  };

  const setAmount = () => {
    try {
      const gramsValue = parseInt(grams);

      if (gramsValue < 10) {
        setFeedback({ message: "Cannot dispense less than\n10 grams of food", type: "failure" });
        return; 
      }
  
      firebaseDatabase.ref("/commands/scheduleFeedingValue").set(gramsValue);
      setFeedback({ message: "Successfully set amount", type: "success" });
    } catch (error){
      console.log(error);
      setFeedback({ message: "Failed to set amount", type: "failure" });
      return;
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#CB6040", dark: "#898121" }}
        headerImage={
          <Ionicons
            size={310}
            name="fast-food-outline"
            style={styles.headerImage}
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Feeding Time</ThemedText>
          <ThemedText type="title" style={{ fontSize: 28 }}>
            🐱
          </ThemedText>
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
            <TouchableOpacity style={styles.button} onPress={setAmount}>
              <ThemedText type="default">Set Amount</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
        {feedTimes.map((feedTime, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onLongPress={() => handleLongPress(index)}
            onPress={() => handleEditPress(index)}
          >
            <View style={styles.cardItem}>
              <ThemedText>
                {new Date(`1970-01-01T${feedTime.time}`).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }
                )}
              </ThemedText>
              <View style={styles.toggleContainer}>
                <Switch
                  value={feedTime.isActive}
                  onValueChange={() => handleToggle(index)}
                />
              </View>
            </View>

            <View>
              <TouchableOpacity
                style={[styles.updateButton, feedTime.isRFID ? styles.rfidOn : styles.rfidOff]}
                onPress={() => handleEditRFIDMode(feedTime)}
              >
                <Text style={styles.buttonText}>
                  {feedTime.isRFID ? "RFID Mode On" : "RFID Mode Off"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ParallaxScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={showPicker}
        mode="time"
        date={date}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
      />

      {feedback.message !== "" && (
        <FeedbackMessage
          message={feedback.message}
          type={feedback.type}
          onAnimationEnd={clearFeedback}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#E6C767",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#1E90FF",
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  card: {
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginVertical: 2,
  },
  cardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 4,
  },
  toggleButton: {
    padding: 8,
    backgroundColor: "#1E90FF",
    borderRadius: 5,
  },
  toggleContainer: {
    marginLeft: 10,
  },
  updateButton: {
    backgroundColor: "#1E90FF",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  rfidOn: {
    backgroundColor: "#4CAF50",
  },
  rfidOff: {
    backgroundColor: "#F44336",
  },
  inputContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
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
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  dispenseText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
