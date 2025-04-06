import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 5000); // Adjust to your video length

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Video
        source={require('../assets/splash_video.mp4')} // Adjust path
        ref={videoRef}
        style={styles.video}
        resizeMode="cover"
        repeat={false}
        playInBackground={false}
        playWhenInactive={false}
        muted={false}
        onEnd={() => navigation.replace('Login')} // Optional
        onError={(error) => console.log('Video Error:', error)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  video: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default SplashScreen;