"""
Model Provider Service

Handles management of flexible model providers including:
- Creating, updating, and deleting providers
- Managing provider models (chat and embedding)
- Getting active provider configurations
- Encrypting/decrypting API keys
"""

import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict
import openai

from ..config.logfire_config import get_logger
from .credential_service import credential_service

logger = get_logger(__name__)


@dataclass
class ModelProvider:
    """Represents a model provider configuration."""
    id: str
    name: str
    display_name: str
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    requires_api_key: bool = True
    is_active: bool = True
    provider_type: str = "openai_compatible"
    description: Optional[str] = None
    configuration: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.configuration is None:
            self.configuration = {}


@dataclass
class ProviderModel:
    """Represents a model available from a provider."""
    id: str
    provider_id: str
    model_id: str
    model_name: str
    model_type: str  # 'chat' or 'embedding'
    is_default: bool = False
    is_active: bool = True
    max_tokens: Optional[int] = None
    cost_per_token_input: Optional[float] = None
    cost_per_token_output: Optional[float] = None
    description: Optional[str] = None
    configuration: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.configuration is None:
            self.configuration = {}


class ModelProviderService:
    """Service for managing model providers and their models."""

    def __init__(self):
        self._supabase = None

    def _get_supabase_client(self):
        """Get Supabase client from credential service."""
        return credential_service._get_supabase_client()

    async def get_all_providers(self, include_inactive: bool = False) -> List[ModelProvider]:
        """Get all model providers."""
        try:
            supabase = self._get_supabase_client()
            
            query = supabase.table("archon_model_providers").select("*")
            if not include_inactive:
                query = query.eq("is_active", True)
            
            result = query.order("display_name").execute()
            
            providers = []
            for item in result.data:
                # Decrypt API key if present
                api_key = None
                if item.get("api_key_encrypted"):
                    try:
                        api_key = credential_service._decrypt_value(item["api_key_encrypted"])
                    except Exception as e:
                        logger.warning(f"Failed to decrypt API key for provider {item['name']}: {e}")
                
                provider = ModelProvider(
                    id=item["id"],
                    name=item["name"],
                    display_name=item["display_name"],
                    base_url=item.get("base_url"),
                    api_key=api_key,
                    requires_api_key=item.get("requires_api_key", True),
                    is_active=item.get("is_active", True),
                    provider_type=item.get("provider_type", "openai_compatible"),
                    description=item.get("description"),
                    configuration=item.get("configuration", {})
                )
                providers.append(provider)
            
            logger.info(f"Retrieved {len(providers)} model providers")
            return providers
            
        except Exception as e:
            logger.error(f"Error getting model providers: {e}")
            raise

    async def get_provider_by_id(self, provider_id: str) -> Optional[ModelProvider]:
        """Get a specific provider by ID."""
        try:
            supabase = self._get_supabase_client()
            result = supabase.table("archon_model_providers").select("*").eq("id", provider_id).execute()
            
            if not result.data:
                return None
            
            item = result.data[0]
            
            # Decrypt API key if present
            api_key = None
            if item.get("api_key_encrypted"):
                try:
                    api_key = credential_service._decrypt_value(item["api_key_encrypted"])
                except Exception as e:
                    logger.warning(f"Failed to decrypt API key for provider {item['name']}: {e}")
            
            return ModelProvider(
                id=item["id"],
                name=item["name"],
                display_name=item["display_name"],
                base_url=item.get("base_url"),
                api_key=api_key,
                requires_api_key=item.get("requires_api_key", True),
                is_active=item.get("is_active", True),
                provider_type=item.get("provider_type", "openai_compatible"),
                description=item.get("description"),
                configuration=item.get("configuration", {})
            )
            
        except Exception as e:
            logger.error(f"Error getting provider {provider_id}: {e}")
            return None

    async def create_provider(self, provider: ModelProvider) -> str:
        """Create a new model provider."""
        try:
            supabase = self._get_supabase_client()
            
            # Generate ID if not provided
            if not provider.id:
                provider.id = str(uuid.uuid4())
            
            # Encrypt API key if provided
            api_key_encrypted = None
            if provider.api_key:
                api_key_encrypted = credential_service._encrypt_value(provider.api_key)
            
            data = {
                "id": provider.id,
                "name": provider.name,
                "display_name": provider.display_name,
                "base_url": provider.base_url,
                "api_key_encrypted": api_key_encrypted,
                "requires_api_key": provider.requires_api_key,
                "is_active": provider.is_active,
                "provider_type": provider.provider_type,
                "description": provider.description,
                "configuration": provider.configuration
            }
            
            result = supabase.table("archon_model_providers").insert(data).execute()
            
            logger.info(f"Created model provider: {provider.name}")
            return provider.id
            
        except Exception as e:
            logger.error(f"Error creating provider: {e}")
            raise

    async def update_provider(self, provider: ModelProvider) -> bool:
        """Update an existing model provider."""
        try:
            supabase = self._get_supabase_client()
            
            # Encrypt API key if provided
            api_key_encrypted = None
            if provider.api_key:
                api_key_encrypted = credential_service._encrypt_value(provider.api_key)
            
            data = {
                "name": provider.name,
                "display_name": provider.display_name,
                "base_url": provider.base_url,
                "api_key_encrypted": api_key_encrypted,
                "requires_api_key": provider.requires_api_key,
                "is_active": provider.is_active,
                "provider_type": provider.provider_type,
                "description": provider.description,
                "configuration": provider.configuration
            }
            
            supabase.table("archon_model_providers").update(data).eq("id", provider.id).execute()
            
            logger.info(f"Updated model provider: {provider.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating provider {provider.id}: {e}")
            return False

    async def delete_provider(self, provider_id: str) -> bool:
        """Delete a model provider."""
        try:
            supabase = self._get_supabase_client()
            supabase.table("archon_model_providers").delete().eq("id", provider_id).execute()
            
            logger.info(f"Deleted model provider: {provider_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting provider {provider_id}: {e}")
            return False

    async def get_provider_models(self, provider_id: str, model_type: Optional[str] = None, include_inactive: bool = False) -> List[ProviderModel]:
        """Get models for a specific provider."""
        try:
            supabase = self._get_supabase_client()
            
            query = supabase.table("archon_provider_models").select("*").eq("provider_id", provider_id)
            
            if model_type:
                query = query.eq("model_type", model_type)
            
            if not include_inactive:
                query = query.eq("is_active", True)
            
            result = query.order("model_name").execute()
            
            models = []
            for item in result.data:
                model = ProviderModel(
                    id=item["id"],
                    provider_id=item["provider_id"],
                    model_id=item["model_id"],
                    model_name=item["model_name"],
                    model_type=item["model_type"],
                    is_default=item.get("is_default", False),
                    is_active=item.get("is_active", True),
                    max_tokens=item.get("max_tokens"),
                    cost_per_token_input=float(item["cost_per_token_input"]) if item.get("cost_per_token_input") else None,
                    cost_per_token_output=float(item["cost_per_token_output"]) if item.get("cost_per_token_output") else None,
                    description=item.get("description"),
                    configuration=item.get("configuration", {})
                )
                models.append(model)
            
            logger.info(f"Retrieved {len(models)} models for provider {provider_id}")
            return models
            
        except Exception as e:
            logger.error(f"Error getting models for provider {provider_id}: {e}")
            return []

    async def create_provider_model(self, model: ProviderModel) -> str:
        """Create a new model for a provider."""
        try:
            supabase = self._get_supabase_client()
            
            # Generate ID if not provided
            if not model.id:
                model.id = str(uuid.uuid4())
            
            data = {
                "id": model.id,
                "provider_id": model.provider_id,
                "model_id": model.model_id,
                "model_name": model.model_name,
                "model_type": model.model_type,
                "is_default": model.is_default,
                "is_active": model.is_active,
                "max_tokens": model.max_tokens,
                "cost_per_token_input": model.cost_per_token_input,
                "cost_per_token_output": model.cost_per_token_output,
                "description": model.description,
                "configuration": model.configuration
            }
            
            result = supabase.table("archon_provider_models").insert(data).execute()
            
            logger.info(f"Created model: {model.model_name} for provider {model.provider_id}")
            return model.id
            
        except Exception as e:
            logger.error(f"Error creating model: {e}")
            raise

    async def update_provider_model(self, model: ProviderModel) -> bool:
        """Update an existing provider model."""
        try:
            supabase = self._get_supabase_client()
            
            data = {
                "model_id": model.model_id,
                "model_name": model.model_name,
                "model_type": model.model_type,
                "is_default": model.is_default,
                "is_active": model.is_active,
                "max_tokens": model.max_tokens,
                "cost_per_token_input": model.cost_per_token_input,
                "cost_per_token_output": model.cost_per_token_output,
                "description": model.description,
                "configuration": model.configuration
            }
            
            supabase.table("archon_provider_models").update(data).eq("id", model.id).execute()
            
            logger.info(f"Updated model: {model.model_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating model {model.id}: {e}")
            return False

    async def delete_provider_model(self, model_id: str) -> bool:
        """Delete a provider model."""
        try:
            supabase = self._get_supabase_client()
            supabase.table("archon_provider_models").delete().eq("id", model_id).execute()
            
            logger.info(f"Deleted model: {model_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting model {model_id}: {e}")
            return False

    async def get_selected_chat_model(self) -> tuple[Optional[ModelProvider], Optional[ProviderModel]]:
        """Get the currently selected chat model and its provider."""
        try:
            # Get selected provider and model IDs from settings
            provider_id = await credential_service.get_credential("SELECTED_CHAT_PROVIDER_ID")
            model_id = await credential_service.get_credential("SELECTED_CHAT_MODEL_ID")
            
            if not provider_id or not model_id:
                # Fallback to first available chat model
                return await self._get_default_model("chat")
            
            provider = await self.get_provider_by_id(provider_id)
            if not provider:
                return await self._get_default_model("chat")
            
            models = await self.get_provider_models(provider_id, "chat")
            selected_model = next((m for m in models if m.model_id == model_id), None)
            
            if not selected_model:
                return await self._get_default_model("chat")
            
            return provider, selected_model
            
        except Exception as e:
            logger.error(f"Error getting selected chat model: {e}")
            return await self._get_default_model("chat")

    async def get_selected_embedding_model(self) -> tuple[Optional[ModelProvider], Optional[ProviderModel]]:
        """Get the currently selected embedding model and its provider."""
        try:
            # Get selected provider and model IDs from settings
            provider_id = await credential_service.get_credential("SELECTED_EMBEDDING_PROVIDER_ID")
            model_id = await credential_service.get_credential("SELECTED_EMBEDDING_MODEL_ID")
            
            if not provider_id or not model_id:
                # Fallback to first available embedding model
                return await self._get_default_model("embedding")
            
            provider = await self.get_provider_by_id(provider_id)
            if not provider:
                return await self._get_default_model("embedding")
            
            models = await self.get_provider_models(provider_id, "embedding")
            selected_model = next((m for m in models if m.model_id == model_id), None)
            
            if not selected_model:
                return await self._get_default_model("embedding")
            
            return provider, selected_model
            
        except Exception as e:
            logger.error(f"Error getting selected embedding model: {e}")
            return await self._get_default_model("embedding")

    async def _get_default_model(self, model_type: str) -> tuple[Optional[ModelProvider], Optional[ProviderModel]]:
        """Get the first available default model of the specified type."""
        try:
            providers = await self.get_all_providers()
            
            for provider in providers:
                models = await self.get_provider_models(provider.id, model_type)
                default_model = next((m for m in models if m.is_default), None)
                if default_model:
                    return provider, default_model
                # If no default, take first available
                if models:
                    return provider, models[0]
            
            return None, None
            
        except Exception as e:
            logger.error(f"Error getting default {model_type} model: {e}")
            return None, None

    async def set_selected_chat_model(self, provider_id: str, model_id: str) -> bool:
        """Set the selected chat model."""
        try:
            await credential_service.set_credential("SELECTED_CHAT_PROVIDER_ID", provider_id, category="rag_strategy")
            await credential_service.set_credential("SELECTED_CHAT_MODEL_ID", model_id, category="rag_strategy")
            logger.info(f"Set selected chat model: {provider_id}/{model_id}")
            return True
        except Exception as e:
            logger.error(f"Error setting selected chat model: {e}")
            return False

    async def set_selected_embedding_model(self, provider_id: str, model_id: str) -> bool:
        """Set the selected embedding model."""
        try:
            await credential_service.set_credential("SELECTED_EMBEDDING_PROVIDER_ID", provider_id, category="rag_strategy")
            await credential_service.set_credential("SELECTED_EMBEDDING_MODEL_ID", model_id, category="rag_strategy")
            logger.info(f"Set selected embedding model: {provider_id}/{model_id}")
            return True
        except Exception as e:
            logger.error(f"Error setting selected embedding model: {e}")
            return False

    @asynccontextmanager
    async def get_chat_client(self):
        """Get an OpenAI-compatible client for the selected chat model."""
        provider, model = await self.get_selected_chat_model()
        
        if not provider or not model:
            raise ValueError("No chat model selected or available")
        
        client = None
        try:
            if provider.requires_api_key and not provider.api_key:
                raise ValueError(f"API key required for provider {provider.display_name}")
            
            api_key = provider.api_key if provider.requires_api_key else "dummy"
            base_url = provider.base_url
            
            client = openai.AsyncOpenAI(
                api_key=api_key,
                base_url=base_url
            )
            
            logger.info(f"Created chat client for {provider.display_name}/{model.model_name}")
            yield client, model
            
        except Exception as e:
            logger.error(f"Error creating chat client: {e}")
            raise
        finally:
            # Cleanup if needed
            pass

    @asynccontextmanager
    async def get_embedding_client(self):
        """Get an OpenAI-compatible client for the selected embedding model."""
        provider, model = await self.get_selected_embedding_model()
        
        if not provider or not model:
            raise ValueError("No embedding model selected or available")
        
        client = None
        try:
            if provider.requires_api_key and not provider.api_key:
                raise ValueError(f"API key required for provider {provider.display_name}")
            
            api_key = provider.api_key if provider.requires_api_key else "dummy"
            base_url = provider.base_url
            
            client = openai.AsyncOpenAI(
                api_key=api_key,
                base_url=base_url
            )
            
            logger.info(f"Created embedding client for {provider.display_name}/{model.model_name}")
            yield client, model
            
        except Exception as e:
            logger.error(f"Error creating embedding client: {e}")
            raise
        finally:
            # Cleanup if needed
            pass


# Global instance
model_provider_service = ModelProviderService()