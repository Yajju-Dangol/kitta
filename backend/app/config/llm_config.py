"""
LLM Configuration with fallback support.
Supports Gemini as primary and OpenRouter as backup.
"""
import os
from typing import Literal

# Model provider types
ModelProvider = Literal["gemini", "openrouter"]

# Environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Model configurations
class ModelConfig:
    """Configuration for LLM models with fallback support."""
    
    # Primary models (Gemini)
    GEMINI_FLASH = "gemini-1.5-flash"
    GEMINI_FLASH_LITE = "gemini-3.1-flash-lite"
    
    # Fallback models (OpenRouter)
    OPENROUTER_FREE = "openrouter/free"
    
    @staticmethod
    def get_model_for_agent(agent_type: str = "analyst") -> tuple[str, ModelProvider]:
        """
        Get the appropriate model for an agent with fallback logic.
        
        Args:
            agent_type: Type of agent (analyst, chart, news)
            
        Returns:
            Tuple of (model_name, provider)
        """
        # Check if Gemini API key is available
        if GEMINI_API_KEY:
            # Use Gemini models
            if agent_type == "analyst":
                return (ModelConfig.GEMINI_FLASH, "gemini")
            elif agent_type in ["chart", "news"]:
                return (ModelConfig.GEMINI_FLASH, "gemini")
            else:
                return (ModelConfig.GEMINI_FLASH, "gemini")
        
        # Fallback to OpenRouter if Gemini not available
        elif OPENROUTER_API_KEY:
            print(f"[WARNING] GEMINI_API_KEY not found. Falling back to OpenRouter for {agent_type} agent.")
            return (ModelConfig.OPENROUTER_FREE, "openrouter")
        
        # No API keys available
        else:
            raise ValueError(
                "No LLM API keys configured. Please set either GEMINI_API_KEY or OPENROUTER_API_KEY in your .env file."
            )
    
    @staticmethod
    def get_api_config(provider: ModelProvider) -> dict:
        """
        Get API configuration for the specified provider.
        
        Args:
            provider: The model provider (gemini or openrouter)
            
        Returns:
            Dictionary with API configuration
        """
        if provider == "gemini":
            if not GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY not configured")
            return {
                "api_key": GEMINI_API_KEY,
                "base_url": None  # Uses default Google API
            }
        
        elif provider == "openrouter":
            if not OPENROUTER_API_KEY:
                raise ValueError("OPENROUTER_API_KEY not configured")
            return {
                "api_key": OPENROUTER_API_KEY,
                "base_url": "https://openrouter.ai/api/v1"
            }
        
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    @staticmethod
    def is_gemini_available() -> bool:
        """Check if Gemini API is available."""
        return bool(GEMINI_API_KEY)
    
    @staticmethod
    def is_openrouter_available() -> bool:
        """Check if OpenRouter API is available."""
        return bool(OPENROUTER_API_KEY)
