import { useState, useEffect } from 'react'
import SourceSelection from './components/SourceSelection'
import ClickHouseConnection from './components/ClickHouseConnection'
import FlatFileUpload from './components/FlatFileUpload'
import FlatFileConfig from './components/FlatFileConfig'
import TableSelection from './components/TableSelection'
import JoinConfiguration from './components/JoinConfiguration'
import ColumnSelection from './components/ColumnSelection'
import IngestionResults from './components/IngestionResults'
import DataPreview from './components/DataPreview'
import IngestionProgress from './components/IngestionProgress'
import TableCreation from './components/TableCreation'

import './App.css'

function App() {
    // Source selection state
    const [source, setSource] = useState('');
    const [target, setTarget] = useState('');

    // Connection state
    const [connectionConfig, setConnectionConfig] = useState({
        host: 'prb7zori4a.ap-south-1.aws.clickhouse.cloud',
        port: '8443',
        protocol: 'https',
        database: 'default',
        username: 'default',
        password: 'S.sXIGSxv.l4D',
        jwt: ''
    });
    const [isConnected, setIsConnected] = useState(false);

    // File state
    const [fileConfig, setFileConfig] = useState({
        filePath: '',
        delimiter: ','
    });

    // Table and column selection state
    const [tables, setTables] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
    const [columns, setColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [joinConditions, setJoinConditions] = useState(['']);

    // Table creation state (for flat file to ClickHouse)
    const [newTableName, setNewTableName] = useState('');
    const [createTable, setCreateTable] = useState(true);

    // Ingestion state
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);

    // Preview state
    const [previewData, setPreviewData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Error state
    const [error, setError] = useState('');

    // Active step for tracing workflow
    const [activeStep, setActiveStep] = useState(1);

    const resetState = () => {
        setIsConnected(false);
        setTables([]);
        setSelectedTables([]);
        setColumns([]);
        setSelectedColumns([]);
        setJoinConditions(['']);
        setNewTableName('');
        setCreateTable(true);
        setIsProcessing(false);
        setProcessingStatus('');
        setProgress(0);
        setResults(null);
        setPreviewData(null);
        setShowPreview(false);
        setError('');
    };

    const handleSourceChange = (newSource) => {
        resetState();
        setSource(newSource);

        // Set default target based on source
        if (newSource === 'clickhouse') {
            setTarget('flatfile');
        } else if (newSource === 'flatfile') {
            setTarget('clickhouse');
        }
    };

    // Update active step based on progress
    useEffect(() => {
        if (isConnected && !selectedTables.length && !columns.length) {
            setActiveStep(2);
        } else if ((selectedTables.length > 0 || (source === 'flatfile' && isConnected)) && !selectedColumns.length) {
            setActiveStep(3);
        } else if (selectedColumns.length > 0) {
            setActiveStep(4);
        }

        if (isProcessing) {
            setActiveStep(5);
        }
    }, [isConnected, selectedTables, selectedColumns, columns, isProcessing, source]);

    useEffect(() => {
        if (results?.success) {
            setError('');  // Clear top error bar when result is successful
            setActiveStep(5);
        }
    }, [results]);

    useEffect(() => {
        if (results) {
            setResults(null);
        }
    }, [columns, selectedTables, joinConditions, isConnected])

    useEffect(() => {
        if (columns) {
            setColumns([]);
        }
        if (selectedTables) {
            setSelectedTables([])
        }
    }, [isConnected])

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 shadow-lg">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold text-white text-center">
                        Clickbridge
                    </h1>
                    <p className="text-blue-100 text-center mt-2">
                    ClickHouse & Flat File Ingestion Tool
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl">

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm animate-fadeIn">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">
                                    {error}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <button
                                    onClick={() => setError('')}
                                    className="text-red-500 hover:text-red-700 focus:outline-none"
                                >
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Source Selection */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6 transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center mb-4">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                            1
                        </span>
                        <h2 className="text-xl font-semibold text-gray-800">Select Data Source</h2>
                    </div>
                    <SourceSelection
                        source={source}
                        onSourceChange={handleSourceChange}
                    />
                </div>

                {/* Source Configuration */}
                {source === 'clickhouse' && (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                2
                            </span>
                            <h2 className="text-xl font-semibold text-gray-800">ClickHouse Connection</h2>
                        </div>
                        <ClickHouseConnection
                            connectionConfig={connectionConfig}
                            setConnectionConfig={setConnectionConfig}
                            isConnected={isConnected}
                            setIsConnected={setIsConnected}
                            setError={setError}
                            setTables={setTables}
                        />
                    </div>
                )}
                {source === 'flatfile' && (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                2
                            </span>
                            <h2 className="text-xl font-semibold text-gray-800">Flat File Upload</h2>
                        </div>
                        <FlatFileUpload
                            setFileConfig={setFileConfig}
                            setIsConnected={setIsConnected}
                            setError={setError}
                            setColumns={setColumns}
                            setResults={setResults}
                        />
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center mb-3">
                                <h3 className="text-lg font-medium text-gray-700">File Configuration</h3>
                            </div>
                            <FlatFileConfig
                                fileConfig={fileConfig}
                                setFileConfig={setFileConfig}
                            />
                        </div>
                    </div>
                )}

                {/* Table Selection (for ClickHouse source) */}
                {source === 'clickhouse' && isConnected && (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                3
                            </span>
                            <h2 className="text-xl font-semibold text-gray-800">Select Tables</h2>
                        </div>
                        <TableSelection
                            tables={tables}
                            selectedTables={selectedTables}
                            setSelectedTables={setSelectedTables}
                            setError={setError}
                            connectionConfig={connectionConfig}
                            setColumns={setColumns}
                        />

                        {/* Join Configuration (for multiple tables) */}
                        {selectedTables.length > 1 && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex items-center mb-3">
                                    <h3 className="text-lg font-medium text-gray-700">Configure Table Joins</h3>
                                </div>
                                <JoinConfiguration
                                    selectedTables={selectedTables}
                                    joinConditions={joinConditions}
                                    setJoinConditions={setJoinConditions}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Column Selection */}
                {((source === 'clickhouse' && selectedTables.length > 0) ||
                    (source === 'flatfile' && isConnected )) && (
                        <div className="bg-white shadow-md rounded-lg p-6 mb-6 transition-all duration-300 hover:shadow-lg">
                            <div className="flex items-center mb-4">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                    {source === 'clickhouse' ? '4' : '3'}
                                </span>
                                <h2 className="text-xl font-semibold text-gray-800">Select Columns</h2>
                            </div>
                            <ColumnSelection
                                columns={columns}
                                selectedColumns={selectedColumns}
                                setSelectedColumns={setSelectedColumns}
                                source={source}
                                fileConfig={fileConfig}
                                connectionConfig={connectionConfig}
                                selectedTables={selectedTables}
                                setColumns={setColumns}
                                setError={setError}
                            />
                        </div>
                    )
                }

                {/* Table Creation (for flat file to ClickHouse) */}
                {source === 'flatfile' && target === 'clickhouse' && selectedColumns.length > 0 && (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                4
                            </span>
                            <h2 className="text-xl font-semibold text-gray-800">ClickHouse Target Configuration</h2>
                        </div>
                        <TableCreation
                            connectionConfig={connectionConfig}
                            setConnectionConfig={setConnectionConfig}
                            isConnected={isConnected}
                            setIsConnected={setIsConnected}
                            newTableName={newTableName}
                            setNewTableName={setNewTableName}
                            createTable={createTable}
                            setCreateTable={setCreateTable}
                            setError={setError}
                        />
                    </div>
                )}

                {/* Preview and Ingestion Controls */}
                {selectedColumns.length > 0 && (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                5
                            </span>
                            <h2 className="text-xl font-semibold text-gray-800">Actions</h2>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                className="flex items-center bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                                onClick={() => setShowPreview(true)}
                                disabled={isProcessing || selectedTables.length > 1}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                Preview Data
                            </button>

                            <button
                                className="flex items-center bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                                onClick={() => setIsProcessing(true)}
                                disabled={
                                    isProcessing ||
                                    (source === 'flatfile' && (!createTable || (!newTableName || newTableName.trim() === ''))) ||
                                    !selectedColumns.length ||
                                    !isConnected
                                }
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Start Ingestion
                            </button>
                        </div>
                    </div>
                )}

                {/* Data Preview Modal */}
                {showPreview && (
                    <DataPreview
                        source={source}
                        fileConfig={fileConfig}
                        connectionConfig={connectionConfig}
                        selectedTables={selectedTables}
                        selectedColumns={selectedColumns}
                        joinConditions={joinConditions}
                        previewData={previewData}
                        setPreviewData={setPreviewData}
                        setShowPreview={setShowPreview}
                        setError={setError}
                    />
                )}

                {/* Ingestion Progress */}
                {isProcessing && (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-fadeIn">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                6
                            </span>
                            <h2 className="text-xl font-semibold text-gray-800">Ingestion Progress</h2>
                        </div>
                        <IngestionProgress
                            source={source}
                            target={target}
                            fileConfig={fileConfig}
                            connectionConfig={connectionConfig}
                            selectedTables={selectedTables}
                            selectedColumns={selectedColumns}
                            joinConditions={joinConditions}
                            newTableName={newTableName}
                            createTable={createTable}
                            progress={progress}
                            setProgress={setProgress}
                            processingStatus={processingStatus}
                            setProcessingStatus={setProcessingStatus}
                            setResults={setResults}
                            setIsProcessing={setIsProcessing}
                            setError={setError}
                        />
                    </div>
                )}

                {/* Results */}
                {results && (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-fadeIn">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                6
                            </span>
                            <h2 className="text-xl font-semibold text-gray-800">Ingestion Results</h2>
                        </div>
                        <IngestionResults results={results} />

                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <button
                                onClick={resetState}
                                className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Start New Ingestion
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-gray-500 text-sm mt-12 mb-4">
                    @ClickBridge
                </div>
            </div>
        </div>
    )
}

export default App
