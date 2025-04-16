import React, { useEffect } from 'react';
import { exportClickHouseToCsv, exportJoinedClickHouseToCsv, importFlatFileToClickHouse } from '../services/api';

const IngestionProgress = ({
    source,
    target,
    fileConfig,
    connectionConfig,
    selectedTables,
    selectedColumns,
    joinConditions,
    newTableName,
    createTable,
    progress,
    setProgress,
    processingStatus,
    setProcessingStatus,
    setResults,
    setIsProcessing,
    setError
}) => {
    useEffect(() => {
        const startIngestion = async () => {
            try {
                setError('');
                setProcessingStatus('Initializing ingestion process...');
                setProgress(10);

                if (source === 'clickhouse' && target === 'flatfile') {
                    // ClickHouse to Flat File
                    setProcessingStatus('Exporting data from ClickHouse to CSV...');
                    setProgress(30);

                    let response;

                    if (selectedTables.length === 1) {
                        // Single table export
                        response = await exportClickHouseToCsv(
                            connectionConfig,
                            selectedTables[0],
                            selectedColumns
                        );
                    } else {
                        // Multiple tables (JOIN) export
                        setProcessingStatus('Exporting joined data from ClickHouse to CSV...');

                        // Filter out empty join conditions
                        const validJoinConditions = joinConditions.filter(condition =>
                            condition && condition.trim() !== ''
                        );

                        response = await exportJoinedClickHouseToCsv(
                            connectionConfig,
                            selectedTables,
                            validJoinConditions,
                            selectedColumns
                        );
                    }

                    setProgress(90);
                    setProcessingStatus('Processing completed successfully!');

                    setResults({
                        success: true,
                        source: 'clickhouse',
                        target: 'flatfile',
                        count: response.count,
                        filePath: response.filePath,
                        message: response.message || `Successfully exported ${response.count} records to CSV`,
                        error: null
                    });
                } else if (source === 'flatfile' && target === 'clickhouse') {
                    // Flat File to ClickHouse
                    setProcessingStatus('Reading CSV data...');
                    setProgress(20);

                    setProcessingStatus('Preparing data for import to ClickHouse...');
                    setProgress(40);

                    setProcessingStatus('Importing data to ClickHouse...');
                    setProgress(60);

                    const response = await importFlatFileToClickHouse(
                        fileConfig.filePath,
                        fileConfig.delimiter,
                        connectionConfig,
                        newTableName,
                        selectedColumns,
                        createTable
                    );

                    setProgress(90);
                    setProcessingStatus('Processing completed successfully!');

                    setResults({
                        success: true,
                        source: 'flatfile',
                        target: 'clickhouse',
                        count: response.count,
                        tableName: newTableName,
                        message: response.message || `Successfully imported ${response.count} records to ClickHouse`
                    });
                }

                setProgress(100);
            } catch (error) {
                console.error('Ingestion error:', error);
                setError(`Ingestion failed: ${error}`);
                setProcessingStatus('Ingestion failed');

                setResults({
                    success: false,
                    source,
                    target,
                    error: `${error}`,
                    message: `Failed to process ingestion: ${error}`
                });
            } finally {
                setIsProcessing(false);
            }
        };

        startIngestion();
    }, []);

    return (
        <div>
            <div className="mb-4">
                <div className="flex justify-between text-sm font-medium">
                    <span>{processingStatus}</span>
                    <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="text-center mt-6">
                <div className="text-gray-500 text-sm">
                    {progress < 100
                        ? 'Please wait while the data is being processed...'
                        : 'Data processing complete!'}
                </div>
            </div>
        </div>
    );
};

export default IngestionProgress; 