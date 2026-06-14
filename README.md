<div align="center">

# 🌙 MoodScribe

### An AI-Powered Mental Health Journal

</div>

<div align="center">
  <img width="1920" height="1080" alt="Screenshot 2026-06-14 230315" src="https://github.com/user-attachments/assets/a2592aa7-3de5-44e1-b78f-83f061b8da4d" alt="Login screen" />
  <img width="1920" height="1080" alt="Screenshot 2026-06-14 230353" src="https://github.com/user-attachments/assets/d72158c2-69c9-4e75-ae87-e376fbd29eb0" width="45%" alt="Dashboard" />
</div>


---

## ✨ Overview

**MoodScribe** is a full-stack web application that turns journaling into emotional insight. A traditional journal is a passive record; MoodScribe is active — it reads each entry, detects the emotion behind it using a fine-tuned transformer model, and visualizes your emotional patterns over time.

The guiding idea: a *"Fitbit for your emotional wellbeing"* — effortless to use, private by design, and quietly revealing of trends you might not notice on your own.

Write an entry → the AI detects the emotion (and the runner-up) → it's saved privately to your account → your mood trend builds over time.

> ⚠️ **Note:** MoodScribe is a self-reflection and wellbeing tool, not a medical device. It makes no diagnostic claims.

---

## 🎯 Key Features

- 🧠 **AI emotion detection** — every entry is classified into one of six emotions using a fine-tuned DistilBERT model (**94.1% accuracy**)
- 🎭 **Primary + secondary emotion** — see not just the dominant feeling but the mix (e.g. *"Mostly love (76%), with a hint of joy (14%)"*)
- 📈 **Mood trends** — an interactive chart plots your emotional journey over time
- 🔐 **Secure authentication** — JWT-based auth with bcrypt-hashed passwords; entries are private per user
- 💎 **Liquid glass UI** — an Apple-inspired, frosted-glass design built from scratch
- 📱 **Fully responsive** — works seamlessly on desktop and mobile browsers
- ☁️ **Cloud-native** — model hosted on Hugging Face, database on MongoDB Atlas, frontend on Vercel

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React** (Vite) | UI library and build tooling |
| **React Router** | Client-side routing between screens |
| **Axios** | HTTP client for talking to the backend |
| **Recharts** | Mood-trend data visualization |
| **Custom CSS** | Hand-built liquid-glass (glassmorphism) design |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server |
| **PyMongo** | MongoDB driver |
| **python-jose** | JWT creation and verification |
| **passlib + bcrypt** | Password hashing |
| **python-dotenv** | Environment/secret management |

### Machine Learning
| Technology | Purpose |
|------------|---------|
| **PyTorch** | Deep learning engine |
| **Hugging Face Transformers** | Model loading and inference |
| **DistilBERT** | Base model, fine-tuned for emotion classification |
| **Datasets** | Loading the training data |
| **scikit-learn** | Evaluation metrics (accuracy, F1, confusion matrix) |

### Database & Infrastructure
| Service | Purpose |
|---------|---------|
| **MongoDB Atlas** | Cloud database |
| **Hugging Face Hub** | Hosting the trained model |
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting target |

---

## 🧠 The Machine Learning Model

The emotional core of MoodScribe is a **fine-tuned DistilBERT** model.

- **Base model:** `distilbert-base-uncased` — a lighter, faster distillation of BERT (~40% smaller, ~97% of the performance), chosen so inference runs on CPU without a GPU.
- **Task:** single-label sequence classification across **6 emotions** — `sadness`, `joy`, `love`, `anger`, `fear`, `surprise`.
- **Training data:** the [`dair-ai/emotion`](https://huggingface.co/datasets/dair-ai/emotion) dataset (~20,000 labelled sentences).
- **Results:** **94.1% accuracy** and **0.941 weighted F1** on the held-out test set.
- **Validation:** a confusion matrix and per-class precision/recall confirmed the model learned genuine semantic structure — its few errors fall between genuinely adjacent emotions (e.g. love ↔ joy), exactly as a human might confuse them.

The trained model is published to the Hugging Face Hub and loaded by the backend at startup.

---

## 🏗️ Architecture

MoodScribe follows a three-tier architecture with a machine-learning service:

```
┌─────────────────┐      HTTPS / JSON      ┌──────────────────────┐
│                 │  ───────────────────►  │                      │
│  React Frontend │                        │   FastAPI Backend    │
│  (liquid glass) │  ◄───────────────────  │  (REST API + JWT)    │
│                 │   emotion + trends     │                      │
└─────────────────┘                        └──────────┬───────────┘
                                                       │
                                       ┌───────────────┼────────────────┐
                                       ▼               ▼                ▼
                              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                              │  DistilBERT  │ │   MongoDB    │ │ Hugging Face │
                              │  (inference) │ │   (Atlas)    │ │ (model host) │
                              └──────────────┘ └──────────────┘ └──────────────┘
```

When a user saves an entry: the frontend sends the text to the backend with a JWT → the backend verifies the token, runs the text through DistilBERT, and stores the result in MongoDB → the analyzed emotion flows back to the UI and updates the mood chart.

---

## 📁 Project Structure

```
moodscribe/
├── backend/
│   ├── main.py              # FastAPI app: routes for auth, analysis, entries
│   ├── database.py          # MongoDB connection and collections
│   ├── auth.py              # Password hashing + JWT helpers
│   ├── requirements.txt     # Python dependencies
│   ├── runtime.txt          # Pinned Python version for deployment
│   └── .env                 # Secrets (NOT committed)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Dashboard.jsx      # Journaling + mood chart
│   │   ├── components/
│   │   │   ├── GlassCard.jsx      # Reusable frosted-glass surface
│   │   │   ├── MoodChart.jsx      # Recharts mood-over-time graph
│   │   │   └── ProtectedRoute.jsx # Route guard for logged-in users
│   │   ├── api.js                 # Axios instance + token interceptor
│   │   ├── App.jsx                # Routing
│   │   ├── index.css              # Global styles + design tokens
│   │   └── glass.css              # The liquid-glass effect
│   └── package.json
│
└── ml/
    └── train_emotion_model.ipynb  # Notebook: fine-tuning + evaluation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (LTS)
- [Python 3.12](https://www.python.org/downloads/)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 1. Clone the repository
```bash
git clone https://github.com/mayaankhan09/moodscribe.git
cd moodscribe
```

### 2. Backend setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/` with your own values:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
```

Run the backend:
```bash
uvicorn main:app --reload --port 8001
```
The API and interactive docs are now live at `http://127.0.0.1:8001/docs`.

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

> 💡 Both servers need to run at the same time — backend on `8001`, frontend on `5173`.

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Create a new account |
| `POST` | `/auth/login` | — | Authenticate and receive a JWT |
| `POST` | `/analyze` | ✅ | Analyze text without saving |
| `POST` | `/entries` | ✅ | Create an entry (runs emotion analysis + saves) |
| `GET`  | `/entries` | ✅ | List the logged-in user's entries (newest first) |

---

## 🎨 Design

The interface is built around a custom **liquid glass** aesthetic — frosted translucent panels over a soft gradient, achieved with `backdrop-filter: blur()`, translucent backgrounds, soft borders, and gentle shadows. Each of the six emotions has its own signature colour used consistently across chips and charts, keeping the experience calm and cohesive — fitting for a wellbeing app.

---

## 🔒 Security & Privacy

- Passwords are **hashed with bcrypt** — never stored in plain text.
- Authentication uses **stateless JWT tokens**.
- Every journal entry is **scoped to its owner** — users can only ever access their own data.
- Secrets live in environment variables, never in the codebase.

---

## 📝 Deployment Notes

The frontend is deployed to **Vercel**; the trained model is hosted on **Hugging Face Hub**; the database runs on **MongoDB Atlas**. The FastAPI backend (PyTorch + a ~250MB transformer) is resource-heavy for free hosting tiers, so it is run locally or in a containerized environment for inference. This reflects a real-world deployment consideration: serving large ML models requires more memory than free tiers typically provide.

---

## 🗺️ Roadmap

- [ ] Mood calendar heatmap
- [ ] Journaling streaks and gentle reminders
- [ ] Recurring-theme detection across entries
- [ ] Entry export
- [ ] Containerized backend deployment for full public hosting

---

## 👤 Author

**Mohammad Ayan Khan** — [@mayaankhan09](https://github.com/mayaankhan09)

---

<div align="center">

*Built with curiosity, persistence, and a lot of debugging. 💜*

</div>
