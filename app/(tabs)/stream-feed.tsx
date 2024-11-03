import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import React, { useEffect, useState } from 'react';
import { firebaseDatabase } from '../../firebase/firebase';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { WebView } from 'react-native-webview';

export default function StreamFeed() {
  const [streamUrl, setStreamUrl] = useState("");

  const fetchStreamUrl = async () => {
    try {
      const snapshot = await firebaseDatabase.ref('/streamData/publicIp').once('value');
      const data: string | null = snapshot.val() || null; 
  
      if (data) { setStreamUrl(data); console.log(data) }
    } catch (error) {
      console.error("Error fetching stream URL:", error);
    }
  };

  useEffect(() => {
    fetchStreamUrl(); 
  }, []);


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#B99470', dark: '#DD5746' }}
      headerImage={<Ionicons size={310} name="image-outline" style={styles.headerImage} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Stream Feed</ThemedText>
        <ThemedText type="title" style={{ fontSize: 28 }}>📹</ThemedText>
      </ThemedView>
        <WebView
          source={{ uri: streamUrl }}
          style={{ height: 250 }}
          startInLoadingState={true}
          scalesPageToFit={true}
          cacheMode="LOAD_NO_CACHE"
          cacheEnabled={false}
          androidLayerType='hardware'
          onLoadStart={() => console.log('Load started')}
          onLoadEnd={() => console.log('Load finished')}
          onError={() => console.log('An error occurred')}  
          />

        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={fetchStreamUrl}>
            <ThemedText type="default">Refresh Feed</ThemedText>
          </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#FFF5CD',
    bottom: -90,  
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
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
});