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

    # Splunk
    splunk_enabled: bool = False
    splunk_hec_url: str = ""
    splunk_hec_token: str = ""
    splunk_index: str = "legalai"
    splunk_source: str = "legalai-backend"
    splunk_sourcetype: str = "legalai:json"
    splunk_timeout_seconds: int = 3
    splunk_alert_secret: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
