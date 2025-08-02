"""
PainAR Backend Settings Configuration

This module defines the application settings using Pydantic BaseSettings
to load configuration from environment variables and .env files.
"""

from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # OpenAI Configuration
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    model_name: str = Field(default="gpt-4o-mini", env="MODEL_NAME")
    vector_dim: int = Field(default=1536, env="VECTOR_DIM")
    
    # Database Configuration
    database_url: str = Field(..., env="DATABASE_URL")
    
    # API Configuration
    debug: bool = Field(default=False, env="DEBUG")
    secret_key: str = Field(default="dev-secret-key", env="SECRET_KEY")
    allowed_hosts: str = Field(
        default="localhost,127.0.0.1", 
        env="ALLOWED_HOSTS"
    )
    
    # Authentication
    dev_token: str = Field(default="dev-token", env="DEV_TOKEN")
    
    # Observability (Optional)
    langsmith_api_key: Optional[str] = Field(default=None, env="LANGSMITH_API_KEY")
    langsmith_project: str = Field(default="painar-backend", env="LANGSMITH_PROJECT")
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")
    
    class Config:
        """Pydantic configuration for settings."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @property
    def allowed_hosts_list(self) -> list[str]:
        """Parse allowed hosts from comma-separated string to list."""
        return [host.strip() for host in self.allowed_hosts.split(",")]


# Global settings instance
settings = Settings()
