import React from 'react';

const SourceSelection = ({ source, onSourceChange }) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-4 mb-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="source"
            value="clickhouse"
            checked={source === 'clickhouse'}
            onChange={() => onSourceChange('clickhouse')}
            className="form-radio h-5 w-5 text-blue-600"
          />
          <span className="ml-2 text-gray-700">ClickHouse</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="source"
            value="flatfile"
            checked={source === 'flatfile'}
            onChange={() => onSourceChange('flatfile')}
            className="form-radio h-5 w-5 text-blue-600"
          />
          <span className="ml-2 text-gray-700">Flat File (CSV)</span>
        </label>
      </div>
      
      {source === 'clickhouse' && (
        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <p className="text-sm text-blue-800">
            <strong>Selected flow:</strong> ClickHouse → Flat File (CSV)
          </p>
        </div>
      )}
      
      {source === 'flatfile' && (
        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <p className="text-sm text-blue-800">
            <strong>Selected flow:</strong> Flat File (CSV) → ClickHouse
          </p>
        </div>
      )}
    </div>
  );
};

export default SourceSelection; 