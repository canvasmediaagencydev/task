/**
 * Play a notification sound using Web Audio API
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create oscillator for the tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect oscillator to gain to speakers
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequency for a pleasant notification sound (C6 note)
    oscillator.frequency.value = 1046.5;
    oscillator.type = 'sine';

    // Set volume envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Clean up after sound finishes
    setTimeout(() => {
      audioContext.close();
    }, 400);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}
