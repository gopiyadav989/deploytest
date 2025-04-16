import React, { useEffect } from 'react';

const JoinConfiguration = ({ selectedTables, joinConditions, setJoinConditions }) => {
    // Generate examples based on the actual table names
    const generateExample = (index) => {
        if (selectedTables.length < index + 2) return '';
        const firstTable = selectedTables[0];
        const secondTable = selectedTables[index + 1];
        return `${firstTable}.id = ${secondTable}.id`;
    };

    // Ensure we have the correct number of join conditions initialized
    useEffect(() => {
        // When we have exactly two tables but no join conditions
        if (selectedTables.length === 2 && (!joinConditions || joinConditions.length === 0)) {
            setJoinConditions(['']);
        }

        // If tables are removed, trim the join conditions array accordingly
        if (joinConditions && joinConditions.length > selectedTables.length - 1) {
            setJoinConditions(joinConditions.slice(0, selectedTables.length - 1));
        }
    }, [selectedTables, joinConditions, setJoinConditions]);

    const handleJoinConditionChange = (index, value) => {
        const newJoinConditions = [...joinConditions];
        newJoinConditions[index] = value;
        setJoinConditions(newJoinConditions);
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
                Specify the join conditions to connect the tables. For each pair of tables, provide a condition in the format:
                <code className="bg-gray-100 px-2 py-1 rounded ml-1">table1.column = table2.column</code>
            </p>

            {selectedTables.length > 1 && (
                <div className="space-y-3">
                    {selectedTables.slice(1).map((table, index) => (
                        <div key={index} className="flex flex-col">
                            <label className="mb-1 text-sm font-medium text-gray-700">
                                Join condition for {selectedTables[0]} and {table}:
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    value={joinConditions[index] || ''}
                                    onChange={(e) => handleJoinConditionChange(index, e.target.value)}
                                    placeholder={`e.g., ${generateExample(index)}`}
                                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                    <span className="font-semibold">Important:</span> Make sure to qualify column names with table names if they appear in multiple tables.
                </p>
            </div>
        </div>
    );
};

export default JoinConfiguration; 