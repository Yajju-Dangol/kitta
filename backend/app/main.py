import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.api.routers import history, nepse, ai_agent, quant, market

def create_app() -> FastAPI:
    app = FastAPI(
        title="KITTA Robust Backend",
        version="1.1.0",
        description="Professional REST API for KITTA Stock Analyzer, built for Render deployment."
    )

    # Configure CORS for frontend access
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Restrict in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health", tags=["system"])
    def health_check():
        return {"status": "ok", "service": "KITTA Robust Backend Engine"}

    # Include routers
    app.include_router(history.router)
    app.include_router(nepse.router)
    app.include_router(ai_agent.router)
    app.include_router(quant.router)
    app.include_router(market.router)

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    # Render binds to $PORT dynamically, or default to 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
