-- =====================================================
-- Flexible Model Provider Configuration
-- =====================================================
-- This migration adds flexible model provider configuration
-- allowing users to configure multiple providers with custom
-- base URLs, API keys, and multiple models per provider
-- =====================================================

-- =====================================================
-- SECTION 1: MODEL PROVIDERS TABLE
-- =====================================================

-- Table to store model providers (OpenAI, Google, Ollama, custom providers)
CREATE TABLE IF NOT EXISTS archon_model_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'openai', 'google', 'ollama', 'custom-provider'
    display_name VARCHAR(100) NOT NULL, -- e.g., 'OpenAI', 'Google Gemini', 'Ollama'
    base_url TEXT, -- e.g., 'https://api.openai.com/v1', 'http://localhost:11434/v1'
    api_key_encrypted TEXT, -- Encrypted API key
    requires_api_key BOOLEAN DEFAULT true, -- Whether this provider requires an API key
    is_active BOOLEAN DEFAULT true, -- Whether this provider is available for selection
    provider_type VARCHAR(20) DEFAULT 'openai_compatible', -- 'openai_compatible', 'custom', etc.
    description TEXT, -- Optional description
    configuration JSONB DEFAULT '{}', -- Additional provider-specific configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 2: PROVIDER MODELS TABLE
-- =====================================================

-- Table to store models available from each provider
CREATE TABLE IF NOT EXISTS archon_provider_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES archon_model_providers(id) ON DELETE CASCADE,
    model_id VARCHAR(200) NOT NULL, -- e.g., 'gpt-4', 'text-embedding-3-small', 'gemini-pro'
    model_name VARCHAR(200) NOT NULL, -- Display name e.g., 'GPT-4', 'Text Embedding 3 Small'
    model_type VARCHAR(20) NOT NULL, -- 'chat', 'embedding'
    is_default BOOLEAN DEFAULT false, -- Whether this is the default model for this type
    is_active BOOLEAN DEFAULT true, -- Whether this model is available for selection
    max_tokens INTEGER, -- Maximum tokens supported by this model
    cost_per_token_input DECIMAL(10, 8), -- Cost per input token (optional)
    cost_per_token_output DECIMAL(10, 8), -- Cost per output token (optional)
    description TEXT, -- Optional description
    configuration JSONB DEFAULT '{}', -- Model-specific configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique model_id per provider
    UNIQUE(provider_id, model_id)
);

-- =====================================================
-- SECTION 3: INDEXES AND CONSTRAINTS
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_archon_model_providers_name ON archon_model_providers(name);
CREATE INDEX IF NOT EXISTS idx_archon_model_providers_active ON archon_model_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_archon_provider_models_provider_id ON archon_provider_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_archon_provider_models_type ON archon_provider_models(model_type);
CREATE INDEX IF NOT EXISTS idx_archon_provider_models_active ON archon_provider_models(is_active);

-- =====================================================
-- SECTION 4: TRIGGERS
-- =====================================================

-- Update trigger for providers
CREATE OR REPLACE TRIGGER update_archon_model_providers_updated_at
    BEFORE UPDATE ON archon_model_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for models
CREATE OR REPLACE TRIGGER update_archon_provider_models_updated_at
    BEFORE UPDATE ON archon_provider_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 5: RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE archon_model_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE archon_provider_models ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access)
CREATE POLICY "Allow service role full access to archon_model_providers" ON archon_model_providers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to archon_provider_models" ON archon_provider_models
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for authenticated users (read and update)
CREATE POLICY "Allow authenticated users to read and update archon_model_providers" ON archon_model_providers
    FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read and update archon_provider_models" ON archon_provider_models
    FOR ALL TO authenticated
    USING (true);

-- =====================================================
-- SECTION 6: DEFAULT DATA
-- =====================================================

-- Insert default providers
INSERT INTO archon_model_providers (name, display_name, base_url, requires_api_key, provider_type, description) VALUES
('openai', 'OpenAI', 'https://api.openai.com/v1', true, 'openai_compatible', 'Official OpenAI API service'),
('google', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta/openai/', true, 'openai_compatible', 'Google Gemini models via OpenAI-compatible API'),
('ollama', 'Ollama', 'http://localhost:11434/v1', false, 'openai_compatible', 'Local Ollama instance')
ON CONFLICT (name) DO NOTHING;

-- Insert default OpenAI models
INSERT INTO archon_provider_models (provider_id, model_id, model_name, model_type, is_default, max_tokens, description)
SELECT 
    p.id,
    model_data.model_id,
    model_data.model_name,
    model_data.model_type,
    model_data.is_default,
    model_data.max_tokens,
    model_data.description
FROM archon_model_providers p
CROSS JOIN (VALUES
    ('gpt-4', 'GPT-4', 'chat', true, 128000, 'Most capable GPT-4 model'),
    ('gpt-4-turbo', 'GPT-4 Turbo', 'chat', false, 128000, 'Fast and cost-effective GPT-4'),
    ('gpt-3.5-turbo', 'GPT-3.5 Turbo', 'chat', false, 16385, 'Fast and efficient model'),
    ('gpt-4.1-nano', 'GPT-4.1 Nano', 'chat', false, 8192, 'Ultra-fast and lightweight'),
    ('text-embedding-3-small', 'Text Embedding 3 Small', 'embedding', true, null, 'High-quality embeddings, cost-effective'),
    ('text-embedding-3-large', 'Text Embedding 3 Large', 'embedding', false, null, 'Highest quality embeddings'),
    ('text-embedding-ada-002', 'Ada 002 Embedding', 'embedding', false, null, 'Previous generation embedding model')
) AS model_data(model_id, model_name, model_type, is_default, max_tokens, description)
WHERE p.name = 'openai'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- Insert default Google models  
INSERT INTO archon_provider_models (provider_id, model_id, model_name, model_type, is_default, max_tokens, description)
SELECT 
    p.id,
    model_data.model_id,
    model_data.model_name,
    model_data.model_type,
    model_data.is_default,
    model_data.max_tokens,
    model_data.description
FROM archon_model_providers p
CROSS JOIN (VALUES
    ('gemini-1.5-flash', 'Gemini 1.5 Flash', 'chat', true, 1048576, 'Fast and efficient Gemini model'),
    ('gemini-1.5-pro', 'Gemini 1.5 Pro', 'chat', false, 2097152, 'Most capable Gemini model'),
    ('text-embedding-004', 'Text Embedding 004', 'embedding', true, null, 'Google text embeddings')
) AS model_data(model_id, model_name, model_type, is_default, max_tokens, description)
WHERE p.name = 'google'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- Insert default Ollama models
INSERT INTO archon_provider_models (provider_id, model_id, model_name, model_type, is_default, max_tokens, description)
SELECT 
    p.id,
    model_data.model_id,
    model_data.model_name,
    model_data.model_type,
    model_data.is_default,
    model_data.max_tokens,
    model_data.description
FROM archon_model_providers p
CROSS JOIN (VALUES
    ('llama3.2', 'Llama 3.2', 'chat', true, 128000, 'Latest Llama model'),
    ('llama3.1', 'Llama 3.1', 'chat', false, 128000, 'Previous Llama model'),
    ('qwen2.5', 'Qwen 2.5', 'chat', false, 128000, 'Qwen language model'),
    ('nomic-embed-text', 'Nomic Embed Text', 'embedding', true, null, 'High-quality text embeddings'),
    ('mxbai-embed-large', 'MxBAI Embed Large', 'embedding', false, null, 'Large embedding model')
) AS model_data(model_id, model_name, model_type, is_default, max_tokens, description)
WHERE p.name = 'ollama'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- =====================================================
-- SECTION 7: UPDATE EXISTING SETTINGS
-- =====================================================

-- Add new settings for selected models (these will replace the old LLM_PROVIDER, MODEL_CHOICE, EMBEDDING_MODEL)
INSERT INTO archon_settings (key, value, is_encrypted, category, description) VALUES
('SELECTED_CHAT_PROVIDER_ID', NULL, false, 'rag_strategy', 'UUID of the selected chat model provider'),
('SELECTED_CHAT_MODEL_ID', NULL, false, 'rag_strategy', 'Model ID of the selected chat model'),
('SELECTED_EMBEDDING_PROVIDER_ID', NULL, false, 'rag_strategy', 'UUID of the selected embedding model provider'),
('SELECTED_EMBEDDING_MODEL_ID', NULL, false, 'rag_strategy', 'Model ID of the selected embedding model')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE archon_model_providers IS 'Stores flexible model provider configurations with custom base URLs and API keys';
COMMENT ON TABLE archon_provider_models IS 'Stores available models for each provider (chat and embedding models)';