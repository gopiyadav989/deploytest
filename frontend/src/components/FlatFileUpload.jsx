import React, { useState, useRef } from 'react';
import { uploadFlatFile } from '../services/api';

const FlatFileUpload = ({ setFileConfig, setIsConnected, setError, setColumns, setResults }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is a CSV
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const response = await uploadFlatFile(file);
      
      // Reset columns first to trigger a fresh load
      setColumns([]);
      
      setUploadedFile({
        name: file.name,
        size: file.size,
        path: response.filePath
      });
      
      setFileConfig(prevConfig => ({
        ...prevConfig,
        filePath: response.filePath
      }));
      
      setIsConnected(true);
    } catch (error) {
      setError(`Failed to upload file: ${error}`);
      setIsConnected(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setIsConnected(false);
    setColumns([]);
    setFileConfig(prevConfig => ({
      ...prevConfig,
      filePath: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setResults(null);
  };

  return (
    <div className="mb-6">
      {!uploadedFile ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isUploading ? 'Uploading...' : 'Select CSV File'}
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Click to select a CSV file to upload
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-green-800">File Uploaded Successfully</h3>
              <p className="text-sm text-green-600 mt-1">
                {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              Change File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlatFileUpload; 