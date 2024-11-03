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
  const [dailyAverage, setDailyAverage] = useState<number>(0);
  const [currentFoodLevel, setCurrentFoodLevel] = useState<string>("0%");
  const [weeklyAverages, setWeeklyAverages] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetchCurrentFoodLevel();
    fetchDailyGrams();
  }

  const fetchCurrentFoodLevel = async () => {
    try {
      const snapshot = await firebaseDatabase.ref("/feedingData/foodLevel").once("value");
      const data = snapshot.val();
  
      if (data !== null) {
        setCurrentFoodLevel(data);
      } else {
        console.error("No data found for food level.");
        setCurrentFoodLevel("0%");
      }
    } catch (error) {
      console.error("Error fetching food level:", error);
      setCurrentFoodLevel("0%");
    }
  };

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

    gramsData.sort((a, b) => {
      const dateA = new Date(a.date.replace(" - ", "T"));
      const dateB = new Date(b.date.replace(" - ", "T"));
      return dateB.getTime() - dateA.getTime();
  });

    setDailyGrams(gramsData);
    calculateAverage(gramsData);

    const todayDate = new Date();
    const formattedMonth = (todayDate.getMonth() + 1).toString().padStart(2, "0");
    const formattedDay = todayDate.getDate(); 

    const formattedDateWithZero = `${formattedMonth}/${formattedDay.toString().padStart(2, "0")}`;
    const formattedDateWithoutZero = `${formattedMonth}/${formattedDay}`;

    const filteredTodayGrams = gramsData.filter((gram) =>
      gram.date.includes(formattedDateWithZero) || gram.date.includes(formattedDateWithoutZero)
    );

    filteredTodayGrams.sort((a, b) => {
      const timeA = a.date.split(" - ")[1]; 
      const timeB = b.date.split(" - ")[1];
      return timeB.localeCompare(timeA);
    });

    setTodayGrams(filteredTodayGrams);
  };

  const calculateAverage = async (gramsData: DailyGrams[]) => {
    if (gramsData.length === 0) {
      setDailyAverage(0);
      // await updateAverageInDatabase(0);
      return;
    }

    const gramsToday = gramsData.filter((gram) => {
      const dateParts = gram.date.split(" - ")[0].split("/");
      const month = parseInt(dateParts[0]) - 1; // Month (0-based)
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
  
      const entryDate = new Date(year, month, day);
  
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
      return entryDate.getFullYear() === todayDate.getFullYear() &&
             entryDate.getMonth() === todayDate.getMonth() &&
             entryDate.getDate() === todayDate.getDate();
    });

    const totalGramsToday = gramsToday.reduce((sum, entry) => sum + entry.value, 0);
    const dailyAverage = gramsToday.length > 0 ? totalGramsToday / gramsToday.length : 0;
    setDailyAverage(dailyAverage);

    const gramsPerWeek: Record<string, { total: number; count: number; startDate: Date; endDate: Date }> = {};
  
    gramsData.forEach(entry => {
      const dateParts = entry.date.split(" - ")[0].split("/");
      const month = parseInt(dateParts[0]) - 1;
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      const date = new Date(year, month, day);
  
      if (isNaN(date.getTime())) {
        console.error(`Invalid date for entry: ${entry.date}`);
        return;
      }
      
      const weekNumber = getWeekNumber(date);
      const weekKey = `${date.getFullYear()}-W${weekNumber}`;
  
      if (!gramsPerWeek[weekKey]) {
        gramsPerWeek[weekKey] = { total: 0, count: 0, startDate: date, endDate: date };
      }
  
      gramsPerWeek[weekKey].total += entry.value;
      gramsPerWeek[weekKey].count += 1;
  
      if (date < gramsPerWeek[weekKey].startDate) {
        gramsPerWeek[weekKey].startDate = date;
      }
      if (date > gramsPerWeek[weekKey].endDate) {
        gramsPerWeek[weekKey].endDate = date;
      }
    });
  
    const weeklyAverages = Object.entries(gramsPerWeek).map(([key, week]) => {
      const average = week.total / (week.count || 1);
      const startDate = week.startDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
      const endDate = week.endDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
      
      return `${startDate} - ${endDate}: ${average.toFixed(2)}gr`;
  });
  
    setWeeklyAverages(weeklyAverages);
    // await updateAverageInDatabase(overallAverage);
  };

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  // const updateAverageInDatabase = async (average: number) => {
  //   await firebaseDatabase.ref("/feedingData/dailyAverage").set(average);
  // };

  const foodLevelNumber = parseInt(currentFoodLevel.replace('%', ''), 10);

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
          <ThemedText
            style={[
              styles.sectionTitle,
              foodLevelNumber <= 30 && styles.warningText,
            ]}
          >
            Current Food Level: {currentFoodLevel}
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>
            {showDailyData ? "Daily Feeding Trends" : "Weekly Average"}
          </ThemedText>

          {showDailyData ? (
            <>
              <View style={styles.card}>
                <ThemedText style={styles.dataText}>
                  Average Fed per Day:{" "}
                  <ThemedText style={styles.dataNumber}>
                    {dailyAverage.toFixed(2)}gr
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
                Weekly Averages:
              </ThemedText>
              {weeklyAverages.length > 0 ? (
                weeklyAverages.map((weekData, index) => (
                  <View key={weekData} style={styles.dataEntry}>
                    <ThemedText key={index} style={{ color: "#000" }}>
                      {weekData}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText style={styles.dataText}>
                  No data available for this week.
                </ThemedText>
              )}
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

      <TouchableOpacity style={styles.floatingButton} onPress={fetchData}>
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
  warningText: {
    color: 'red',
    fontWeight: 'bold',
  },
});
