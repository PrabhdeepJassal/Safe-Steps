import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

export default function RecordingScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);

  // State for camera and recording
  const [facing, setFacing] = useState('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pipImageUri, setPipImageUri] = useState(null);
  
  const cameraRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      await requestPermission();
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(mediaStatus.status === 'granted');
    })();
  }, []);
  
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setRecordingDuration(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRecording]);
  
  const handleRecord = async () => {
    if (!cameraRef.current) {
        Alert.alert('Error', 'Camera is not ready.');
        return;
    }
    if (isRecording) {
      // Set state immediately for instant UI feedback
      setIsRecording(false); 
      // This will then call onRecordingEnd in the background
      cameraRef.current.stopRecording();
    } else {
      setIsRecording(true);
      const options = {
          quality: '1080p',
          maxDuration: 600, // 10 minutes
          mute: false,
      };
      cameraRef.current.record(options);
    }
  };

  // This function now only handles the file saving after recording has stopped.
  const handleVideoSave = async (video) => {
    if (mediaLibraryPermission) {
      try {
        await MediaLibrary.saveToLibraryAsync(video.uri);
        Alert.alert('Success', 'Recording saved to your library!');
      } catch (e) {
        console.error("Failed to save video:", e);
        Alert.alert('Error', 'Failed to save recording.');
      }
    } else {
        Alert.alert('Permission Denied', 'Cannot save video without media library permission.');
    }
  };

  const toggleCameraFacing = async () => {
    if (isRecording || !cameraRef.current) return;
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.1 });
      setPipImageUri(picture.uri);
      setFacing(prev => (prev === 'back' ? 'front' : 'back'));
    } catch (e) {
      console.error("Failed to switch camera:", e);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.errorText}>Camera and microphone access is required.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
        videoStabilization={'auto'}
        mode="video"
        onRecordingEnd={handleVideoSave}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        {isRecording && (
          <View style={styles.timerContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.timerText}>{formatTime(recordingDuration)}</Text>
          </View>
        )}
      </View>

      <View style={styles.pipContainer}>
        {pipImageUri ? (
          <Image source={{ uri: pipImageUri }} style={styles.pipImage} />
        ) : (
          <View style={styles.pipPlaceholder}>
            <Ionicons name="camera-outline" size={30} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.controlPlaceholder} />
        <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
          <View style={[styles.recordInner, isRecording && styles.recordInnerStop]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.switchButton} onPress={toggleCameraFacing} disabled={isRecording}>
          <Ionicons name="camera-reverse-outline" size={32} color={isRecording ? '#666' : '#fff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  backButton: {
    padding: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pipContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pipImage: {
    flex: 1,
  },
  pipPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    borderWidth: 3,
    borderColor: '#fff',
  },
  recordInnerStop: {
    backgroundColor: '#FF3B30',
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  switchButton: {
    padding: 10,
  },
  controlPlaceholder: {
    width: 52, // to balance the switch button
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
  },
  permissionButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
  },
  permissionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
  }
});