from supabase import create_client, Client
from app.core.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY

# Regular client for normal operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Admin client for creating auth users
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)