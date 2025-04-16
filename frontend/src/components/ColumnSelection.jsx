import React, { useState, useEffect } from 'react';
import { getFlatFileColumns } from '../services/api';

const ColumnSelection = ({
    columns,
    selectedColumns,
    setSelectedColumns,
    source,
    fileConfig,
    connectionConfig,
    selectedTables,
    setColumns,
    setError
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectAll, setSelectAll] = useState(false);

    // Load flat file columns when needed
    useEffect(() => {
        const loadFlatFileColumns = async () => {
            if (source === 'flatfile' && fileConfig.filePath) {
                try {
                    setIsLoading(true);
                    setError('');

                    const response = await getFlatFileColumns(fileConfig.filePath, fileConfig.delimiter);

                    if (response.success) {
                        setColumns(response.columns);
                    }
                } catch (error) {
                    console.error('Error loading CSV columns:', error);
                    setError(`Failed to load CSV columns: ${error}`);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadFlatFileColumns();
    }, [source, fileConfig.filePath, fileConfig.delimiter, setColumns, setError]);

    // Handle the select all toggle
    useEffect(() => {
        if (selectAll) {
            setSelectedColumns(columns.map(col => col.name));
        } else if (selectedColumns.length === columns.length && columns.length > 0) {
            // This handles the case when all are selected but not by using "Select All"
            setSelectAll(true);
        }
    }, [selectAll, columns, setSelectedColumns]);

    // Update selected columns when columns change
    useEffect(() => {
        // If columns have changed, filter selected columns to only include those that still exist
        if (columns.length > 0) {
            const columnNames = columns.map(col => col.name);
            const validSelectedColumns = selectedColumns.filter(col => columnNames.includes(col));

            // Only update if there's a difference to avoid infinite loops
            if (validSelectedColumns.length !== selectedColumns.length) {
                setSelectedColumns(validSelectedColumns);
                if (selectAll && validSelectedColumns.length !== columns.length) {
                    setSelectAll(false);
                }
            }
        }
    }, [columns, selectedColumns, setSelectedColumns, selectAll, setSelectAll]);

    const handleColumnChange = (e, columnName) => {
        const isChecked = e.target.checked;

        if (isChecked) {
            setSelectedColumns([...selectedColumns, columnName]);
        } else {
            setSelectedColumns(selectedColumns.filter(col => col !== columnName));
            if (selectAll) setSelectAll(false);
        }
    };

    const handleSelectAllChange = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);

        if (isChecked) {
            setSelectedColumns(columns.map(col => col.name));
        } else {
            setSelectedColumns([]);
        }
    };

    // Filter columns based on search term
    const filteredColumns = searchTerm
        ? columns.filter(col => col.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : columns;

    return (
        <div>
            {isLoading ? (
                <div className="text-sm text-blue-600 mb-2">
                    Loading columns...
                </div>
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={handleSelectAllChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">Select All Columns</span>
                        </label>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search columns..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {filteredColumns.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                            {filteredColumns.map(column => (
                                <label key={column.name} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={selectedColumns.includes(column.name)}
                                        onChange={(e) => handleColumnChange(e, column.name)}
                                        className="form-checkbox h-5 w-5 text-blue-600"
                                    />
                                    <div className="ml-2 truncate">
                                        <div className="text-sm font-medium text-gray-700 truncate">{column.name}</div>
                                        <div className="text-xs text-gray-500">{column.type || 'String'}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-sm italic">
                            {searchTerm ? 'No columns match your search' : 'No columns available'}
                        </div>
                    )}

                    {selectedColumns.length > 0 && (
                        <div className="mt-4">
                            <div className="font-medium text-gray-700 mb-2">Selected Columns: {selectedColumns.length}</div>
                            <div className="flex flex-wrap gap-2">
                                {selectedColumns.map(col => (
                                    <span
                                        key={col}
                                        className="inline-flex items-center bg-blue-50 px-2 py-1 rounded-md text-sm text-blue-800"
                                    >
                                        {col}
                                        <button
                                            type="button"
                                            onClick={() => handleColumnChange({ target: { checked: false } }, col)}
                                            className="ml-1 text-blue-400 hover:text-blue-600"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ColumnSelection; 