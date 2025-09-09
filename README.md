# PainAR

Augmented reality healthcare app for mapping and visualizing pain.  
Built during a hackathon to help patients communicate pain more effectively with healthcare providers.

---

## Overview
PainAR is a mobile AR application that enables patients to map, visualize, and track pain directly on their own body using augmented reality. Instead of struggling to describe pain verbally, users can overlay pain zones on a 3D body model, adjust intensity, and record pain history. This provides doctors with clearer, more structured insights into their patients’ conditions.

---
---

## Video Demonstration
[https://youtu.be/iXp7AocvTy0](https://youtu.be/iXp7AocvTy0)

---

## Features
- AR pain mapping – overlay pain regions on the body with precise location tracking  
- Pain intensity visualization – use color scales and gradients to indicate severity  
- Pain history tracking – save and review pain patterns over time  
- Improved communication – replace vague descriptions like "sharp pain in my side" with accurate visual data  
- Mobile and accessible – runs on modern smartphones with AR support  

---

## Tech Stack
- Frontend: React Native  
- AR & Vision Processing: Vision Camera, MediaPipe, Skia Frame Processors  
- Backend & Storage: Firebase (authentication and database)  
- Other Tools: Expo, JavaScript/TypeScript  

---

## How It Works
1. Open the app and point the camera at yourself  
2. Use the AR interface to select pain zones on your body  
3. Adjust the severity using sliders or color intensity  
4. Save sessions to track pain history  
5. Share results with your doctor for data-driven care  

---

## Inspiration
Patients often struggle to describe pain clearly, which can delay diagnosis and treatment. Our team wanted to bridge the communication gap by using AR technology to create an intuitive, visual language for pain.  

---

## Hackathon Context
PainAR was created at a healthcare-focused hackathon.  
It was recognized for its innovative use of AR in digital health and its potential real-world applications in patient care.

---

## Setup & Installation
Clone the repo and install dependencies:
```bash
git clone https://github.com/<your-username>/PainAR.git
cd PainAR
npm install
