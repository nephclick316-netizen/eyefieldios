export const requestCameraAndMicPermissions = async () => {
  try {
    // This triggers the browser/wrapper permission prompt
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    
    // Stop the tracks immediately after testing
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    console.error("Permissions denied", err);
    return false;
  }
};

/**
 * Note: For the final build, you must add these to your Info.plist (iOS):
 * NSCameraUsageDescription: "EyeField needs camera access for video calls."
 * NSMicrophoneUsageDescription: "EyeField needs microphone access for calls and voice commands."
 */