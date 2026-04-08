import cv2
import mediapipe as mp
import time
import pygame
import os

import math
import struct
import wave

sound_enabled = False
alert_sound = None
mute = False
ALERT_SOUND_PATHS = [
    os.path.join('static', 'alert.mp3'),
    os.path.join('static', 'alert.wav'),
]
ALERT_SOUND_PATH = None


def _generate_alert_wav(path, duration=0.4, freq=880, volume=0.4, sample_rate=44100):
    frames = []
    num_frames = int(duration * sample_rate)
    for i in range(num_frames):
        t = i / sample_rate
        sample = volume * math.sin(2 * math.pi * freq * t)
        frames.append(struct.pack('<h', int(sample * 32767)))

    with wave.open(path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(b''.join(frames))

try:
    pygame.mixer.init()
    for path in ALERT_SOUND_PATHS:
        if os.path.exists(path):
            ALERT_SOUND_PATH = path
            break

    if ALERT_SOUND_PATH is None:
        os.makedirs('static', exist_ok=True)
        ALERT_SOUND_PATH = ALERT_SOUND_PATHS[1]
        _generate_alert_wav(ALERT_SOUND_PATH)
        print(f"Generated fallback alert sound: {ALERT_SOUND_PATH}")

    alert_sound = pygame.mixer.Sound(ALERT_SOUND_PATH)
    alert_sound.set_volume(0.7)
    sound_enabled = True
except Exception as exc:
    print("Warning: sound disabled because mixer could not be initialized:", exc)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Waiting for camera to become available...")
    retry_start = time.time()
    while not cap.isOpened() and time.time() - retry_start < 5:
        time.sleep(0.5)
        cap.open(0)

if not cap.isOpened():
    raise RuntimeError("Unable to open camera. Please check your webcam and try again.")

blink_count = 0
start_time = time.time()
last_blink_time = 0.0

def eye_aspect_ratio(landmarks, eye_indices):
    points = [landmarks[i] for i in eye_indices]
    vertical = abs(points[1].y - points[5].y) + abs(points[2].y - points[4].y)
    horizontal = abs(points[0].x - points[3].x)
    return vertical / horizontal

LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

while True:
    ret, frame = cap.read()
    if not ret or frame is None:
        time.sleep(0.1)
        continue

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if not result or not result.multi_face_landmarks:
        cv2.imshow("Eye Tracker", frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break
        continue

    for face_landmarks in result.multi_face_landmarks:
        landmarks = face_landmarks.landmark

        left_ear = eye_aspect_ratio(landmarks, LEFT_EYE)
        right_ear = eye_aspect_ratio(landmarks, RIGHT_EYE)

        ear = (left_ear + right_ear) / 2

        if ear < 0.02:  # blink threshold
            current_time = time.time()
            if current_time - last_blink_time > 0.5:
                blink_count += 1
                last_blink_time = current_time

    elapsed = time.time() - start_time

    # Check blink rate every 10 seconds
    if elapsed > 10:
        if blink_count < 5:
            print("⚠️ Low blink rate!")
            if sound_enabled and alert_sound and not mute:
                alert_sound.play()

        blink_count = 0
        start_time = time.time()

    status_text = f"Sound: {'OFF' if mute else 'ON'} (press 'm' to toggle)"
    cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0) if not mute else (0, 0, 255), 2)

    cv2.imshow("Eye Tracker", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == 27:
        break
    if key == ord('m'):
        mute = not mute
        print(f"Mute toggled: {'ON' if mute else 'OFF'}")

cap.release()
cv2.destroyAllWindows()