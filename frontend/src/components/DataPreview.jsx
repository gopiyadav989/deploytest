import React, { useState, useEffect } from 'react';
import { previewClickHouseData, previewFlatFileData } from '../services/api';

const DataPreview = ({ 
  source,
  fileConfig,
  connectionConfig,
  selectedTables,
  selectedColumns,
  joinConditions,
  previewData,
  setPreviewData,
  setShowPreview,
  setError
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Reset preview data when the component mounts to ensure fresh data
  useEffect(() => {
    setPreviewData(null);
  }, [setPreviewData]);

  // Load preview data
  useEffect(() => {
    const loadPreviewData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        if (source === 'clickhouse') {
          // For ClickHouse source
          if (selectedTables.length === 1) {
            // Single table preview
            const response = await previewClickHouseData(
              connectionConfig,
              selectedTables[0],
              selectedColumns,
              100
            );
            
            if (response.success) {
              setPreviewData(response.data);
            }
          } else if (selectedTables.length > 1) {
            // Multiple tables (JOIN) preview
            setError('Preview for joined tables is not available. Please export to CSV to see the joined data.');
            setIsLoading(false);
            return;
          } else {
            setError('No tables selected for preview.');
            setIsLoading(false);
            return;
          }
        } else if (source === 'flatfile') {
          // For flat file source
          if (!fileConfig.filePath) {
            setError('No file selected for preview.');
            setIsLoading(false);
            return;
          }

          const response = await previewFlatFileData(
            fileConfig.filePath,
            fileConfig.delimiter,
            100
          );
          
          if (response.success) {
            setPreviewData(response.data);
          }
        }
      } catch (error) {
        setError(`Failed to load preview data: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!previewData) {
      loadPreviewData();
    }
  }, [
    source, 
    fileConfig, 
    connectionConfig, 
    selectedTables, 
    selectedColumns, 
    joinConditions, 
    previewData, 
    setPreviewData, 
    setError
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Data Preview</h2>
          <button
            onClick={() => {
              setShowPreview(false);
              setPreviewData(null); // Clear preview data when closing
            }}
            className="text-gray-400 hover:text-gray-500"
          >
            &times;
          </button>
        </div>
        
        <div className="p-4 overflow-auto flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-blue-600">Loading preview data...</div>
            </div>
          ) : previewData && previewData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData[0])
                      .filter(key => selectedColumns.includes(key))
                      .map((key) => (
                        <th 
                          key={key}
                          className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.entries(row)
                        .filter(([key]) => selectedColumns.includes(key))
                        .map(([key, value]) => (
                          <td 
                            key={key}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {value === null || value === undefined ? (
                              <span className="text-gray-300 italic">null</span>
                            ) : (
                              String(value)
                            )}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No preview data available
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {previewData ? previewData.length : 0} records 
            {previewData && previewData.length === 100 && ' (limited to 100)'}
          </div>
          <button
            onClick={() => {
              setShowPreview(false);
              setPreviewData(null); // Clear preview data when closing
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPreview; 