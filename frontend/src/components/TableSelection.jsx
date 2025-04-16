import React, { useState, useEffect } from 'react';
import { getClickHouseColumns } from '../services/api';

const TableSelection = ({
    tables,
    selectedTables,
    setSelectedTables,
    setError,
    connectionConfig,
    setColumns
}) => {
    const [isLoading, setIsLoading] = useState(false);

    // Keep track of columns by table for proper cleanup
    const [tableColumnsMap, setTableColumnsMap] = useState({});

    // Update columns whenever selectedTables or tableColumnsMap changes
    useEffect(() => {
        // If no tables selected, clear columns
        if (selectedTables.length === 0) {
            setColumns([]);
            return;
        }

        // Build columns from all selected tables
        const allColumns = [];
        selectedTables.forEach(table => {
            if (tableColumnsMap[table]) {
                allColumns.push(...tableColumnsMap[table]);
            }
        });

        // Update columns
        setColumns(allColumns);
    }, [selectedTables, tableColumnsMap, setColumns]);

    const handleTableChange = async (e, table) => {
        try {
            const isChecked = e.target.checked;

            // Update selected tables
            let newSelectedTables;
            if (isChecked) {
                newSelectedTables = [...selectedTables, table];
                setSelectedTables(newSelectedTables);

                // If selecting a table, load its columns
                setIsLoading(true);
                setError('');

                const response = await getClickHouseColumns(connectionConfig, table);

                if (response.success) {
                    // Store columns for this table
                    const tableColumns = response.columns.map(col => ({
                        ...col,
                        originalTable: table,
                        name: `${table}.${col.name}`
                    }));

                    // Update the columns map
                    setTableColumnsMap(prevMap => ({
                        ...prevMap,
                        [table]: tableColumns
                    }));
                }
            } else {
                // If unselecting a table, just update the selected tables
                // The useEffect will handle updating the columns
                newSelectedTables = selectedTables.filter(t => t !== table);
                setSelectedTables(newSelectedTables);
            }
        } catch (error) {
            setError(`Failed to load table columns: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear columns when component unmounts or source changes
    useEffect(() => {
        return () => {
            setTableColumnsMap({});
            setColumns([]);
        };
    }, [setColumns]);

    return (
        <div>
            {isLoading && (
                <div className="text-sm text-blue-600 mb-2">
                    Loading table columns...
                </div>
            )}

            {tables.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {tables.map(table => (
                        <label key={table} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={selectedTables.includes(table)}
                                onChange={(e) => handleTableChange(e, table)}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2 truncate">{table}</span>
                        </label>
                    ))}
                </div>
            ) : (
                <div className="text-gray-500 text-sm italic">
                    No tables found in the selected database.
                </div>
            )}

            {selectedTables.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                    <span className="font-medium text-blue-700">Selected Tables:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTables.map(table => (
                            <span
                                key={table}
                                className="inline-flex items-center bg-white px-2 py-1 rounded-md text-sm text-gray-700 border border-gray-300"
                            >
                                {table}
                                <button
                                    type="button"
                                    onClick={() => handleTableChange({ target: { checked: false } }, table)}
                                    className="ml-1 text-gray-400 hover:text-gray-600"
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableSelection; 