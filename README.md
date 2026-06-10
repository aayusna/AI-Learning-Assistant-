# 🎓 AI-Powered Personalized Learning & Career Guidance Assistant

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?style=for-the-badge&logo=fastapi)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-black?style=for-the-badge&logo=openai)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-darkgreen?style=for-the-badge&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**A centralized AI platform that helps students learn smarter, build better resumes, and plan their careers — all in one place.**

[Features](#-features) • [Architecture](#-system-architecture) • [Installation](#-installation-guide) • [API Docs](#-api-endpoints) • [Future Plans](#-future-enhancements)

</div>

---

## 1. 📌 Project Overview

The **AI-Powered Personalized Learning & Career Guidance Assistant** is a full-stack backend platform built for students who want intelligent, personalized support across academics and career preparation.

Students can upload study materials and get AI-generated summaries, ask academic doubts via a chatbot, analyze their resume against ATS systems, receive career roadmaps tailored to their skills, and generate quizzes for self-assessment — all through a single unified API platform.

The system is powered by **OpenAI GPT-4o-mini**, **FAISS vector search**, **LangChain RAG pipelines**, and **MongoDB** — demonstrating real-world applications of Artificial Intelligence, Natural Language Processing, and Software Engineering.

---

## 2. 🚩 Problem Statement

Students in colleges and universities face a combination of challenges that hinder their academic and professional growth:

| Problem | Impact |
|---|---|
| Difficulty understanding complex academic topics | Low grades, low confidence |
| No personalized learning support | One-size-fits-all teaching fails many students |
| Confusion about which career path to pursue | Wrong skill development, wasted time |
| Poor resume quality and low ATS scores | Rejection before human review |
| Limited interview preparation guidance | Failures in placement drives |
| No centralized platform for all these needs | Students juggle 5-6 disconnected tools |

Teachers and mentors cannot provide individual attention to every student due to time constraints. This project proposes an **AI assistant that scales personalized guidance to every student simultaneously**.

---

## 3. 🎯 Objectives

1. Build an **AI Study Assistant** that answers academic doubts from uploaded documents using RAG
2. Develop a **Resume Analyzer** that calculates ATS scores and suggests improvements
3. Create a **Career Guidance System** that maps student skills to career paths and learning roadmaps
4. Implement an **AI Chatbot** supporting study, career counseling, and interview preparation modes
5. Design a **Student Dashboard** that tracks learning progress and performance over time
6. Demonstrate practical use of **NLP, LLMs, Vector Databases, and REST API development**

---

## 4. ✨ Features

### 🤖 AI Study Assistant
<img width="834" height="562" alt="Screenshot 2569-06-10 at 2 36 13 PM" src="https://github.com/user-attachments/assets/5eaa6750-33ac-4a0b-ae72-695542134296" />

- Upload PDF or DOCX study materials
- Ask questions about your documents — answers are grounded in your content (RAG)
- Generate concise summaries in short / medium / detailed format
- Auto-generate structured study notes on any topic
- Create MCQ quizzes with explanations for self-testing

### 📄 Resume Analyzer
<img width="1130" height="834" alt="Screenshot 2569-06-04 at 9 41 40 PM" src="https://github.com/user-attachments/assets/6899f6fd-a65f-4115-8a46-5c14439cdf87" />

- Upload resume as PDF, DOCX, or TXT
- ATS score out of 100 with detailed breakdown
- Matched and missing keyword analysis
- Detects presence of contact info, education, experience, and skills sections
- AI-generated improvement suggestions specific to your resume

### 🗺️ Career Guidance System
<img width="834" height="562" alt="Screenshot 2569-06-10 at 2 35 16 PM" src="https://github.com/user-attachments/assets/4d24984f-06d6-4c82-8e58-18bb1ea78b71" />

- Input your current skills and interests
- Recommends the best-fit career path (Data Scientist, Backend Engineer, ML Engineer, etc.)
- Identifies skill gaps between your profile and your target role
- Generates a week-by-week learning roadmap with resources
- Recommends certifications (Coursera, Google, AWS, etc.)
- Estimates time to job-readiness

### 💬 AI Chatbot (3 modes)
<img width="834" height="562" alt="Screenshot 2569-06-10 at 2 37 33 PM" src="https://github.com/user-attachments/assets/d0413567-296d-4e95-be78-ee8dd0c47ed9" />

| Mode | Use Case |
|---|---|
| `study` | Academic doubt solving, concept explanation |
| `career` | Career counseling, job market advice |
| `interview` | Mock interview questions and tips |

### 📊 Student Dashboard
<img width="1438" height="809" alt="Screenshot 2569-06-10 at 8 32 15 AM" src="https://github.com/user-attachments/assets/1c023e6c-e245-4fcf-9f52-bc75bbd9f626" />

- Total documents uploaded
- Quizzes taken
- Resume ATS score history
- Last active timestamp
- Recent chat session history

### 🔐 Authentication
- JWT-based stateless authentication
- Secure bcrypt password hashing
- Protected routes — all AI features require login

---

## 5. 🔄 System Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                        STUDENT                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    Registers / Logs in
                           │ JWT Token issued
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Upload   │  │  Ask     │  │ Analyze  │  │  Career  │   │
│  │Document  │  │ Question │  │ Resume   │  │ Roadmap  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼──────────────┼─────────┘
        │             │             │              │
        ▼             ▼             ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                   AI / NLP Engine                        │
│                                                          │
│  PDF Text    FAISS Vector   ATS Keyword    GPT-4o-mini   │
│  Extraction  Search Index   Matching       Generation    │
│  (pdfplumber)(faiss-cpu)   (regex+list)   (openai SDK)   │
└──────────────────────────────────────────────────────────┘
        │                                        │
        ▼                                        ▼
┌───────────────┐                    ┌───────────────────┐
│   MongoDB     │                    │  SQLite3          │
│               │                    │                   │
│ users         │                    │ quiz_results      │
│ chat_sessions │                    │ resume_scores     │
│ documents     │                    │ chat_history      │
└───────────────┘                    └───────────────────┘
        │
        ▼
┌───────────────────────────────┐
│      Student Dashboard        │
│  Progress · Scores · History  │
└───────────────────────────────┘
```

**Step-by-step flow:**
1. Student registers and receives a JWT access token
2. Student uploads a PDF study material or resume
3. Backend extracts text using pdfplumber / python-docx
4. For study Q&A — text is chunked, embedded, and stored in FAISS
5. Student asks a question — relevant chunks retrieved, sent to GPT with context
6. For resume — keywords matched, ATS score calculated, GPT generates suggestions
7. For career — skills compared to career path requirements, GPT generates roadmap
8. All activity is saved to MongoDB / SQLite3 and shown on the dashboard

---

## 6. 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | Core language |
| FastAPI | 0.115 | REST API framework |
| Uvicorn | 0.30 | ASGI server |
| Pydantic | 2.8 | Data validation and schemas |

### Artificial Intelligence & NLP
| Technology | Purpose |
|---|---|
| OpenAI GPT-4o-mini | Chatbot, summarization, quiz generation, career roadmap |
| OpenAI Embeddings (text-embedding-3-small) | Document vectorization for RAG |
| FAISS (faiss-cpu) | Vector similarity search for document Q&A |
| pdfplumber | PDF text extraction |
| python-docx | DOCX text extraction |

### Database
| Technology | Purpose |
|---|---|
| MongoDB + Motor | User profiles, sessions, async operations |
| SQLite3 | Quiz results, resume score history (structured data) |

### Authentication & Security
| Technology | Purpose |
|---|---|
| python-jose | JWT token creation and validation |
| passlib + bcrypt | Secure password hashing |

### DevOps & Tooling
| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Git + GitHub | Version control |
| pytest + httpx | Unit and integration testing |
| python-dotenv | Environment configuration |

---

## 7. 🏗️ System Architecture

```
ai-learning-assistant/
│
├── 📄 .env                      ← API keys and config (never commit this)
├── 📄 .env.example              ← Template for environment variables
├── 📄 requirements.txt          ← Python package dependencies
├── 📄 Dockerfile                ← Container configuration
├── 📄 README.md                 ← This file
│
├── 📁 data/                     ← Sample PDFs and test resumes
├── 📁 notebooks/
│   ├── 01_rag_prototype.ipynb   ← RAG pipeline prototyping
│   └── 02_resume_parser_test.ipynb ← Resume analyzer prototyping
│
├── 📁 src/                      ← All production source code
│   ├── 📄 main.py               ← App entry point, route registration
│   │
│   ├── 📁 core/                 ← App-wide configuration
│   │   ├── config.py            ← Loads .env settings via pydantic-settings
│   │   ├── database.py          ← MongoDB async connection (Motor)
│   │   ├── sqlite_database.py   ← SQLite3 connection and table setup
│   │   ├── security.py          ← JWT creation, password hashing, auth guard
│   │   └── constants.py         ← ATS keywords, career paths, model names
│   │
│   ├── 📁 models/
│   │   └── schemas.py           ← All Pydantic request/response models
│   │
│   ├── 📁 services/             ← All AI and business logic
│   │   ├── rag_pipeline.py      ← PDF→chunks→FAISS→GPT answer chain
│   │   ├── resume_analyzer.py   ← ATS scoring, keyword matching, suggestions
│   │   ├── career_guidance.py   ← Career path matching, roadmap generation
│   │   └── auth_service.py      ← User registration, login, MongoDB CRUD
│   │
│   └── 📁 api/routes/           ← HTTP endpoints (thin layer, calls services)
│       ├── auth_routes.py        ← POST /register, POST /login, GET /me
│       ├── chat_routes.py        ← POST /chat/ask, POST /chat/upload-document
│       ├── study_routes.py       ← POST /study/summarize, /generate-quiz, /generate-notes
│       ├── resume_routes.py      ← POST /resume/analyze
│       ├── career_routes.py      ← POST /career/roadmap, /interview-questions
│       └── dashboard_routes.py   ← GET /dashboard/stats, /dashboard/history
│
└── 📁 tests/
    ├── api/
    │   ├── test_auth_routes.py
    │   ├── test_chat_routes.py
    │   └── test_resume_routes.py
    └── services/
        ├── test_rag_pipeline.py
        └── test_resume_analyzer.py
```

**Architecture Pattern:** The project follows a strict layered architecture:
- **Routes** → receive HTTP requests, validate input, call services, return responses
- **Services** → contain all AI and business logic, know nothing about HTTP
- **Core** → shared utilities (config, database, security) used across all layers
- **Models** → Pydantic schemas that define the contract between layers

---

## 8. 🚀 Installation Guide

### Prerequisites
- Python 3.11+
- MongoDB running locally or MongoDB Atlas account
- OpenAI API key (get free $5 credit at platform.openai.com)

### Step 1 — Clone the repository
```bash
git clone https://github.com/yourusername/ai-learning-assistant.git
cd ai-learning-assistant
```

### Step 2 — Create virtual environment
```bash
# Mac / Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### Step 3 — Install dependencies
```bash
pip install fastapi "uvicorn[standard]" python-multipart \
  "python-jose[cryptography]" "passlib[bcrypt]" \
  pymongo motor openai pdfplumber python-docx \
  faiss-cpu numpy "pydantic[email]" pydantic-settings \
  python-dotenv pytest pytest-asyncio httpx
```

### Step 4 — Configure environment variables
```bash
cp .env.example .env
```

Open `.env` and fill in your values:
```env
SECRET_KEY=your-random-secret-key-here
OPENAI_API_KEY=sk-...your-openai-key...
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=ai_learning_db
ALLOWED_ORIGINS=["http://localhost:3000"]
```

### Step 5 — Start MongoDB
```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or start existing container
docker start mongodb
```

### Step 6 — Run the server
```bash
uvicorn src.main:app --reload
```

### Step 7 — Open API documentation
```
http://localhost:8000/docs
```

You will see the full interactive Swagger UI with all endpoints ready to test.

### Step 8 — Run tests
```bash
pytest tests/ -v
```

---

## 9. 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Create new student account | ❌ |
| POST | `/api/auth/login` | Login and get JWT token | ❌ |
| GET | `/api/auth/me` | Get current user profile | ✅ |
| POST | `/api/chat/upload-document` | Upload PDF/DOCX for Q&A | ✅ |
| POST | `/api/chat/ask` | Ask AI chatbot (study/career/interview mode) | ✅ |
| POST | `/api/study/summarize` | Summarize any text | ✅ |
| POST | `/api/study/generate-quiz` | Generate MCQ quiz on any topic | ✅ |
| POST | `/api/study/generate-notes` | Generate structured study notes | ✅ |
| POST | `/api/resume/analyze` | Upload resume and get ATS score | ✅ |
| POST | `/api/career/roadmap` | Get personalized career roadmap | ✅ |
| POST | `/api/career/interview-questions` | Generate interview questions | ✅ |
| POST | `/api/career/placement-tips` | Get placement preparation tips | ✅ |
| GET | `/api/dashboard/stats` | Get student progress stats | ✅ |
| GET | `/api/dashboard/history` | Get recent activity history | ✅ |
| GET | `/health` | Server health check | ❌ |

### Example: Register and Chat

```bash
# 1. Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Rahul", "email": "rahul@test.com", "password": "pass1234"}'

# 2. Ask chatbot (use token from register response)
curl -X POST http://localhost:8000/api/chat/ask \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is machine learning?", "mode": "study"}'
```

---

## 10. 📸 Screenshots

### Interactive API Documentation (Swagger UI)
```
http://localhost:8000/docs
```
FastAPI automatically generates a full interactive UI where you can test every
endpoint — register, upload files, ask questions, and see live responses without
needing any frontend.

### Resume Analysis Response (Sample)
```json
{
  "ats_score": 74.5,
  "matched_keywords": ["python", "fastapi", "mongodb", "git", "sql", "machine learning"],
  "missing_keywords": ["docker", "aws", "kubernetes", "ci/cd"],
  "skills_found": ["python", "fastapi", "mongodb"],
  "suggestions": [
    "Add Docker and containerization experience to your skills section",
    "Quantify your achievements with numbers (e.g. 'reduced API latency by 30%')",
    "Include a professional summary at the top of your resume",
    "Add AWS or cloud platform experience — highly sought by employers",
    "Mention Agile/Scrum methodology in your experience section"
  ],
  "word_count": 312,
  "has_contact_info": true,
  "has_education": true,
  "has_experience": true
}
```

### Career Roadmap Response (Sample)
```json
{
  "recommended_path": "Backend Engineer",
  "skill_gaps": ["docker", "kubernetes", "aws"],
  "learning_roadmap": [
    {"week": "Week 1-2", "topic": "Docker fundamentals", "resource": "Docker official docs + freeCodeCamp YouTube"},
    {"week": "Week 3-4", "topic": "REST API best practices", "resource": "FastAPI advanced tutorial"},
    {"week": "Week 5-6", "topic": "AWS EC2 and S3 basics", "resource": "AWS Free Tier + A Cloud Guru"},
    {"week": "Week 7-8", "topic": "CI/CD with GitHub Actions", "resource": "GitHub Actions documentation"},
    {"week": "Week 9-10", "topic": "System Design fundamentals", "resource": "Grokking System Design (Educative)"}
  ],
  "certifications": ["AWS Cloud Practitioner", "Docker Certified Associate"],
  "estimated_weeks": 12
}
```

---

## 11. 🔮 Future Enhancements

| Enhancement | Description | Priority |
|---|---|---|
| **React Frontend** | Full web UI with dashboard, chat interface, resume upload page | 🔴 High |
| **Voice Chatbot** | Speech-to-text input and text-to-speech responses | 🟡 Medium |
| **Multilingual Support** | Hindi + English language support for regional students | 🟡 Medium |
| **AI Mock Interview** | Real-time interview simulation with feedback scoring | 🔴 High |
| **Mobile App** | React Native app for Android and iOS | 🟡 Medium |
| **Emotion Detection** | Detect student stress/confusion from chat patterns | 🟢 Low |
| **College ERP Integration** | Connect with college attendance and grade systems | 🟢 Low |
| **Peer Learning Groups** | AI-matched study groups based on topics and goals | 🟡 Medium |
| **Progress Reports** | Weekly AI-generated PDF progress report for students | 🟡 Medium |
| **Fine-tuned Model** | Custom model trained on academic Q&A for better accuracy | 🟢 Low |

---

## 🧠 Key AI/Engineering Concepts Demonstrated

- **RAG (Retrieval-Augmented Generation)** — Document → chunks → FAISS embeddings → context-grounded GPT answers
- **ATS Keyword Matching** — Resume text parsed and scored against industry keyword lists
- **Async FastAPI** — All database and AI API calls are fully non-blocking
- **JWT Authentication** — Stateless auth with bcrypt password hashing
- **Dependency Injection** — Auth guard reused across all protected routes via FastAPI `Depends`
- **Modular Architecture** — Routes, services, and core are fully decoupled and independently testable
- **Vector Similarity Search** — FAISS IndexFlatL2 for finding relevant document chunks
- **Pydantic Validation** — All inputs and outputs are typed, validated, and documented

---

## 👤 Author

**[AAYUSHI BAKRECHA]**
B.Tech Computer Science Engineering [AI&ML]

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aayusna)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)]([https://linkedin.com/in/yourprofile](https://www.linkedin.com/in/aayushi-bakrecha-084637304?utm_source=share_via&utm_content=profile&utm_medium=member_android)v)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Made with ❤️ for students who deserve better tools
</div>
