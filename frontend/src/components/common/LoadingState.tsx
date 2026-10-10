import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading Financial Data...",
  subtext = "Retrieving verified records and analytics"
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-primary-800 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-primary-800/10"></div>
        </div>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-text-main">{message}</h3>
      <p className="mt-1 text-xs text-text-secondary max-w-sm">{subtext}</p>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load data",
  message = "An error occurred while communicating with the server. Please check connection and try again.",
  onRetry
}) => {
  return (
    <div className="bank-card p-8 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-text-main">{title}</h3>
      <p className="mt-1 text-xs text-text-secondary leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-primary-800 hover:bg-primary-900 text-white text-xs font-medium transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Retry Request
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon
}) => {
  return (
    <div className="bank-card p-10 text-center">
      {icon && <div className="mx-auto w-12 h-12 flex items-center justify-center text-text-secondary mb-3">{icon}</div>}
      <h4 className="text-sm font-semibold text-text-main">{title}</h4>
      <p className="mt-1 text-xs text-text-secondary max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-lg bg-primary-800 hover:bg-primary-900 text-white text-xs font-medium transition shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
