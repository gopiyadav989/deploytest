import React, { useState } from 'react';
import { connectToClickHouse } from '../services/api';

const TableCreation = ({
    connectionConfig,
    setConnectionConfig,
    isConnected,
    setIsConnected,
    newTableName,
    setNewTableName,
    createTable,
    setCreateTable,
    setError
}) => {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleTableNameChange = (e) => {
        setNewTableName(e.target.value);
    };

    const handleCreateTableChange = (e) => {
        setCreateTable(e.target.checked);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setConnectionConfig({
            ...connectionConfig,
            [name]: value
        });
    };

    const handleConnectClick = async () => {
        try {
            setIsConnecting(true);
            setError('');

            // Test connection to ClickHouse
            await connectToClickHouse(connectionConfig);

            setIsConnected(true);
            setError('');
        } catch (error) {
            console.error('Connection error:', error);
            setError(`Failed to connect: ${error}`);
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={createTable}
                        onChange={handleCreateTableChange}
                        className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Create a new table in ClickHouse</span>
                </label>
            </div>

            {createTable && (
                <>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Table Name
                        </label>
                        <input
                            type="text"
                            value={newTableName}
                            onChange={handleTableNameChange}
                            placeholder="Enter table name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                            <input
                                type="text"
                                name="host"
                                value={connectionConfig.host}
                                onChange={handleInputChange}
                                disabled={isConnected}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., play.clickhouse.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                            <input
                                type="text"
                                name="port"
                                value={connectionConfig.port}
                                onChange={handleInputChange}
                                disabled={isConnected}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., 443"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Protocol</label>
                            <select
                                name="protocol"
                                value={connectionConfig.protocol}
                                onChange={handleInputChange}
                                disabled={isConnected}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="https">HTTPS</option>
                                <option value="http">HTTP</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                            <input
                                type="text"
                                name="database"
                                value={connectionConfig.database}
                                onChange={handleInputChange}
                                disabled={isConnected}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., default"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={connectionConfig.username}
                                onChange={handleInputChange}
                                disabled={isConnected}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., explorer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={connectionConfig.password}
                                onChange={handleInputChange}
                                disabled={isConnected}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">JWT Token (Optional)</label>
                        <textarea
                            name="jwt"
                            value={connectionConfig.jwt}
                            onChange={handleInputChange}
                            disabled={isConnected}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter JWT token for authentication"
                        />
                    </div>

                    <div className="flex justify-end">
                        {!isConnected ? (
                            <button
                                onClick={handleConnectClick}
                                disabled={isConnecting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {isConnecting ? 'Connecting...' : 'Connect to ClickHouse'}
                            </button>
                        ) : (
                            <div className="flex items-center">
                                <span className="flex items-center mr-3">
                                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                    <span className="text-green-600 font-medium">Connected</span>
                                </span>
                                <button
                                    onClick={() => setIsConnected(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                    Disconnect
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TableCreation;