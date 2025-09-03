import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit3, Trash2, Save, X, Eye, EyeOff, Lock, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useToast } from '../../contexts/ToastContext';
import { modelProviderService, ModelProvider, ProviderModel } from '../../services/modelProviderService';

interface ModelProviderManagerProps {}

export const ModelProviderManager: React.FC<ModelProviderManagerProps> = () => {
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [models, setModels] = useState<Record<string, ProviderModel[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(null);
  const [editingModel, setEditingModel] = useState<ProviderModel | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const { showToast } = useToast();

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      loadModels(selectedProvider);
    }
  }, [selectedProvider]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await modelProviderService.getProviders();
      setProviders(data);
      if (data.length > 0 && !selectedProvider) {
        setSelectedProvider(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
      showToast('Failed to load providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async (providerId: string) => {
    try {
      const data = await modelProviderService.getProviderModels(providerId);
      setModels(prev => ({ ...prev, [providerId]: data }));
    } catch (error) {
      console.error('Failed to load models:', error);
      showToast('Failed to load models', 'error');
    }
  };

  const handleProviderSave = async (provider: ModelProvider) => {
    try {
      if (provider.id) {
        await modelProviderService.updateProvider(provider.id, provider);
        showToast('Provider updated successfully', 'success');
      } else {
        await modelProviderService.createProvider(provider);
        showToast('Provider created successfully', 'success');
      }
      setEditingProvider(null);
      await loadProviders();
    } catch (error) {
      console.error('Failed to save provider:', error);
      showToast('Failed to save provider', 'error');
    }
  };

  const handleProviderDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider? All associated models will be deleted.')) {
      return;
    }
    
    try {
      await modelProviderService.deleteProvider(providerId);
      showToast('Provider deleted successfully', 'success');
      await loadProviders();
      if (selectedProvider === providerId) {
        setSelectedProvider(providers[0]?.id || '');
      }
    } catch (error) {
      console.error('Failed to delete provider:', error);
      showToast('Failed to delete provider', 'error');
    }
  };

  const handleModelSave = async (model: ProviderModel) => {
    try {
      if (model.id) {
        await modelProviderService.updateProviderModel(model.provider_id, model.id, model);
        showToast('Model updated successfully', 'success');
      } else {
        await modelProviderService.createProviderModel(model.provider_id, model);
        showToast('Model created successfully', 'success');
      }
      setEditingModel(null);
      await loadModels(model.provider_id);
    } catch (error) {
      console.error('Failed to save model:', error);
      showToast('Failed to save model', 'error');
    }
  };

  const handleModelDelete = async (providerId: string, modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) {
      return;
    }
    
    try {
      await modelProviderService.deleteProviderModel(providerId, modelId);
      showToast('Model deleted successfully', 'success');
      await loadModels(providerId);
    } catch (error) {
      console.error('Failed to delete model:', error);
      showToast('Failed to delete model', 'error');
    }
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);
  const selectedProviderModels = models[selectedProvider] || [];

  if (loading) {
    return (
      <Card accentColor="neutral" className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {providers.length} providers configured
          </span>
        </div>
        <Button
          variant="primary"
          onClick={() => setEditingProvider({
            id: '',
            name: '',
            display_name: '',
            base_url: '',
            api_key: '',
            requires_api_key: true,
            is_active: true,
            provider_type: 'openai_compatible',
            description: ''
          })}
          accentColor="neutral"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Providers List */}
      <Card accentColor="neutral" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-500 filter" />
            Providers
          </h3>
        </div>
        
        <div className="space-y-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selectedProvider === provider.id
                  ? 'border-border bg-muted'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedProvider(provider.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{provider.display_name}</h4>
                    {provider.requires_api_key && (
                      <Lock className={`w-4 h-4 ${provider.has_api_key ? 'text-green-500' : 'text-red-500'}`} />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={provider.base_url}>
                    {provider.base_url}
                  </p>
                  {provider.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate" title={provider.description}>
                      {provider.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProvider(provider);
                    }}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProviderDelete(provider.id);
                    }}
                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Models Section */}
      {selectedProvider && (
        <Card accentColor="neutral" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-green-500 filter" />
              Models {selectedProviderData && `- ${selectedProviderData.display_name}`}
            </h3>
            <Button
              variant="outline"
              onClick={() => setEditingModel({
                id: '',
                provider_id: selectedProvider,
                model_id: '',
                model_name: '',
                model_type: 'chat',
                is_default: false,
                is_active: true,
                max_tokens: null,
                description: ''
              })}
              accentColor="neutral"
              size="sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Model
            </Button>
          </div>

          <div className="space-y-3">
            {['chat', 'embedding'].map((type) => {
              const typeModels = selectedProviderModels.filter(m => m.model_type === type);
              if (typeModels.length === 0) return null;

              return (
                <div key={type} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {type} Models
                  </h4>
                  {typeModels.map((model) => (
                    <div key={model.id} className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.model_name}</span>
                            {model.is_default && (
                              <span className="px-2 py-0.5 text-xs rounded-full border border-border text-foreground/70">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{model.model_id}</p>
                          {model.max_tokens && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Max tokens: {model.max_tokens.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingModel(model)}
                            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleModelDelete(model.provider_id, model.id)}
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            
            {selectedProviderModels.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No models configured for this provider
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!selectedProvider && providers.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Select a provider above to view and manage models
        </div>
      )}

      {/* Provider Edit Modal */}
      {editingProvider && (
        <ProviderEditModal
          provider={editingProvider}
          onSave={handleProviderSave}
          onCancel={() => setEditingProvider(null)}
        />
      )}

      {/* Model Edit Modal */}
      {editingModel && (
        <ModelEditModal
          model={editingModel}
          onSave={handleModelSave}
          onCancel={() => setEditingModel(null)}
        />
      )}
    </div>
  );
};

interface ProviderEditModalProps {
  provider: ModelProvider;
  onSave: (provider: ModelProvider) => void;
  onCancel: () => void;
}

const ProviderEditModal: React.FC<ProviderEditModalProps> = ({ provider, onSave, onCancel }) => {
  const [formData, setFormData] = useState(provider);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4">
          {provider.id ? 'Edit Provider' : 'Add Provider'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Provider Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., openai, google, ollama"
            required
          />

          <Input
            label="Display Name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="e.g., OpenAI, Google Gemini"
            required
          />

          <Input
            label="Base URL"
            value={formData.base_url || ''}
            onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
            placeholder="e.g., https://api.openai.com/v1"
          />

          <div className="relative">
            <Input
              label="API Key"
              type={showApiKey ? 'text' : 'password'}
              value={formData.api_key || ''}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="Enter API key"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-8 text-gray-400"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Input
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provider description"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requires_api_key}
              onChange={(e) => setFormData({ ...formData, requires_api_key: e.target.checked })}
            />
            <span className="text-sm">Requires API Key</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <span className="text-sm">Active</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" accentColor="neutral" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

interface ModelEditModalProps {
  model: ProviderModel;
  onSave: (model: ProviderModel) => void;
  onCancel: () => void;
}

const ModelEditModal: React.FC<ModelEditModalProps> = ({ model, onSave, onCancel }) => {
  const [formData, setFormData] = useState(model);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4">
          {model.id ? 'Edit Model' : 'Add Model'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Model ID"
            value={formData.model_id}
            onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
            placeholder="e.g., gpt-4, text-embedding-3-small"
            required
          />

          <Input
            label="Model Name"
            value={formData.model_name}
            onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
            placeholder="e.g., GPT-4, Text Embedding 3 Small"
            required
          />

          <Select
            label="Model Type"
            value={formData.model_type}
            onChange={(e) => setFormData({ ...formData, model_type: e.target.value as 'chat' | 'embedding' })}
            options={[
              { value: 'chat', label: 'Chat Model' },
              { value: 'embedding', label: 'Embedding Model' }
            ]}
          />

          <Input
            label="Max Tokens"
            type="number"
            value={formData.max_tokens || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              max_tokens: e.target.value ? parseInt(e.target.value) : null 
            })}
            placeholder="e.g., 128000"
          />

          <Input
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Model description"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            />
            <span className="text-sm">Default model for this type</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <span className="text-sm">Active</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" accentColor="neutral" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
