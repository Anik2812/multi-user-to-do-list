<div align="center">
  <img src="https://github.com/user-attachments/assets/508a6894-14df-4bb4-a9d0-c1066167ab49" alt="TaskMaster Pro Logo" width="200"/>
  
  # 🚀 TaskMaster Pro
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)](https://github.com/Anik2812/multi-user-to-do-list/releases)
  [![Netlify Status](https://api.netlify.com/api/v1/badges/da9e65ce-a516-455b-aee0-1e55d424b664/deploy-status)](https://app.netlify.com/sites/taskmasterpros/deploys)
  
  > Elevate Your Productivity to Superhero Levels! 🦸‍♂️🦸‍♀️
</div>

---

<p align="center">
  <a href="#-turn-chaos-into-clarity">Overview</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-overview">API Overview</a> •
  <a href="#-live-demo">Live Demo</a>
</p>

---

## Experience it here

### 🌐 Live Demo
Experience the magic of TaskMaster Pro in action:
https://taskmasterpros.netlify.app/


## 🌟 Turn Chaos into Clarity

TaskMaster Pro isn't just another todo app. It's your personal productivity sidekick, designed to transform the way you manage tasks, collaborate with teams, and conquer your goals. Say goodbye to scattered notes and hello to streamlined efficiency!

<div align="center">
  <img src="https://github.com/user-attachments/assets/6a87df42-ed58-46a9-8fde-6aa00ffa5474" alt="TaskMaster Pro Screenshot" width="600"/>
</div>

## ✨ Key Features

- 🔐 **Fort Knox-Level Security**: Multi-user authentication that's tighter than a superhero's costume
- 🌓 **Mood-Matching Themes**: Switch between light and dark modes faster than a chameleon
- 📊 **Task Mastery**: Create, edit, prioritize, and demolish tasks with the snap of your fingers
- 👥 **Telepathic Collaboration**: Share tasks and updates in real-time, no mind-reading required
- 🖼️ **Avatar Awesomeness**: Personalize your profile with avatars that speak louder than words
- 📈 **Stat Attack**: Crunch your productivity numbers and watch your efficiency soar
- 🔄 **Sync Sorcery**: Your tasks follow you across devices like a well-trained puppy

## 🛠️ Tech Stack

<div align="center">

[![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![HTML5](https://img.shields.io/badge/-HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/-CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Google Sheets API](https://img.shields.io/badge/-Google%20Sheets%20API-34A853?style=for-the-badge&logo=google-sheets&logoColor=white)](https://developers.google.com/sheets/api)
[![JWT](https://img.shields.io/badge/-JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)

</div>

## 🚀 Getting Started

1. **Clone the Repo of Awesomeness**
   ```bash
   git clone https://github.com/Anik2812/multi-user-to-do-list.git
   cd taskmaster-pro
   ```

2. **Summon the Dependencies**
   ```bash
     npm install
   ```

3. Craft Your Magic Spells (.env file)
 ```
    PORT=5000
    JWT_SECRET=your_super_secret_spell
    GOOGLE_SHEET_ID=your_mystical_sheet_id
 ```

4. Ignite the Servers
   ```
     npm start
   ```

## 📘 API Overview

Harness the power of TaskMaster Pro with these mystical endpoints:


### 🔐 Authentication Sorcery

* `POST /api/auth/signup`: Forge a new user account
* `POST /api/auth/login`: Conjure a JWT for access
* `POST /api/auth/change-avatar`: Transmute your digital visage


### 📝 Task Manipulation Wizardry

* `GET /api/tasks`: Summon all tasks
* `POST /api/tasks`: Manifest a new task
* `PUT /api/tasks/:id`: Alter the fabric of an existing task
* `DELETE /api/tasks/:id`: Banish a task to the void
* `POST /api/tasks/share`: Telepathically share tasks


## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check issues page.

## 📝 License
This project is MIT licensed.

---
<div align="center">
  Made by Anik
</div>
