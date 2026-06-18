import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Setup these environment variables in your backend .env file:
# SUPABASE_URL=your_project_url
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def get_supabase_client() -> Client:
    """
    Returns a Supabase client initialized with the Service Role Key.
    This client bypasses Row Level Security (RLS) and should ONLY be used
    in secure backend environments. Do not leak the Service Role Key.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL or Service Role Key missing. Please set them in .env")
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# Singleton instance for general backend use
supabase_db = get_supabase_client() if SUPABASE_URL and SUPABASE_KEY else None
