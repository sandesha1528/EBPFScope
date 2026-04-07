from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    api_key: str = "default_unsafe_token"
    sqlite_db_path: str = "ebpfscope.db"
    
    class Config:
        env_prefix = "EBPFSCOPE_"
        env_file = ".env"

settings = Settings()
