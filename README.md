# 🧵 Thread Art Lab (Threadify)

> **Full-Stack String Art & Thread Pattern Generation Engine**

[![Python](https://img.shields.io/badge/Python-v3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-v18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v5.4-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Overview

**Thread Art Lab** is a full-stack computational string art generation system. It converts digital images into physical string art patterns using mathematical pin-to-pin ray casting, contrast optimization, and line density routing.

The project features a **Python (FastAPI/OpenCV/Pillow/ReportLab)** backend for high-performance pattern calculation & PDF blueprint generation, paired with a **React + Vite** frontend and Google Colab execution scripts.

---

## ✨ Features

- 🖼️ **Image Processing Pipeline**: Contrast adjustment, grayscale conversion, and edge detection optimized for thread art.
- 🧵 **Pin-to-Pin Ray Casting Engine**: Computes optimal string line paths across circular and square pin layouts.
- 📄 **PDF Assembly Blueprint Generation**: Generates printable multi-page PDF templates and nail numbering guides with ReportLab.
- 💻 **Interactive React Frontend**: Upload images, preview thread rendering, adjust pins, and export outputs.
- 📓 **Google Colab Notebook**: `threadify_colab.ipynb` for cloud-based GPU/CPU batch pattern processing.

---

## 🛠️ Architecture & Tech Stack

### **Backend (`/backend`)**
- **Language**: Python 3.10+
- **API Framework**: FastAPI / Uvicorn
- **Image Processing**: OpenCV (`opencv-python`), Pillow (`PIL`), NumPy
- **PDF Generation**: ReportLab
- **Core Modules**:
  - `thread_art.py`: Mathematical pattern generator & line routing engine
  - `pdf_generator.py`: Printable PDF layout builder
  - `main.py`: REST API server

### **Frontend (`/frontend`)**
- **Framework**: React 18 + Vite
- **Language**: JavaScript / JSX
- **Styling**: Tailwind CSS, Lucide Icons

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: v3.10 or higher
- **Node.js**: v18 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/Blackdevil1234567/thread-art-lab.git
cd thread-art-lab
```

### 2. Start Backend & Frontend (One-Click Startup)
On Windows, simply run:
```cmd
start.bat
```

Or start components individually:

#### **Backend Setup**
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # On Windows
pip install -r requirements.txt
python main.py
```

#### **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

---

## 📜 License

MIT License
