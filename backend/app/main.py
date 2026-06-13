from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.routers import auth, returns, analysis, credits, prevention, marketplace, dashboard
from fastapi.staticfiles import StaticFiles
import os

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("🚀 ReturnWise AI API Starting up...")
    yield
    print("🛑 ReturnWise AI API Shutting down...")


app = FastAPI(
    title="ReturnWise AI API",
    description="Intelligent return routing and second-life commerce platform powered by Google Gemini Vision",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Serve static files (uploaded images)
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:5173",
        "http://localhost:3000",
        # Add Vercel URL here after deployment
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ROUTERS ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api/auth",         tags=["Authentication"])
app.include_router(returns.router,      prefix="/api/returns",      tags=["Returns"])
app.include_router(analysis.router,     prefix="/api/analyze",      tags=["AI Analysis"])
app.include_router(credits.router,      prefix="/api/credits",      tags=["Green Credits"])
app.include_router(prevention.router,   prefix="/api/prevention",   tags=["Return Prevention"])
app.include_router(marketplace.router,  prefix="/api/listings",     tags=["Marketplace"])
app.include_router(dashboard.router,    prefix="/api/dashboard",    tags=["Dashboard"])


# ── HEALTH CHECK ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "ReturnWise AI API",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to ReturnWise AI API",
        "docs": "/docs",
        "health": "/api/health",
    }
