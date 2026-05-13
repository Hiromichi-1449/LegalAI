from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    database_url: str  # postgres+asyncpg://...
    supabase_url: str
    supabase_service_key: str

    # Auth0
    auth0_domain: str
    auth0_audience: str

    # OpenAI
    openai_api_key: str

    # Anthropic
    anthropic_api_key: str

    # SendGrid
    sendgrid_api_key: str
    sendgrid_from_email: str

    # Gmail OAuth
    gmail_client_id: str
    gmail_client_secret: str
    gmail_redirect_uri: str

    # App
    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
