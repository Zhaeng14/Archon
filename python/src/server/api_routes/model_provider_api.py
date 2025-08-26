"""
Model Provider API Routes

Provides REST API endpoints for managing model providers and their models.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from ..config.logfire_config import get_logger
from ..services.model_provider_service import model_provider_service, ModelProvider, ProviderModel

logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/model-providers", tags=["Model Providers"])


# Pydantic models for API
class ModelProviderRequest(BaseModel):
    name: str = Field(..., description="Provider name (lowercase, no spaces)")
    display_name: str = Field(..., description="Display name for the provider")
    base_url: Optional[str] = Field(None, description="Base URL for the provider API")
    api_key: Optional[str] = Field(None, description="API key for the provider")
    requires_api_key: bool = Field(True, description="Whether this provider requires an API key")
    is_active: bool = Field(True, description="Whether this provider is active")
    provider_type: str = Field("openai_compatible", description="Type of provider")
    description: Optional[str] = Field(None, description="Description of the provider")


class ModelProviderResponse(BaseModel):
    id: str
    name: str
    display_name: str
    base_url: Optional[str] = None
    has_api_key: bool = False  # Don't expose the actual API key
    requires_api_key: bool = True
    is_active: bool = True
    provider_type: str = "openai_compatible"
    description: Optional[str] = None


class ProviderModelRequest(BaseModel):
    model_id: str = Field(..., description="Model identifier used by the provider")
    model_name: str = Field(..., description="Human-readable model name")
    model_type: str = Field(..., description="Type of model: 'chat' or 'embedding'")
    is_default: bool = Field(False, description="Whether this is the default model for this type")
    is_active: bool = Field(True, description="Whether this model is active")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens supported")
    cost_per_token_input: Optional[float] = Field(None, description="Cost per input token")
    cost_per_token_output: Optional[float] = Field(None, description="Cost per output token")
    description: Optional[str] = Field(None, description="Model description")


class ProviderModelResponse(BaseModel):
    id: str
    provider_id: str
    model_id: str
    model_name: str
    model_type: str
    is_default: bool = False
    is_active: bool = True
    max_tokens: Optional[int] = None
    cost_per_token_input: Optional[float] = None
    cost_per_token_output: Optional[float] = None
    description: Optional[str] = None


class ModelSelectionRequest(BaseModel):
    chat_provider_id: str = Field(..., description="Provider ID for chat model")
    chat_model_id: str = Field(..., description="Model ID for chat model")
    embedding_provider_id: str = Field(..., description="Provider ID for embedding model")
    embedding_model_id: str = Field(..., description="Model ID for embedding model")


class SelectedModelsResponse(BaseModel):
    chat_provider: Optional[ModelProviderResponse] = None
    chat_model: Optional[ProviderModelResponse] = None
    embedding_provider: Optional[ModelProviderResponse] = None
    embedding_model: Optional[ProviderModelResponse] = None


def _convert_provider_to_response(provider: ModelProvider) -> ModelProviderResponse:
    """Convert ModelProvider to API response format."""
    return ModelProviderResponse(
        id=provider.id,
        name=provider.name,
        display_name=provider.display_name,
        base_url=provider.base_url,
        has_api_key=bool(provider.api_key),
        requires_api_key=provider.requires_api_key,
        is_active=provider.is_active,
        provider_type=provider.provider_type,
        description=provider.description
    )


def _convert_model_to_response(model: ProviderModel) -> ProviderModelResponse:
    """Convert ProviderModel to API response format."""
    return ProviderModelResponse(
        id=model.id,
        provider_id=model.provider_id,
        model_id=model.model_id,
        model_name=model.model_name,
        model_type=model.model_type,
        is_default=model.is_default,
        is_active=model.is_active,
        max_tokens=model.max_tokens,
        cost_per_token_input=model.cost_per_token_input,
        cost_per_token_output=model.cost_per_token_output,
        description=model.description
    )


# Provider management endpoints
@router.get("/", response_model=List[ModelProviderResponse])
async def get_providers(include_inactive: bool = False):
    """Get all model providers."""
    try:
        providers = await model_provider_service.get_all_providers(include_inactive)
        return [_convert_provider_to_response(p) for p in providers]
    except Exception as e:
        logger.error(f"Error getting providers: {e}")
        raise HTTPException(status_code=500, detail="Failed to get providers")


@router.get("/{provider_id}", response_model=ModelProviderResponse)
async def get_provider(provider_id: str):
    """Get a specific provider."""
    try:
        provider = await model_provider_service.get_provider_by_id(provider_id)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        return _convert_provider_to_response(provider)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting provider {provider_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get provider")


@router.post("/", response_model=dict)
async def create_provider(request: ModelProviderRequest):
    """Create a new model provider."""
    try:
        provider = ModelProvider(
            id="",  # Will be generated
            name=request.name,
            display_name=request.display_name,
            base_url=request.base_url,
            api_key=request.api_key,
            requires_api_key=request.requires_api_key,
            is_active=request.is_active,
            provider_type=request.provider_type,
            description=request.description
        )
        
        provider_id = await model_provider_service.create_provider(provider)
        return {"id": provider_id, "message": "Provider created successfully"}
        
    except Exception as e:
        logger.error(f"Error creating provider: {e}")
        raise HTTPException(status_code=500, detail="Failed to create provider")


@router.put("/{provider_id}", response_model=dict)
async def update_provider(provider_id: str, request: ModelProviderRequest):
    """Update an existing provider."""
    try:
        # Get existing provider to preserve ID
        existing = await model_provider_service.get_provider_by_id(provider_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        provider = ModelProvider(
            id=provider_id,
            name=request.name,
            display_name=request.display_name,
            base_url=request.base_url,
            api_key=request.api_key,
            requires_api_key=request.requires_api_key,
            is_active=request.is_active,
            provider_type=request.provider_type,
            description=request.description
        )
        
        success = await model_provider_service.update_provider(provider)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update provider")
            
        return {"message": "Provider updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating provider {provider_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update provider")


@router.delete("/{provider_id}", response_model=dict)
async def delete_provider(provider_id: str):
    """Delete a provider."""
    try:
        success = await model_provider_service.delete_provider(provider_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete provider")
            
        return {"message": "Provider deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting provider {provider_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete provider")


# Model management endpoints
@router.get("/{provider_id}/models", response_model=List[ProviderModelResponse])
async def get_provider_models(
    provider_id: str, 
    model_type: Optional[str] = None,
    include_inactive: bool = False
):
    """Get models for a provider."""
    try:
        models = await model_provider_service.get_provider_models(
            provider_id, model_type, include_inactive
        )
        return [_convert_model_to_response(m) for m in models]
    except Exception as e:
        logger.error(f"Error getting models for provider {provider_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get provider models")


@router.post("/{provider_id}/models", response_model=dict)
async def create_provider_model(provider_id: str, request: ProviderModelRequest):
    """Create a new model for a provider."""
    try:
        model = ProviderModel(
            id="",  # Will be generated
            provider_id=provider_id,
            model_id=request.model_id,
            model_name=request.model_name,
            model_type=request.model_type,
            is_default=request.is_default,
            is_active=request.is_active,
            max_tokens=request.max_tokens,
            cost_per_token_input=request.cost_per_token_input,
            cost_per_token_output=request.cost_per_token_output,
            description=request.description
        )
        
        model_id = await model_provider_service.create_provider_model(model)
        return {"id": model_id, "message": "Model created successfully"}
        
    except Exception as e:
        logger.error(f"Error creating model for provider {provider_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create model")


@router.put("/{provider_id}/models/{model_id}", response_model=dict)
async def update_provider_model(
    provider_id: str, 
    model_id: str, 
    request: ProviderModelRequest
):
    """Update an existing model."""
    try:
        model = ProviderModel(
            id=model_id,
            provider_id=provider_id,
            model_id=request.model_id,
            model_name=request.model_name,
            model_type=request.model_type,
            is_default=request.is_default,
            is_active=request.is_active,
            max_tokens=request.max_tokens,
            cost_per_token_input=request.cost_per_token_input,
            cost_per_token_output=request.cost_per_token_output,
            description=request.description
        )
        
        success = await model_provider_service.update_provider_model(model)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update model")
            
        return {"message": "Model updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update model")


@router.delete("/{provider_id}/models/{model_id}", response_model=dict)
async def delete_provider_model(provider_id: str, model_id: str):
    """Delete a model."""
    try:
        success = await model_provider_service.delete_provider_model(model_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete model")
            
        return {"message": "Model deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete model")


# Model selection endpoints
@router.get("/selection/current", response_model=SelectedModelsResponse)
async def get_selected_models():
    """Get currently selected chat and embedding models."""
    try:
        chat_provider, chat_model = await model_provider_service.get_selected_chat_model()
        embedding_provider, embedding_model = await model_provider_service.get_selected_embedding_model()
        
        return SelectedModelsResponse(
            chat_provider=_convert_provider_to_response(chat_provider) if chat_provider else None,
            chat_model=_convert_model_to_response(chat_model) if chat_model else None,
            embedding_provider=_convert_provider_to_response(embedding_provider) if embedding_provider else None,
            embedding_model=_convert_model_to_response(embedding_model) if embedding_model else None
        )
        
    except Exception as e:
        logger.error(f"Error getting selected models: {e}")
        raise HTTPException(status_code=500, detail="Failed to get selected models")


@router.post("/selection", response_model=dict)
async def set_selected_models(request: ModelSelectionRequest):
    """Set the selected chat and embedding models."""
    try:
        # Set chat model
        chat_success = await model_provider_service.set_selected_chat_model(
            request.chat_provider_id, request.chat_model_id
        )
        
        # Set embedding model
        embedding_success = await model_provider_service.set_selected_embedding_model(
            request.embedding_provider_id, request.embedding_model_id
        )
        
        if not chat_success or not embedding_success:
            raise HTTPException(status_code=500, detail="Failed to update model selection")
        
        return {"message": "Model selection updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting selected models: {e}")
        raise HTTPException(status_code=500, detail="Failed to set selected models")


# Utility endpoints
@router.get("/types/models", response_model=List[str])
async def get_model_types():
    """Get available model types."""
    return ["chat", "embedding"]


@router.get("/types/providers", response_model=List[str])
async def get_provider_types():
    """Get available provider types."""
    return ["openai_compatible", "custom"]