import React, { useCallback } from 'react';
import { Upload, X, FileIcon, ImageIcon, VideoIcon } from 'lucide-react';
import { FILE_VALIDATION, type FileValidationError } from '../../types/story';

interface FileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onErrorsChange?: (errors: FileValidationError[]) => void;
  storyType: 'photo' | 'video' | 'file';
  errors?: FileValidationError[];
  className?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  files,
  onFilesChange,
  onErrorsChange,
  storyType,
  errors = [],
  className = ''
}) => {
  const validation = FILE_VALIDATION[storyType];

  const validateFiles = (selectedFiles: FileList): { validFiles: File[], errors: FileValidationError[] } => {
    const validFiles: File[] = [];
    const fileErrors: FileValidationError[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const currentErrors: string[] = [];

      // Check file size
      if (file.size > validation.maxSize) {
        const maxSizeMB = validation.maxSize / (1024 * 1024);
        currentErrors.push(`File size must be less than ${maxSizeMB}MB`);
      }

      // Check file type
      if (!validation.allowedTypes.includes(file.type)) {
        currentErrors.push(`File type ${file.type} is not allowed`);
      }

      if (currentErrors.length > 0) {
        fileErrors.push({
          file: file.name,
          errors: currentErrors
        });
      } else {
        validFiles.push(file);
      }
    });

    return { validFiles, errors: fileErrors };
  };

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const { validFiles, errors: validationErrors } = validateFiles(selectedFiles);
    
    // Check total file count
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > validation.maxFiles) {
      validationErrors.push({
        file: 'Total',
        errors: [`Maximum ${validation.maxFiles} files allowed`]
      });
    }

    // Report errors to parent component
    if (validationErrors.length > 0) {
      onErrorsChange?.(validationErrors);
    } else {
      onErrorsChange?.([]);
    }

    // Only add valid files
    if (validFiles.length > 0 && totalFiles <= validation.maxFiles) {
      onFilesChange([...files, ...validFiles]);
    }
  }, [files, onFilesChange, onErrorsChange, validation.maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <VideoIcon className="h-5 w-5 text-red-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop files here, or{' '}
          <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
            browse
            <input
              type="file"
              multiple
              accept={validation.allowedTypes.join(',')}
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />
          </label>
        </p>
        <p className="text-xs text-gray-500">
          Maximum {validation.maxFiles} files, {formatFileSize(validation.maxSize)} each
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                {getFileIcon(file)}
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800">{error.file}:</p>
              <ul className="text-sm text-red-600 ml-4 list-disc">
                {error.errors.map((err, errIndex) => (
                  <li key={errIndex}>{err}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;