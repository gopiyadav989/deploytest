import axios from 'axios';

const API_URL = 'http://localhost:5001/api';


// ClickHouse API calls
export const connectToClickHouse = async (connectionConfig) => {
    try {
        const response = await axios.post(`${API_URL}/clickhouse/connect`, connectionConfig);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getClickHouseTables = async (connectionConfig) => {
    try {
        const response = await axios.post(`${API_URL}/clickhouse/tables`, connectionConfig);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getClickHouseColumns = async (connectionConfig, table) => {
    try {
        const response = await axios.post(`${API_URL}/clickhouse/columns`, {
            ...connectionConfig,
            table
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const previewClickHouseData = async (connectionConfig, table, selectedColumns, limit = 100) => {
    try {
        const response = await axios.post(`${API_URL}/clickhouse/preview`, {
            ...connectionConfig,
            table,
            selectedColumns,
            limit
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const exportClickHouseToCsv = async (connectionConfig, table, selectedColumns, limit = null) => {
    try {
        const response = await axios.post(`${API_URL}/clickhouse/to-csv`, {
            ...connectionConfig,
            table,
            selectedColumns,
            limit
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const exportJoinedClickHouseToCsv = async (connectionConfig, tables, joinConditions, selectedColumns, limit = null) => {
    try {
        const response = await axios.post(`${API_URL}/clickhouse/join-to-csv`, {
            ...connectionConfig,
            tables,
            joinConditions,
            selectedColumns,
            limit
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};


// Flat File API calls
export const uploadFlatFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/flatfile/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getFlatFileColumns = async (filePath, delimiter = ',') => {
    try {
        const response = await axios.post(`${API_URL}/flatfile/columns`, {
            filePath,
            delimiter
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const previewFlatFileData = async (filePath, delimiter = ',', limit = 100) => {
    try {
        const response = await axios.post(`${API_URL}/flatfile/preview`, {
            filePath,
            delimiter,
            limit
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const importFlatFileToClickHouse = async (
    filePath,
    delimiter,
    connectionConfig,
    tableName,
    selectedColumns,
    createTable
) => {
    try {
        const response = await axios.post(`${API_URL}/flatfile/to-clickhouse`, {
            filePath,
            delimiter,
            ...connectionConfig,
            tableName,
            selectedColumns,
            createTable
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
}