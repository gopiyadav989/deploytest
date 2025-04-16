import React from 'react';

const IngestionResults = ({ results }) => {
  if (!results) return null;

  return (
    <div className={`p-4 rounded-lg ${results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${results.success ? 'text-green-500' : 'text-red-500'}`}>
          {results.success ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={`text-lg font-medium ${results.success ? 'text-green-800' : 'text-red-800'}`}>
            {results.success ? 'Ingestion Completed Successfully' : 'Ingestion Failed'}
          </h3>
          
          <div className="mt-2 text-sm">
            <p className={results.success ? 'text-green-700' : 'text-red-700'}>
              {results.message}
            </p>
          </div>
          
          {results.success && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700">Summary:</div>
              <ul className="mt-1 list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>
                  <span className="font-medium">Source:</span> {' '}
                  {results.source === 'clickhouse' ? 'ClickHouse Database' : 'Flat File (CSV)'}
                </li>
                <li>
                  <span className="font-medium">Target:</span> {' '}
                  {results.target === 'clickhouse' ? 'ClickHouse Database' : 'Flat File (CSV)'}
                </li>
                <li>
                  <span className="font-medium">Records Processed:</span> {' '}
                  {results.count?.toLocaleString() || 'N/A'}
                </li>
                
                {results.target === 'flatfile' && results.filePath && (
                  <li>
                    <span className="font-medium">Output File:</span> {' '}
                    <span className="break-all">{results.filePath}</span>
                  </li>
                )}
                
                {results.target === 'clickhouse' && results.tableName && (
                  <li>
                    <span className="font-medium">Target Table:</span> {' '}
                    {results.tableName}
                  </li>
                )}
              </ul>
            </div>
          )}
          
          {!results.success && results.error && (
            <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-800 font-mono overflow-auto max-h-32">
              {results.error}
            </div>
          )}
        </div>
      </div>
      
      {results.success && results.target === 'flatfile' && results.filePath && (
        <div className="mt-4 text-center">
          <a 
            href={`http://localhost:5001/${results.filePath}`}
            download
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download CSV File
          </a>
        </div>
      )}
    </div>
  );
};

export default IngestionResults; 