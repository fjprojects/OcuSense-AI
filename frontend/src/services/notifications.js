let audioContext;

export async function enableReminderSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  audioContext = audioContext || new Audio();
  if (audioContext.state === 'suspended') await audioContext.resume();
}

export function playReminderSound() {
  if (!audioContext || audioContext.state !== 'running') return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.15, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.4);
}

export function showReminderNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const options = { body, icon: (process.env.PUBLIC_URL || '') + '/icon.svg' };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) return registration.showNotification(title, options);
      return new Notification(title, options);
    }).catch(() => {});
  } else {
    try { new Notification(title, options); } catch { /* In-app alerts remain available. */ }
  }
}
