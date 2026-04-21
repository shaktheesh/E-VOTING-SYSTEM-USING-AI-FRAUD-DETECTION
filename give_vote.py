from sklearn.neighbors import KNeighborsClassifier
import cv2
import pickle
import numpy as np
import os
import csv
import time
from datetime import datetime
from win32com.client import Dispatch

def speak(str1):
    speak = Dispatch(("SAPI.SpVoice"))
    speak.Speak(str1)

video = cv2.VideoCapture(0)
facedetect = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

if not os.path.exists('data/'):
    os.makedirs('data/')

with open('data/names.pkl', 'rb') as f:
    LABELS = pickle.load(f)

with open('data/faces_data.pkl', 'rb') as f:
    FACES = pickle.load(f)

knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(FACES, LABELS)

# Load and resize background
imgBackground = cv2.imread(r"D:\smartElectionGfg-main\smartElectionGfg-main\background.png")
imgBackground = cv2.resize(imgBackground, (800, 480))  # wider layout for space

imgBackground = cv2.imread("background.png")

if imgBackground is None:
    print("Error: background.png not found")
    exit()

imgBackground = cv2.resize(imgBackground, (800, 480))
COL_NAMES = ['NAME', 'VOTE', 'DATE', 'TIME']

def check_if_exists(value):
    try:
        with open("Votes.csv", "r") as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                if row and row[0] == value:
                    return True
    except FileNotFoundError:
        print("Votes.csv not found, creating new file.")
    return False

while True:
    ret, frame = video.read()
    frame = cv2.resize(frame, (320, 240))
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = facedetect.detectMultiScale(gray, 1.3, 5)
    
    output = None
    for (x, y, w, h) in faces:
        crop_img = frame[y:y+h, x:x+w]
        resized_img = cv2.resize(crop_img, (50, 50)).flatten().reshape(1, -1)
        output = knn.predict(resized_img)
        ts = time.time()
        date = datetime.fromtimestamp(ts).strftime("%d-%m-%Y")
        timestamp = datetime.fromtimestamp(ts).strftime("%H:%M-%S")
        exist = os.path.isfile("Votes.csv")

        # Draw face box
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 200, 255), 2)
        cv2.rectangle(frame, (x, y-30), (x+w, y), (0, 200, 255), -1)
        cv2.putText(frame, str(output[0]), (x+5, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

    # ---- UI LAYOUT ----
    ui_frame = imgBackground.copy()

    # Place webcam feed on LEFT side
    ui_frame[120:120 + 240, 40:40 + 320] = frame

    # Add a stylish border
    cv2.rectangle(ui_frame, (35, 115), (370, 370), (255, 255, 255), 2)

    # Add a cool title text on top
    cv2.putText(ui_frame, "SMART VOTING SYSTEM", (400, 80), cv2.FONT_HERSHEY_DUPLEX, 1, (0, 255, 255), 2)

    # Add instructions
    cv2.putText(ui_frame, "Press 1: BJP  |  2: CONGRESS", (400, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)
    cv2.putText(ui_frame, "Press 3: AAP  |  4: NOTA", (400, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)
    cv2.putText(ui_frame, "Press 'Q' to Quit", (400, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)

    cv2.imshow('Voting System', ui_frame)
    k = cv2.waitKey(1)

    if k == ord('q'):
        break

    if output is not None:
        voter_exist = check_if_exists(output[0])
        if voter_exist:
            speak("YOU HAVE ALREADY VOTED")
            break

        if k == ord('1'):
            vote = "BJP"
        elif k == ord('2'):
            vote = "CONGRESS"
        elif k == ord('3'):
            vote = "AAP"
        elif k == ord('4'):
            vote = "NOTA"
        else:
            continue

        speak("YOUR VOTE HAS BEEN RECORDED")
        time.sleep(2)
        if exist:
            with open("Votes.csv", "a") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow([output[0], vote, date, timestamp])
        else:
            with open("Votes.csv", "a") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(COL_NAMES)
                writer.writerow([output[0], vote, date, timestamp])
        speak("THANK YOU FOR PARTICIPATING IN THE ELECTIONS")
        break

video.release()
cv2.destroyAllWindows()
