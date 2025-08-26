/**
 * Model Provider Service
 * 
 * Service for managing flexible model providers and their models.
 * Provides CRUD operations for providers and models.
 */

export interface ModelProvider {
  id: string;
  name: string;
  display_name: string;
  base_url?: string;
  api_key?: string;
  has_api_key?: boolean;
  requires_api_key: boolean;
  is_active: boolean;
  provider_type: string;
  description?: string;
}

export interface ProviderModel {
  id: string;
  provider_id: string;
  model_id: string;
  model_name: string;
  model_type: 'chat' | 'embedding';
  is_default: boolean;
  is_active: boolean;
  max_tokens?: number;
  cost_per_token_input?: number;
  cost_per_token_output?: number;
  description?: string;
}

export interface SelectedModels {
  chat_provider?: ModelProvider;
  chat_model?: ProviderModel;
  embedding_provider?: ModelProvider;
  embedding_model?: ProviderModel;
}

export interface ModelSelectionRequest {
  chat_provider_id: string;
  chat_model_id: string;
  embedding_provider_id: string;
  embedding_model_id: string;
}

class ModelProviderService {
  private baseUrl = '/api/model-providers';

  // Provider management
  async getProviders(includeInactive = false): Promise<ModelProvider[]> {
    const params = includeInactive ? '?include_inactive=true' : '';
    const response = await fetch(`${this.baseUrl}/${params}`);
    if (!response.ok) {
      throw new Error('Failed to get providers');
    }
    return response.json();
  }

  async getProvider(providerId: string): Promise<ModelProvider> {
    const response = await fetch(`${this.baseUrl}/${providerId}`);
    if (!response.ok) {
      throw new Error('Failed to get provider');
    }
    return response.json();
  }

  async createProvider(provider: Omit<ModelProvider, 'id' | 'has_api_key'>): Promise<{ id: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(provider)
    });
    if (!response.ok) {
      throw new Error('Failed to create provider');
    }
    return response.json();
  }

  async updateProvider(providerId: string, provider: Omit<ModelProvider, 'id' | 'has_api_key'>): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${providerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(provider)
    });
    if (!response.ok) {
      throw new Error('Failed to update provider');
    }
    return response.json();
  }

  async deleteProvider(providerId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${providerId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete provider');
    }
    return response.json();
  }

  // Model management
  async getProviderModels(
    providerId: string,
    modelType?: 'chat' | 'embedding',
    includeInactive = false
  ): Promise<ProviderModel[]> {
    const params = new URLSearchParams();
    if (modelType) params.append('model_type', modelType);
    if (includeInactive) params.append('include_inactive', 'true');
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/${providerId}/models${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to get provider models');
    }
    return response.json();
  }

  async createProviderModel(
    providerId: string,
    model: Omit<ProviderModel, 'id' | 'provider_id'>
  ): Promise<{ id: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/${providerId}/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model)
    });
    if (!response.ok) {
      throw new Error('Failed to create model');
    }
    return response.json();
  }

  async updateProviderModel(
    providerId: string,
    modelId: string,
    model: Omit<ProviderModel, 'id' | 'provider_id'>
  ): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${providerId}/models/${modelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model)
    });
    if (!response.ok) {
      throw new Error('Failed to update model');
    }
    return response.json();
  }

  async deleteProviderModel(providerId: string, modelId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${providerId}/models/${modelId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete model');
    }
    return response.json();
  }

  // Model selection
  async getSelectedModels(): Promise<SelectedModels> {
    const response = await fetch(`${this.baseUrl}/selection/current`);
    if (!response.ok) {
      throw new Error('Failed to get selected models');
    }
    return response.json();
  }

  async setSelectedModels(selection: ModelSelectionRequest): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selection)
    });
    if (!response.ok) {
      throw new Error('Failed to set selected models');
    }
    return response.json();
  }

  // Utility methods
  async getModelTypes(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/types/models`);
    if (!response.ok) {
      throw new Error('Failed to get model types');
    }
    return response.json();
  }

  async getProviderTypes(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/types/providers`);
    if (!response.ok) {
      throw new Error('Failed to get provider types');
    }
    return response.json();
  }
}

export const modelProviderService = new ModelProviderService();