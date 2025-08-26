import React, { useState, useEffect } from 'react';
import { Settings, Check, Save, Loader, ChevronDown, ChevronUp, Zap, Database, Cpu, Brain } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { credentialsService } from '../../services/credentialsService';
import { modelProviderService, ModelProvider, ProviderModel, SelectedModels } from '../../services/modelProviderService';

interface FlexibleRAGSettingsProps {
  ragSettings: {
    USE_CONTEXTUAL_EMBEDDINGS: boolean;
    CONTEXTUAL_EMBEDDINGS_MAX_WORKERS: number;
    USE_HYBRID_SEARCH: boolean;
    USE_AGENTIC_RAG: boolean;
    USE_RERANKING: boolean;
    // Legacy fields (still supported for backwards compatibility)
    MODEL_CHOICE?: string;
    LLM_PROVIDER?: string;
    LLM_BASE_URL?: string;
    EMBEDDING_MODEL?: string;
    // Performance settings
    CRAWL_BATCH_SIZE?: number;
    CRAWL_MAX_CONCURRENT?: number;
    CRAWL_WAIT_STRATEGY?: string;
    CRAWL_PAGE_TIMEOUT?: number;
    CRAWL_DELAY_BEFORE_HTML?: number;
    DOCUMENT_STORAGE_BATCH_SIZE?: number;
    EMBEDDING_BATCH_SIZE?: number;
    DELETE_BATCH_SIZE?: number;
    ENABLE_PARALLEL_BATCHES?: boolean;
    MEMORY_THRESHOLD_PERCENT?: number;
    DISPATCHER_CHECK_INTERVAL?: number;
    CODE_EXTRACTION_BATCH_SIZE?: number;
    CODE_SUMMARY_MAX_WORKERS?: number;
  };
  setRagSettings: (settings: any) => void;
}

export const FlexibleRAGSettings = ({
  ragSettings,
  setRagSettings
}: FlexibleRAGSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [chatModels, setChatModels] = useState<ProviderModel[]>([]);
  const [embeddingModels, setEmbeddingModels] = useState<ProviderModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<SelectedModels>({});
  const [selectedChatProvider, setSelectedChatProvider] = useState('');
  const [selectedEmbeddingProvider, setSelectedEmbeddingProvider] = useState('');
  const [selectedChatModel, setSelectedChatModel] = useState('');
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState('');
  const [showCrawlingSettings, setShowCrawlingSettings] = useState(false);
  const [showStorageSettings, setShowStorageSettings] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    loadProvidersAndModels();
  }, []);

  useEffect(() => {
    if (selectedChatProvider) {
      loadChatModels(selectedChatProvider);
    }
  }, [selectedChatProvider]);

  useEffect(() => {
    if (selectedEmbeddingProvider) {
      loadEmbeddingModels(selectedEmbeddingProvider);
    }
  }, [selectedEmbeddingProvider]);

  const loadProvidersAndModels = async () => {
    try {
      setLoading(true);
      
      // Load providers
      const providersData = await modelProviderService.getProviders();
      setProviders(providersData);
      
      // Load current selection
      const currentSelection = await modelProviderService.getSelectedModels();
      setSelectedModels(currentSelection);
      
      // Set selected providers and models
      if (currentSelection.chat_provider && currentSelection.chat_model) {
        setSelectedChatProvider(currentSelection.chat_provider.id);
        setSelectedChatModel(currentSelection.chat_model.model_id);
      } else if (providersData.length > 0) {
        setSelectedChatProvider(providersData[0].id);
      }
      
      if (currentSelection.embedding_provider && currentSelection.embedding_model) {
        setSelectedEmbeddingProvider(currentSelection.embedding_provider.id);
        setSelectedEmbeddingModel(currentSelection.embedding_model.model_id);
      } else if (providersData.length > 0) {
        setSelectedEmbeddingProvider(providersData[0].id);
      }
      
    } catch (error) {
      console.error('Failed to load providers and models:', error);
      showToast('Failed to load model configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadChatModels = async (providerId: string) => {
    try {
      const models = await modelProviderService.getProviderModels(providerId, 'chat');
      setChatModels(models);
      
      // Auto-select default or first model if none selected
      if (!selectedChatModel && models.length > 0) {
        const defaultModel = models.find(m => m.is_default) || models[0];
        setSelectedChatModel(defaultModel.model_id);
      }
    } catch (error) {
      console.error('Failed to load chat models:', error);
      showToast('Failed to load chat models', 'error');
    }
  };

  const loadEmbeddingModels = async (providerId: string) => {
    try {
      const models = await modelProviderService.getProviderModels(providerId, 'embedding');
      setEmbeddingModels(models);
      
      // Auto-select default or first model if none selected
      if (!selectedEmbeddingModel && models.length > 0) {
        const defaultModel = models.find(m => m.is_default) || models[0];
        setSelectedEmbeddingModel(defaultModel.model_id);
      }
    } catch (error) {
      console.error('Failed to load embedding models:', error);
      showToast('Failed to load embedding models', 'error');
    }
  };

  const handleSaveModelSelection = async () => {
    if (!selectedChatProvider || !selectedChatModel || !selectedEmbeddingProvider || !selectedEmbeddingModel) {
      showToast('Please select both chat and embedding models', 'error');
      return;
    }

    try {
      setSaving(true);
      
      await modelProviderService.setSelectedModels({
        chat_provider_id: selectedChatProvider,
        chat_model_id: selectedChatModel,
        embedding_provider_id: selectedEmbeddingProvider,
        embedding_model_id: selectedEmbeddingModel
      });
      
      // Also update RAG settings
      await credentialsService.updateRagSettings(ragSettings);
      
      showToast('Model selection and RAG settings saved successfully!', 'success');
      
      // Reload current selection to reflect changes
      await loadProvidersAndModels();
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card accentColor="green" className="overflow-hidden p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card accentColor="green" className="overflow-hidden p-8">
      <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
        Configure Retrieval-Augmented Generation (RAG) strategies and model selection for optimal knowledge retrieval.
      </p>
      
      {/* Model Selection Section */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-800 dark:text-white">Model Selection</h4>
        </div>
        
        {/* Chat Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Chat Model Provider
            </label>
            <Select
              value={selectedChatProvider}
              onChange={e => setSelectedChatProvider(e.target.value)}
              accentColor="green"
              options={providers.map(p => ({
                value: p.id,
                label: `${p.display_name}${p.requires_api_key && !p.has_api_key ? ' (API Key Required)' : ''}`
              }))}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Chat Model
            </label>
            <Select
              value={selectedChatModel}
              onChange={e => setSelectedChatModel(e.target.value)}
              accentColor="green"
              disabled={!selectedChatProvider || chatModels.length === 0}
              options={chatModels.map(m => ({
                value: m.model_id,
                label: `${m.model_name}${m.is_default ? ' (Default)' : ''}${m.max_tokens ? ` - ${m.max_tokens.toLocaleString()} tokens` : ''}`
              }))}
            />
          </div>
        </div>

        {/* Embedding Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Embedding Model Provider
            </label>
            <Select
              value={selectedEmbeddingProvider}
              onChange={e => setSelectedEmbeddingProvider(e.target.value)}
              accentColor="green"
              options={providers.map(p => ({
                value: p.id,
                label: `${p.display_name}${p.requires_api_key && !p.has_api_key ? ' (API Key Required)' : ''}`
              }))}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Embedding Model
            </label>
            <Select
              value={selectedEmbeddingModel}
              onChange={e => setSelectedEmbeddingModel(e.target.value)}
              accentColor="green"
              disabled={!selectedEmbeddingProvider || embeddingModels.length === 0}
              options={embeddingModels.map(m => ({
                value: m.model_id,
                label: `${m.model_name}${m.is_default ? ' (Default)' : ''}`
              }))}
            />
          </div>
        </div>

        {/* Current Selection Display */}
        {selectedModels.chat_provider && selectedModels.embedding_provider && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Current Active Models</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Chat:</span> {selectedModels.chat_provider.display_name} - {selectedModels.chat_model?.model_name}
              </div>
              <div>
                <span className="font-medium">Embedding:</span> {selectedModels.embedding_provider.display_name} - {selectedModels.embedding_model?.model_name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RAG Strategy Settings */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-800 dark:text-white">RAG Strategy</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={ragSettings.USE_CONTEXTUAL_EMBEDDINGS}
              onChange={e => setRagSettings({
                ...ragSettings,
                USE_CONTEXTUAL_EMBEDDINGS: e.target.checked
              })}
              className="w-4 h-4 text-green-600 rounded"
            />
            <div>
              <div className="font-medium">Contextual Embeddings</div>
              <div className="text-xs text-gray-500">Enhance retrieval context</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={ragSettings.USE_HYBRID_SEARCH}
              onChange={e => setRagSettings({
                ...ragSettings,
                USE_HYBRID_SEARCH: e.target.checked
              })}
              className="w-4 h-4 text-green-600 rounded"
            />
            <div>
              <div className="font-medium">Hybrid Search</div>
              <div className="text-xs text-gray-500">Combine semantic + keyword</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={ragSettings.USE_AGENTIC_RAG}
              onChange={e => setRagSettings({
                ...ragSettings,
                USE_AGENTIC_RAG: e.target.checked
              })}
              className="w-4 h-4 text-green-600 rounded"
            />
            <div>
              <div className="font-medium">Agentic RAG</div>
              <div className="text-xs text-gray-500">AI-powered retrieval</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={ragSettings.USE_RERANKING}
              onChange={e => setRagSettings({
                ...ragSettings,
                USE_RERANKING: e.target.checked
              })}
              className="w-4 h-4 text-green-600 rounded"
            />
            <div>
              <div className="font-medium">Reranking</div>
              <div className="text-xs text-gray-500">Optimize result order</div>
            </div>
          </label>
        </div>

        {ragSettings.USE_CONTEXTUAL_EMBEDDINGS && (
          <div className="mt-4">
            <Input
              label="Contextual Embeddings Workers"
              type="number"
              value={ragSettings.CONTEXTUAL_EMBEDDINGS_MAX_WORKERS}
              onChange={e => setRagSettings({
                ...ragSettings,
                CONTEXTUAL_EMBEDDINGS_MAX_WORKERS: parseInt(e.target.value) || 3
              })}
              min={1}
              max={10}
              accentColor="green"
            />
          </div>
        )}
      </div>

      {/* Performance Settings (Collapsible) */}
      <div className="space-y-4">
        {/* Crawling Settings */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => setShowCrawlingSettings(!showCrawlingSettings)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="font-medium">Crawling Performance</span>
            </div>
            {showCrawlingSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showCrawlingSettings && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Crawl Batch Size"
                  type="number"
                  value={ragSettings.CRAWL_BATCH_SIZE || 5}
                  onChange={e => setRagSettings({
                    ...ragSettings,
                    CRAWL_BATCH_SIZE: parseInt(e.target.value) || 5
                  })}
                  accentColor="green"
                />
                <Input
                  label="Max Concurrent Crawls"
                  type="number"
                  value={ragSettings.CRAWL_MAX_CONCURRENT || 3}
                  onChange={e => setRagSettings({
                    ...ragSettings,
                    CRAWL_MAX_CONCURRENT: parseInt(e.target.value) || 3
                  })}
                  accentColor="green"
                />
                <Input
                  label="Page Timeout (ms)"
                  type="number"
                  value={ragSettings.CRAWL_PAGE_TIMEOUT || 30000}
                  onChange={e => setRagSettings({
                    ...ragSettings,
                    CRAWL_PAGE_TIMEOUT: parseInt(e.target.value) || 30000
                  })}
                  accentColor="green"
                />
                <Input
                  label="HTML Delay (ms)"
                  type="number"
                  value={ragSettings.CRAWL_DELAY_BEFORE_HTML || 2000}
                  onChange={e => setRagSettings({
                    ...ragSettings,
                    CRAWL_DELAY_BEFORE_HTML: parseInt(e.target.value) || 2000
                  })}
                  accentColor="green"
                />
              </div>
            </div>
          )}
        </div>

        {/* Storage Settings */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => setShowStorageSettings(!showStorageSettings)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="font-medium">Storage Performance</span>
            </div>
            {showStorageSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showStorageSettings && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Document Batch Size"
                  type="number"
                  value={ragSettings.DOCUMENT_STORAGE_BATCH_SIZE || 10}
                  onChange={e => setRagSettings({
                    ...ragSettings,
                    DOCUMENT_STORAGE_BATCH_SIZE: parseInt(e.target.value) || 10
                  })}
                  accentColor="green"
                />
                <Input
                  label="Embedding Batch Size"
                  type="number"
                  value={ragSettings.EMBEDDING_BATCH_SIZE || 20}
                  onChange={e => setRagSettings({
                    ...ragSettings,
                    EMBEDDING_BATCH_SIZE: parseInt(e.target.value) || 20
                  })}
                  accentColor="green"
                />
                <Input
                  label="Memory Threshold %"
                  type="number"
                  value={ragSettings.MEMORY_THRESHOLD_PERCENT || 80}
                  onChange={e => setRagSettings({
                    ...ragSettings,
                    MEMORY_THRESHOLD_PERCENT: parseInt(e.target.value) || 80
                  })}
                  min={50}
                  max={95}
                  accentColor="green"
                />
              </div>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={ragSettings.ENABLE_PARALLEL_BATCHES || false}
                  onChange={e => setRagSettings({
                    ...ragSettings,
                    ENABLE_PARALLEL_BATCHES: e.target.checked
                  })}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm">Enable Parallel Batch Processing</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          onClick={handleSaveModelSelection}
          accentColor="green"
          disabled={saving || !selectedChatProvider || !selectedChatModel || !selectedEmbeddingProvider || !selectedEmbeddingModel}
          className="shadow-emerald-500/20 shadow-sm"
        >
          {saving ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};