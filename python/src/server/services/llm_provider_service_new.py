"""
LLM Provider Service (Updated for Flexible Providers)

Provides a unified interface for creating OpenAI-compatible clients using
the new flexible model provider system. This service acts as a compatibility
layer for existing code while using the new model_provider_service backend.
"""

import time
from contextlib import asynccontextmanager
from typing import Any, Optional

import openai

from ..config.logfire_config import get_logger
from .model_provider_service import model_provider_service

logger = get_logger(__name__)

# Settings cache with TTL
_settings_cache: dict[str, tuple[Any, float]] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes


def _get_cached_settings(key: str) -> Any | None:
    """Get cached settings if not expired."""
    if key in _settings_cache:
        value, timestamp = _settings_cache[key]
        if time.time() - timestamp < _CACHE_TTL_SECONDS:
            return value
        else:
            # Expired, remove from cache
            del _settings_cache[key]
    return None


def _set_cached_settings(key: str, value: Any) -> None:
    """Cache settings with current timestamp."""
    _settings_cache[key] = (value, time.time())


@asynccontextmanager
async def get_llm_client(provider_name: str | None = None, use_embedding_provider: bool = False):
    """
    Create an async OpenAI-compatible client based on the configured provider.

    This context manager handles client creation for different LLM providers
    that support the OpenAI API format using the new flexible provider system.

    Args:
        provider_name: Override provider selection (for backwards compatibility)
        use_embedding_provider: Use the embedding provider instead of chat provider

    Yields:
        tuple: (openai.AsyncOpenAI client, model_info)
        - client: OpenAI-compatible client configured for the selected provider
        - model_info: Dictionary with model information
    """
    client = None

    try:
        if provider_name:
            # Legacy mode: find provider by name and use default model
            providers = await model_provider_service.get_all_providers()
            provider = next((p for p in providers if p.name == provider_name), None)
            
            if not provider:
                raise ValueError(f"Provider '{provider_name}' not found")
            
            # Get default model for the provider
            model_type = "embedding" if use_embedding_provider else "chat"
            models = await model_provider_service.get_provider_models(provider.id, model_type)
            if not models:
                raise ValueError(f"No {model_type} models found for provider '{provider_name}'")
            
            model = next((m for m in models if m.is_default), models[0])
            
        else:
            # Use selected providers
            if use_embedding_provider:
                provider, model = await model_provider_service.get_selected_embedding_model()
            else:
                provider, model = await model_provider_service.get_selected_chat_model()
            
            if not provider or not model:
                model_type = "embedding" if use_embedding_provider else "chat"
                raise ValueError(f"No {model_type} provider/model configured")

        logger.info(f"Creating LLM client for provider: {provider.display_name}, model: {model.model_name}")

        # Validate API key if required
        if provider.requires_api_key and not provider.api_key:
            raise ValueError(f"API key required for provider {provider.display_name}")

        # Create client
        api_key = provider.api_key if provider.requires_api_key else "dummy"
        base_url = provider.base_url

        client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )

        # Prepare model info for backwards compatibility
        model_info = {
            "model_id": model.model_id,
            "model_name": model.model_name,
            "provider_name": provider.name,
            "provider_display_name": provider.display_name,
            "max_tokens": model.max_tokens,
            "model_type": model.model_type
        }

        logger.info(f"Successfully created {model.model_type} client for {provider.display_name}/{model.model_name}")
        yield client, model_info

    except Exception as e:
        logger.error(
            f"Error creating LLM client for provider {provider_name if provider_name else 'selected'}: {e}"
        )
        raise
    finally:
        # Cleanup if needed
        pass


async def get_embedding_model(provider_name: str | None = None) -> str:
    """
    Get the configured embedding model ID based on the provider.

    Args:
        provider_name: Override provider selection (for backwards compatibility)

    Returns:
        str: The embedding model ID to use
    """
    try:
        if provider_name:
            # Legacy mode: find provider by name
            providers = await model_provider_service.get_all_providers()
            provider = next((p for p in providers if p.name == provider_name), None)
            
            if not provider:
                # Fallback to default
                logger.warning(f"Provider '{provider_name}' not found, using default")
                provider, model = await model_provider_service.get_selected_embedding_model()
            else:
                # Get default embedding model for this provider
                models = await model_provider_service.get_provider_models(provider.id, "embedding")
                model = next((m for m in models if m.is_default), models[0] if models else None)
        else:
            # Use selected provider
            provider, model = await model_provider_service.get_selected_embedding_model()

        if not model:
            # Fallback to a default
            logger.warning("No embedding model configured, falling back to default")
            return "text-embedding-3-small"

        logger.info(f"Using embedding model: {model.model_name} from {provider.display_name}")
        return model.model_id

    except Exception as e:
        logger.error(f"Error getting embedding model: {e}")
        # Fallback to OpenAI default
        return "text-embedding-3-small"


async def get_chat_model(provider_name: str | None = None) -> str:
    """
    Get the configured chat model ID based on the provider.

    Args:
        provider_name: Override provider selection (for backwards compatibility)

    Returns:
        str: The chat model ID to use
    """
    try:
        if provider_name:
            # Legacy mode: find provider by name
            providers = await model_provider_service.get_all_providers()
            provider = next((p for p in providers if p.name == provider_name), None)
            
            if not provider:
                # Fallback to default
                logger.warning(f"Provider '{provider_name}' not found, using default")
                provider, model = await model_provider_service.get_selected_chat_model()
            else:
                # Get default chat model for this provider
                models = await model_provider_service.get_provider_models(provider.id, "chat")
                model = next((m for m in models if m.is_default), models[0] if models else None)
        else:
            # Use selected provider
            provider, model = await model_provider_service.get_selected_chat_model()

        if not model:
            # Fallback to a default
            logger.warning("No chat model configured, falling back to default")
            return "gpt-4"

        logger.info(f"Using chat model: {model.model_name} from {provider.display_name}")
        return model.model_id

    except Exception as e:
        logger.error(f"Error getting chat model: {e}")
        # Fallback to OpenAI default
        return "gpt-4"


# Backwards compatibility functions
async def get_active_provider_info(service_type: str = "chat") -> dict[str, Any]:
    """
    Get active provider information for backwards compatibility.
    
    Args:
        service_type: Either 'chat' or 'embedding'
    
    Returns:
        Dict with provider information
    """
    try:
        if service_type == "embedding":
            provider, model = await model_provider_service.get_selected_embedding_model()
        else:
            provider, model = await model_provider_service.get_selected_chat_model()
        
        if not provider or not model:
            return {
                "provider": "openai",
                "model": "gpt-4" if service_type == "chat" else "text-embedding-3-small",
                "base_url": None,
                "has_api_key": False
            }
        
        return {
            "provider": provider.name,
            "model": model.model_id,
            "base_url": provider.base_url,
            "has_api_key": bool(provider.api_key),
            "provider_display_name": provider.display_name,
            "model_display_name": model.model_name
        }
        
    except Exception as e:
        logger.error(f"Error getting active provider info: {e}")
        return {
            "provider": "openai",
            "model": "gpt-4" if service_type == "chat" else "text-embedding-3-small",
            "base_url": None,
            "has_api_key": False
        }