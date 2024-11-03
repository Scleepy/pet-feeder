import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { firebaseDatabase } from "@/firebase/firebase";
import { ThemedView } from "@/components/ThemedView";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";

interface PetProfile {
  tagId: string;
  isRegistered: boolean;
  petName?: string;
  dispenseAmount?: number;
}

const RFIDIdentification = () => {
  const [nonExistingPets, setNonExistingPets] = useState<PetProfile[]>([]);
  const [registeredPets, setRegisteredPets] = useState<PetProfile[]>([]);
  const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedDispenseAmount, setUpdatedDispenseAmount] = useState("");

  useEffect(() => {
    const fetchPetProfiles = async () => {
      try {
        const snapshot = await firebaseDatabase
          .ref("petProfiles")
          .once("value");
        const profiles: Record<string, PetProfile> = snapshot.val();

        const nonExisting = Object.values(profiles).filter(
          (profile) => !profile.isRegistered
        );
        const existing = Object.values(profiles).filter(
          (profile) => profile.isRegistered
        );

        setNonExistingPets(nonExisting);
        setRegisteredPets(existing);
      } catch (error) {
        console.error("Error fetching pet profiles:", error);
      }
    };

    fetchPetProfiles();
  }, []);

  const handleEdit = (pet: PetProfile) => {
    setEditingPet(pet);
    setUpdatedName(pet.petName || "");
    setUpdatedDispenseAmount(
      pet.dispenseAmount ? pet.dispenseAmount.toString() : ""
    );
  };

  const handleUpdate = async () => {
    if (editingPet) {
      const updatedData = {
        tagId: editingPet.tagId,
        petName: updatedName,
        dispenseAmount: Number(updatedDispenseAmount),
        isRegistered: true,
      };

      try {
        await firebaseDatabase
          .ref(`petProfiles/${editingPet.tagId}`)
          .set(updatedData);

        refetchData();
        setEditingPet(null);
      } catch (error) {
        console.error("Error updating pet profile:", error);
      }
    }
  };

  const refetchData = async () => {
    try {
      const snapshot = await firebaseDatabase.ref("petProfiles").once("value");
      const profiles: Record<string, PetProfile> = snapshot.val();

      const nonExisting = Object.values(profiles).filter(
        (profile) => !profile.isRegistered
      );
      const existing = Object.values(profiles).filter(
        (profile) => profile.isRegistered
      );

      setNonExistingPets(nonExisting);
      setRegisteredPets(existing);
    } catch (error) {
      console.error("Error fetching pet profiles:", error);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#F5FFFA", dark: "#36454F" }}
        headerImage={
          <Ionicons
            size={310}
            name="id-card-outline"
            style={styles.headerImage}
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Pet Profiles</ThemedText>
          <ThemedText type="title" style={{ fontSize: 28 }}>
            🪪
          </ThemedText>
        </ThemedView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Existing Pets</Text>
          {registeredPets.map((pet) => (
            <View key={pet.tagId} style={styles.card}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#4CAF50"
              />
              <View style={styles.cardContent}>
                {editingPet?.tagId === pet.tagId ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Pet Name"
                      value={updatedName}
                      onChangeText={setUpdatedName}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Dispense Amount"
                      keyboardType="numeric"
                      value={updatedDispenseAmount}
                      onChangeText={setUpdatedDispenseAmount}
                    />
                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={handleUpdate}
                    >
                      <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.updateButton, styles.cancelButton]}
                      onPress={() => setEditingPet(null)}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <ThemedText style={styles.cardTitle}>
                      {pet?.petName} ({pet?.dispenseAmount}gr)
                    </ThemedText>
                    <Text
                      style={styles.cardText}
                    >{`Tag ID: ${pet.tagId}`}</Text>
                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={() => handleEdit(pet)}
                    >
                      <Text style={styles.buttonText}>Update</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Non-Existing Pets</Text>
          {nonExistingPets.map((pet) => (
            <View key={pet.tagId} style={styles.card}>
              <MaterialIcons name="error-outline" size={20} color="#FF5252" />
              <View style={styles.cardContent}>
                {editingPet?.tagId === pet.tagId ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Pet Name"
                      value={updatedName}
                      onChangeText={setUpdatedName}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Dispense Amount"
                      keyboardType="numeric"
                      value={updatedDispenseAmount}
                      onChangeText={setUpdatedDispenseAmount}
                    />
                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={handleUpdate}
                    >
                      <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.updateButton, styles.cancelButton]}
                      onPress={() => setEditingPet(null)}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <ThemedText style={styles.cardTitle}>
                      Unregistered Pet
                    </ThemedText>
                    <Text
                      style={styles.cardText}
                    >{`Tag ID: ${pet.tagId}`}</Text>
                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={() => handleEdit(pet)}
                    >
                      <Text style={styles.buttonText}>Update</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      </ParallaxScrollView>

      <TouchableOpacity style={styles.floatingButton} onPress={refetchData}>
        <Ionicons name="sync-outline" size={30} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  headerImage: {
    color: "#E6C767",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginRight: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardContent: {
    marginLeft: 10,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  cardText: {
    fontSize: 14,
    color: "#666",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginVertical: 5,
    paddingVertical: 2,
    fontSize: 14,
  },
  updateButton: {
    backgroundColor: "#1E90FF",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: "#FF5252",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
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
});

export default RFIDIdentification;
