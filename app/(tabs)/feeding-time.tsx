import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import React, { useEffect, useState } from 'react';
import { firebaseDatabase } from '../../firebase/firebase';
import uuid from 'react-native-uuid';

interface FeedTime {
  feedTimeId: string | number[];
  time: string; 
  isActive: boolean;
}

export default function FeedingTime() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [feedTimes, setFeedTimes] = useState<FeedTime[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchFeedTimes = async () => {
      const snapshot = await firebaseDatabase.ref('/feedTimes').once('value');
      const data: Record<string, FeedTime> | null = snapshot.val();
    
      const feedTimesData = data || {};
      setFeedTimes(Object.values(feedTimesData).map((entry) => ({
        feedTimeId: entry.feedTimeId,
        time: entry.time,
        isActive: entry.isActive,
      })));
    };
  
    fetchFeedTimes();
  }, []);

  const handleConfirm = (selectedDate: Date) => {
    if (selectedIndex !== null){
      const formattedTime = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const updatedFeedTimes = feedTimes.map((feedTime, index) =>
        index === selectedIndex ? { ...feedTime, time: formattedTime } : feedTime
      );

      setFeedTimes(updatedFeedTimes);
      updateFeedTime(updatedFeedTimes[selectedIndex]);

    } else {
      const newFeedTime: FeedTime = {
        feedTimeId: uuid.v4(),
        time: selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        isActive: true,
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
    Alert.alert('Delete Feeding Time', 'Are you sure you want to delete this feeding time?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: () => deleteFeedTime(index),
      },
    ]);
  };

  const handleEditPress = (index: number) => {
    setSelectedIndex(index);
    setDate(new Date(`1970-01-01T${feedTimes[index].time}:00`));
    setShowPicker(true);
  }

  const handleToggle = (index: number) => {
    const updatedFeedTimes = feedTimes.map((feedTime, i) => 
      i === index ? { ...feedTime, isActive: !feedTime.isActive } : feedTime
    );
    setFeedTimes(updatedFeedTimes);
    updateFeedTime(updatedFeedTimes[index]);
  };

  const insertFeedTime = async (feedTime: FeedTime) => {
    await firebaseDatabase.ref(`/feedTimes/${feedTime.feedTimeId}`).set(feedTime);
  };

  const updateFeedTime= async (feedTime: FeedTime) => {
    await firebaseDatabase.ref(`/feedTimes/${feedTime.feedTimeId}`).set(feedTime);
  };

  const deleteFeedTime = async (index: number) => {
    const feedTimeIdToDelete = feedTimes[index].feedTimeId;
    setFeedTimes((prev) => prev.filter((_, i) => i !== index));
    await firebaseDatabase.ref(`/feedTimes/${feedTimeIdToDelete}`).remove();
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#CB6040', dark: '#898121' }}
        headerImage={<Ionicons size={310} name="fast-food-outline" style={styles.headerImage} />}
        >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Feeding Time</ThemedText>
          <ThemedText type="title" style={{ fontSize: 28 }}>🐱</ThemedText>
        </ThemedView>

        {feedTimes.map((feedTime, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onLongPress={() => handleLongPress(index)}
            onPress={() => handleEditPress(index)}
          >
            <ThemedText>
              {new Date(`1970-01-01T${feedTime.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </ThemedText>
            <View style={styles.toggleContainer}>
              <Switch
                value={feedTime.isActive}
                onValueChange={() => handleToggle(index)}
              />
            </View>
          </TouchableOpacity>
        ))}

      </ParallaxScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={() => setShowPicker(true)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={showPicker}
        mode="time"
        date={date}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
      />
    </ThemedView>
    
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#E6C767',
    bottom: -90,  
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1E90FF',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 2,
  },
  toggleButton: {
    padding: 8,
    backgroundColor: '#1E90FF',
    borderRadius: 5,
  },
  toggleContainer: {
    marginLeft: 10,
  },
});