# Accessor

**Accessor** is a production-ready API Key Management and Usage Tracking System built with FastAPI and PostgreSQL. It is designed to mirror the infrastructure used by real SaaS companies like OpenAI and Stripe, allowing users to register, generate uniquely prefixed API keys (`acc-...`), and securely authenticate requests.

The system automatically tracks every API request made, logging the endpoint hit, response time, status code, and timestamp in real-time via a custom middleware layer. It serves as a complete, interview-ready demonstration of how production API infrastructure is architected and managed at scale.

## 🚀 Current Features

- **Professional Developer Console**: A sleek, custom-built frontend (HTML/CSS/Vanilla JS) styled like modern developer tools (e.g., Neon Console). Features a robust dark mode, full-width data tables, and minimal visual noise. Served directly by FastAPI.
- **User Authentication**: Secure JWT-based authentication with direct `bcrypt` password hashing (bypassing outdated passlib dependencies).
- **API Key Management**: Generates unique, secure API keys linked to specific users, featuring custom prefixes (`acc-...`). Manage and revoke keys instantly from the dashboard.
- **Real-Time Usage Tracking**: Custom FastAPI middleware intercepts API requests to log detailed usage statistics seamlessly into the database.
- **Analytics API**: Provides granular summaries of usage per key, natively using SQL aggregations to calculate total requests, success/failure rates, and average response times.
- **Interactive API Docs**: Fully automated Swagger UI documentation for testing all backend routes out-of-the-box.

## 🛠 Tech Stack

- **Backend Framework**: FastAPI
- **Frontend**: Vanilla HTML/CSS/JS (Served via FastAPI `StaticFiles`)
- **ORM & Database**: SQLModel, SQLAlchemy, PostgreSQL (Neon)
- **Security**: python-jose (JWT), bcrypt (Password Hashing)
- **Configuration**: pydantic-settings

## 📂 Directory Structure

```text
Accessor/
├── app/
│   ├── analytics/
│   │   └── router.py       # Analytics aggregation routes
│   ├── auth/
│   │   ├── router.py       # Login & Registration routes
│   │   └── utils.py        # JWT & bcrypt utilities
│   ├── keys/
│   │   └── router.py       # API Key CRUD routes
│   ├── middleware/
│   │   └── tracking.py     # Custom traffic tracking middleware
│   ├── static/             # Frontend UI Assets
│   │   ├── app.js          # Logic for auth & fetching data
│   │   ├── index.html      # Cyberpunk Grid Dashboard
│   │   └── style.css       # Boxy/Neon aesthetic styling
│   ├── core.py             # Environment configurations
│   ├── database.py         # DB connection & engine setup
│   ├── deps.py             # FastAPI dependencies (get_current_user)
│   ├── main.py             # FastAPI application entrypoint
│   ├── models.py           # SQLModel database schemas
│   └── schemas.py          # Pydantic validation schemas
├── scratch/                # Temporary/utility scripts
├── .env                    # Environment variables (not in version control)
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation
```

## 💻 Local Setup

1. **Clone the repository**
2. **Start Redis using Docker Compose**:
   ```bash
   docker-compose up -d
   ```
3. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Set up your environment variables**:
   Create a `.env` file in the root directory (matching settings in `app/core.py`) with your `DATABASE_URL` (PostgreSQL), `REDIS_URL` (e.g., `redis://localhost:6379`), and `SECRET_KEY`.
6. **Run the development server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The server will start on `http://127.0.0.1:8000` and automatically create the required database tables.*

## 📖 Interactive Documentation

Once the server is running, you can access the frontend and API documentation:

- **Frontend Dashboard**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger UI (Interactive API Docs)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc (Alternative API Docs)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## 🔮 Future Roadmap

- **Rate Limit Tiers**: Support multiple usage tiers (Free, Pro, Enterprise).
- **Live Dashboard**: Upgrade the frontend analytics with WebSocket-powered live stats.
- **Key Rotation**: Implement automated rotation logic for enterprise clients.

## ☁️ Deployment Architecture (Render + Neon + Upstash)
For deploying to a production environment like Render:
- **Database**: Use [Neon](https://neon.tech/) for serverless PostgreSQL.
- **Rate Limiting**: Use [Upstash](https://upstash.com/) for serverless Redis caching. Ensure you configure your `REDIS_URL` with the Upstash connection string.
- **Hosting**: Deploy the FastAPI app via Render Web Services.

## 📄 License
MIT License
