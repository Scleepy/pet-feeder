import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

interface PetFeedingHistory {
  petFeedingHistoryId: string | number[];
  feedTimeId: string | number[] | null;
  petId: (string | number[])[] | [];
  feedTypeName: "Manual" | "Schedule" | "Manual RFID" | "Schedule RFID";
}

export default function FeedingTime() {
  type FeedbackType = "success" | "failure";

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [feedTimes, setFeedTimes] = useState<FeedTime[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingTime, setEditingTime] = useState<FeedTime | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: FeedbackType;
  }>({
    message: "",
    type: "success",
  });

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

    fetchFeedTimes();
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

  const handleEdit = (item: FeedTime) => {
    setEditingTime(item);
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

  const handleToggleRFID = () => {
    if (editingTime) {
      const updatedEditingTime = {
        ...editingTime,
        isRFID: !editingTime.isRFID,
      };
      setEditingTime(updatedEditingTime);
    }
  };

  console.log(editingTime);

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

  const handleUpdate = async (index: number) => {
    if (editingTime) {
      try {
        const activeRFIDFeedingId = uuid.v4();
        const newPetFeedingHistoryData: PetFeedingHistory = {
          petFeedingHistoryId: activeRFIDFeedingId,
          feedTimeId: editingTime.feedTimeId,
          petId: [],
          feedTypeName: editingTime.isRFID ? "Schedule RFID" : "Schedule",
        };

        await firebaseDatabase
          .ref(
            `/petFeedingHistory/${newPetFeedingHistoryData.petFeedingHistoryId}`
          )
          .set(newPetFeedingHistoryData);

        const updatedFeedTimes = feedTimes.map((feedTime, i) =>
          i === index ? { ...feedTime, isRFID: !feedTime.isRFID } : feedTime
        );
        setFeedTimes(updatedFeedTimes);
        updateFeedTime(updatedFeedTimes[index]);

        setFeedback({
          message: "Successfully updated feeding time",
          type: "success",
        });
        setEditingTime(null);
      } catch (error) {
        console.error("Error updating feeding time:", error);
        setFeedback({
          message: "Failed to update feeding time",
          type: "failure",
        });
      }
    }
  };

  const clearFeedback = () => {
    setFeedback({ message: "", type: "success" });
  };

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
                style={styles.updateButton}
                onPress={() => handleEdit(feedTime)}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>

              {editingTime?.feedTimeId === feedTime.feedTimeId && (
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.modalBox}>
                    <View style={styles.modal}>
                      <Text style={styles.buttonText}>RFID</Text>
                      <Switch
                        value={editingTime.isRFID}
                        onValueChange={handleToggleRFID}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={() => handleUpdate(index)}
                    >
                      <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.updateButton, styles.cancelButton]}
                      onPress={() => setEditingTime(null)}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              )}
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
  modalBox: {
    borderColor: "#ffffff",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  modal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  cancelButton: {
    backgroundColor: "#FF5252",
    marginTop: 4,
  },
});
