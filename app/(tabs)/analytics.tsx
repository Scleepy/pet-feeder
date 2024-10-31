import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { firebaseDatabase } from "@/firebase/firebase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";

interface DailyGrams {
  feedTimeId: string;
  date: string;
  value: number;
}

export default function Analytics() {
  const [showDailyData, setShowDailyData] = useState(true);
  const [dailyGrams, setDailyGrams] = useState<DailyGrams[]>([]);
  const [todayGrams, setTodayGrams] = useState<DailyGrams[]>([]);
  const [averageGramsPerWeek, setAverageGramsPerWeek] = useState(0);

  useEffect(() => {
    fetchDailyGrams();
  }, []);

  const fetchDailyGrams = async () => {
    const snapshot = await firebaseDatabase
      .ref("/feedingData/dailyGrams")
      .once("value");
    const data: Record<string, DailyGrams> | null = snapshot.val();

    const feedTimesData = data || {};
    const gramsData = Object.values(feedTimesData).map((entry) => ({
      feedTimeId: entry.feedTimeId,
      date: entry.date,
      value: entry.value,
    }));

    setDailyGrams(gramsData);
    calculateAverage(gramsData);

    const todayDate = new Date();
    const formattedDate = `${(todayDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${todayDate.getDate().toString()}`;

    const filteredTodayGrams = gramsData.filter((gram) =>
      gram.date.includes(formattedDate)
    );
    setTodayGrams(filteredTodayGrams);
  };

  const calculateAverage = async (gramsData: DailyGrams[]) => {
    if (gramsData.length === 0) {
      setAverageGramsPerWeek(0);
      await updateAverageInDatabase(0);
      return;
    }
    const totalGrams = gramsData.reduce((sum, entry) => sum + entry.value, 0);
    const average = totalGrams / gramsData.length;

    setAverageGramsPerWeek(average);
    await updateAverageInDatabase(average);
  };

  const updateAverageInDatabase = async (average: number) => {
    await firebaseDatabase.ref("/feedingData/dailyAverage").set(average);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#A25E3A", dark: "#646464" }}
        headerImage={
          <Ionicons
            size={310}
            name="analytics-outline"
            style={styles.headerImage}
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Analytics</ThemedText>
          <ThemedText type="title" style={{ fontSize: 28 }}>
            🐾
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemedText style={styles.sectionTitle}>
            {showDailyData ? "Daily Feeding Trends" : "Weekly Average"}
          </ThemedText>

          {showDailyData ? (
            <>
              <View style={styles.card}>
                <ThemedText style={styles.dataText}>
                  Average Fed per Day:{" "}
                  <ThemedText style={styles.dataNumber}>
                    {averageGramsPerWeek.toFixed(2)}gr
                  </ThemedText>
                </ThemedText>
                <View style={styles.dataEntries}>
                  {todayGrams.length > 0 ? (
                    <>
                      {todayGrams.map((gram) => (
                        <View key={gram?.feedTimeId} style={styles.dataEntry}>
                          <ThemedText
                            style={{ color: "#000" }}
                          >{`${gram.date}: ${gram.value}gr`}</ThemedText>
                        </View>
                      ))}
                    </>
                  ) : (
                    <ThemedText style={styles.dataText}>
                      You haven't fed your pet today
                    </ThemedText>
                  )}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <ThemedText style={styles.dataText}>
                Daily Average:{" "}
                <ThemedText style={styles.dataNumber}>
                  {averageGramsPerWeek.toFixed(2)}gr
                </ThemedText>
              </ThemedText>
            </View>
          )}

          <ThemedView style={styles.toggleContainer}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowDailyData(!showDailyData)}
            >
              <ThemedText style={{ color: "white" }}>
                {showDailyData ? "Show Weekly Data" : "Show Daily Data"}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ParallaxScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={fetchDailyGrams}>
        <Ionicons name="sync-outline" size={30} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#D4AF37",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFF",
    marginVertical: 12,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  dataText: {
    fontSize: 18,
    color: "#333",
    marginVertical: 8,
  },
  dataNumber: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#333",
  },
  dataEntries: {
    paddingVertical: 8,
  },
  dataEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  toggleButton: {
    padding: 12,
    backgroundColor: "#1E90FF",
    borderRadius: 5,
    alignItems: "center",
  },
  toggleContainer: {
    marginVertical: 16,
    alignItems: "center",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
});
