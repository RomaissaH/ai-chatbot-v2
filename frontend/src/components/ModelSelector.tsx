/**
 * AI Model Selection Component
 * Dropdown component for selecting AI models in chat interface
 */
import { useState, useEffect } from 'react';
import { ChevronDownIcon, Bot } from 'lucide-react';
import { useAvailableModels } from '@/hooks/api/useChat';
import { useTranslation } from '@/hooks/useTranslation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type { AIModel } from '@/services/types';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
  className = '',
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: models = [], isLoading, error } = useAvailableModels();
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-model-selector]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const selectedModelData = models.find((m) => m.name === selectedModel);

  const handleModelSelect = (model: AIModel) => {
    onModelChange(model.name);
    setIsOpen(false);
  };

  if (error) {
    const errorMessage = getErrorMessage(error);
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <Bot className="w-4 h-4" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} data-model-selector>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border border-input 
          bg-background hover:bg-accent hover:text-accent-foreground
          transition-colors text-sm font-medium
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-ring ring-offset-2' : ''}
        `}
      >
        <Bot className="w-4 h-4" />

        {isLoading ? (
          <span>{t('models.loading_models')}</span>
        ) : selectedModelData ? (
          <>
            <span>{selectedModelData.display_name}</span>
            <span className="text-xs text-muted-foreground">
              ({selectedModelData.provider})
            </span>
          </>
        ) : (
          <span>{t('models.select_model')}</span>
        )}

        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50">
          <div className="p-1">
            {models.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {t('models.no_models')}
              </div>
            ) : (
              models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => handleModelSelect(model)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
                    hover:bg-accent hover:text-accent-foreground transition-colors
                    ${
                      selectedModel === model.name
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }
                  `}
                >
                  <Bot className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {model.display_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {model.provider}
                    </div>
                  </div>
                  {selectedModel === model.name && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelSelector;
