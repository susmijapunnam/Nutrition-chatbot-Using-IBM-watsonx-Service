# 🥗 Personalized Nutrition Agent

An AI-powered Personalized Nutrition Agent built using **IBM watsonx.ai** and **IBM BOB** that provides customized diet recommendations based on a user's profile, including age, food preferences, medical conditions, and location.

---

## 📌 Project Overview

The Personalized Nutrition Agent is an intelligent chatbot designed to assist users in making healthier dietary choices. It collects user information through a conversational interface and generates personalized nutrition recommendations using IBM watsonx.ai foundation models.

This project demonstrates the integration of IBM Cloud services, Generative AI, and conversational AI to build a real-world healthcare assistant.

---

## 🚀 Features

- 👤 Collects user information
  - Age
  - Food Preferences
  - Health & Medical Conditions
  - Location (City, State, Country)

- 🤖 AI-powered personalized diet recommendations

- 💬 Interactive chatbot experience using IBM BOB

- 🔐 Secure IBM Cloud authentication using IAM API Tokens

- ⚡ Fast API integration with IBM watsonx.ai Runtime

- 🌐 Simple and responsive web interface

---

## 🛠️ Tech Stack

### AI & Cloud
- IBM watsonx.ai
- IBM watsonx.ai Studio
- IBM watsonx.ai Runtime
- IBM Cloud
- IBM IAM Authentication
- IBM BOB

### Backend
- Python
- Flask

### Frontend
- HTML
- CSS
- JavaScript

### APIs
- IBM watsonx.ai REST APIs

---

## 📂 Project Structure

```
Nutrition-Agent/
│
├── modules/
├── static/
├── templates/
├── app.py
├── requirements.txt
├── test_connection.py
├── find_project.py
├── .env.example
└── README.md
```

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/yourusername/Nutrition-Agent.git
```

```bash
cd Nutrition-Agent
```

### Create Virtual Environment

```bash
python -m venv venv
```

Activate the environment

Windows

```bash
venv\Scripts\activate
```

Linux / macOS

```bash
source venv/bin/activate
```

---

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables

Create a `.env` file and add your IBM Cloud credentials.

```env
IBM_API_KEY=YOUR_API_KEY
IBM_WATSONX_URL=YOUR_WATSONX_URL
IBM_PROJECT_ID=YOUR_PROJECT_ID
WATSONX_MODEL_ID=YOUR_MODEL_ID

FLASK_SECRET_KEY=your_secret_key
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
```

---

## ▶️ Run the Application

```bash
python app.py
```

Open your browser and visit

```
http://localhost:5000
```

---

## 💡 How It Works

1. User enters personal information.
2. The chatbot collects:
   - Age
   - Food Preferences
   - Medical Conditions
   - Location
3. Flask sends the prompt to IBM watsonx.ai.
4. IBM Foundation Model generates personalized nutrition advice.
5. The chatbot displays customized diet recommendations.

---

## 📸 Screenshots

### Chatbot Interface

(Add Screenshot Here)

### IBM BOB Integration

(Add Screenshot Here)

### API Connection

(Add Screenshot Here)

---

## 🎥 Demo

(Add your screen recording or YouTube video link here)

---

## 📚 Learning Outcomes

Through this project I learned:

- Generative AI
- IBM watsonx.ai
- IBM Cloud Services
- IBM BOB
- Prompt Engineering
- REST API Integration
- Flask Development
- Python Backend Development
- AI Chatbot Development
- Secure API Authentication

---

## 🎯 Future Enhancements

- BMI Calculator
- Multi-language Support
- Meal Tracking
- Calorie Counter
- User Authentication
- Nutrition Dashboard
- Voice Assistant Integration

---

## 🙏 Acknowledgements

This project was developed as part of the AI learning journey supported by:

- IBM
- IBM SkillsBuild
- AICTE
- Edunet Foundation

Special thanks to **Mr. Vignesh Muthuveelan** for his valuable guidance and mentorship throughout the project.

---

## 👨‍💻 Author

**Your Name**

LinkedIn:
https://www.linkedin.com/in/your-profile

GitHub:
https://github.com/yourusername

---

## ⭐ If you found this project useful

Please consider giving this repository a ⭐ on GitHub.
