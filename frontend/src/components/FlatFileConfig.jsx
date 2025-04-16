import React from 'react';

const FlatFileConfig = ({ fileConfig, setFileConfig }) => {
  const handleDelimiterChange = (e) => {
    setFileConfig({
      ...fileConfig,
      delimiter: e.target.value
    });
  };

  return (
    <div className="mt-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delimiter
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="delimiter"
              value=","
              checked={fileConfig.delimiter === ','}
              onChange={handleDelimiterChange}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Comma (,)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="delimiter"
              value=";"
              checked={fileConfig.delimiter === ';'}
              onChange={handleDelimiterChange}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Semicolon (;)</span>
          </label>
          <div className="flex items-center">
            <span className="mr-2 text-gray-700">Other:</span>
            <input
              type="text"
              value={![',', ';', '\t'].includes(fileConfig.delimiter) ? fileConfig.delimiter : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setFileConfig({
                    ...fileConfig,
                    delimiter: e.target.value
                  });
                }
              }}
              className="w-12 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              maxLength="1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlatFileConfig;