import express from 'express';
import createClickHouseClient from "../utils/clickhouseClient.js";
import { writeToCsv } from "../utils/csvUtils.js";

const router = express.Router();


// Connect to ClickHouse and test connection
router.post('/connect', async (req, res) => {
  try {
    const { host, port, protocol, database, username, password, jwt } = req.body;

    const client = createClickHouseClient({
      host,
      port,
      protocol,
      database,
      username,
      password,
      jwt
    });

    // Test connection
    const result = await client.query({
      query: 'SELECT 1',
      format: 'JSONEachRow'
    });
    const rows = await result.json();

    if (rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Successfully connected to ClickHouse'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Connection failed'
      });
    }
  } catch (error) {
    console.error('ClickHouse connection error:', error);
    return res.status(500).json({
      success: false,
      message: `Connection failed: ${error.message}`
    });
  }
});

// Get list of tables from ClickHouse
router.post('/tables', async (req, res) => {
  try {
    const { host, port, protocol, database, username, password, jwt } = req.body;

    const client = createClickHouseClient({
      host,
      port,
      protocol,
      database,
      username,
      password,
      jwt
    });

    const query = `
        SELECT name
        FROM system.tables
        WHERE database = '${database}'
        ORDER BY name
      `;

    const result = await client.query({
      query,
      format: 'JSONEachRow'
    });

    const tables = await result.json();

    return res.status(200).json({
      success: true,
      tables: tables.map(table => table.name)
    });
  } catch (error) {
    console.error('Error getting tables:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to get tables: ${error.message}`
    });
  }
});


// Get columns for a specific table
router.post('/columns', async (req, res) => {
  try {
    const { host, port, protocol, database, username, password, jwt, table } = req.body;
    
    const client = createClickHouseClient({
      host,
      port,
      protocol,
      database,
      username,
      password,
      jwt
    });

    const query = `
      SELECT 
        name,
        type
      FROM system.columns
      WHERE database = '${database}' AND table = '${table}'
      ORDER BY position
    `;

    const result = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const columns = await result.json();
    
    return res.status(200).json({ 
      success: true, 
      columns
    });
  } catch (error) {
    console.error('Error getting columns:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to get columns: ${error.message}` 
    });
  }
});

// Execute query to fetch data from ClickHouse
router.post('/query', async (req, res) => {
  try {
    const { host, port, protocol, database, username, password, jwt, query } = req.body;
    
    const client = createClickHouseClient({
      host,
      port,
      protocol,
      database,
      username,
      password,
      jwt
    });

    const result = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const data = await result.json();
    
    return res.status(200).json({ 
      success: true, 
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error executing query:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to execute query: ${error.message}` 
    });
  }
});

// Export data from ClickHouse to CSV
router.post('/to-csv', async (req, res) => {
  try {
    const { 
      host, port, protocol, database, username, password, jwt,
      table, selectedColumns, limit
    } = req.body;
    
    // Build the query
    // Handle column names that may include table prefixes
    const processedColumns = selectedColumns.map(col => {
      // If the column already has a table prefix that matches our table, extract just the column name
      if (col.startsWith(`${table}.`)) {
        return col.split('.')[1];
      }
      // If it has another table prefix, extract just the column name
      if (col.includes('.')) {
        return col.split('.')[1];
      }
      // Otherwise use the column name as is
      return col;
    });
    
    const columnsString = processedColumns.join(', ');
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const query = `SELECT ${columnsString} FROM ${database}.${table} ${limitClause}`;
    
    console.log("Executing export query:", query);
    
    const client = createClickHouseClient({
      host,
      port,
      protocol,
      database,
      username,
      password,
      jwt
    });
    
    // Execute query
    const result = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const data = await result.json();
    
    // Transform data to match the expected format with table-prefixed column names
    const transformedData = data.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        // Use the original column name from selectedColumns that corresponds to this key
        const originalColumn = selectedColumns.find(col => {
          const colParts = col.split('.');
          return colParts.length > 1 ? colParts[1] === key : col === key;
        });
        
        newRow[originalColumn || `${table}.${key}`] = row[key];
      });
      return newRow;
    });
    
    // Write data to CSV
    const outputPath = await writeToCsv(transformedData, selectedColumns);
    
    // Return the CSV file path and record count
    return res.status(200).json({ 
      success: true, 
      filePath: outputPath.replace(/\\/g, '/'),
      count: data.length,
      message: `Successfully exported ${data.length} records to CSV`
    });
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to export data: ${error.message}` 
    });
  }
});

// Export data from joined ClickHouse tables to CSV
router.post('/join-to-csv', async (req, res) => {
  try {
    const { 
      host, port, protocol, database, username, password, jwt,
      tables, joinConditions, selectedColumns, limit
    } = req.body;
    
    // Validate we have tables to join
    if (!tables || tables.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `No tables provided for join operation` 
      });
    }

    // If only one table, redirect to the regular export
    if (tables.length === 1) {
      const modifiedBody = {
        ...req.body,
        table: tables[0]
      };
      req.body = modifiedBody;
      
      return router.handle(req, res, router.stack.find(layer => 
        layer.route && layer.route.path === '/to-csv'
      ).handle);
    }

    // Check if we have enough join conditions
    if (tables.length > 1 && (!joinConditions || joinConditions.length < tables.length - 1)) {
      return res.status(400).json({ 
        success: false, 
        message: `Not enough join conditions provided. Need ${tables.length - 1} but got ${joinConditions ? joinConditions.length : 0}` 
      });
    }
    
    // Process column names to remove table prefixes for the SQL query
    // but keep track of the original column names for the CSV headers
    const processedColumns = selectedColumns.map(col => {
      // For join queries, we need to keep the table prefix in the SQL
      // but we'll need to ensure the format is correct
      if (col.includes('.')) {
        const [tablePrefix, columnName] = col.split('.');
        // Check if the table prefix is one of our tables
        if (tables.includes(tablePrefix)) {
          return col; // Keep as is if it's a valid table.column format
        }
        // If not, assume it's just a column name
        return columnName;
      }
      // If no prefix, just use the column name
      return col;
    });
    
    // Build the JOIN query
    const columnsString = processedColumns.join(', ');
    const limitClause = limit ? `LIMIT ${limit}` : '';
    
    // Construct the JOIN part of the query
    // Assuming the first table is the main table and others are joined to it
    const mainTable = tables[0];
    let joinClause = `FROM ${database}.${mainTable}`;
    
    // Use ALL JOIN instead of regular JOIN to ensure we don't lose records
    for (let i = 1; i < tables.length; i++) {
      // Skip empty join conditions
      if (!joinConditions[i-1] || joinConditions[i-1].trim() === '') {
        continue;
      }
      joinClause += ` ALL JOIN ${database}.${tables[i]} ON ${joinConditions[i-1]}`;
    }
    
    const query = `SELECT ${columnsString} ${joinClause} ${limitClause}`;
    
    console.log("Executing join query:", query);
    
    const client = createClickHouseClient({
      host,
      port,
      protocol,
      database,
      username,
      password,
      jwt
    });
    
    // Execute query
    const result = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const data = await result.json();
    
    // For joined tables, the column names in the result might not match the 
    // original selectedColumns exactly. We need to ensure the CSV has the right headers.
    const transformedData = data.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        // Try to find the matching original column name
        const originalColumn = selectedColumns.find(col => {
          // If the key already has a table prefix
          if (key.includes('.')) {
            return col === key;
          }
          
          // If the key doesn't have a prefix but the column does
          if (col.includes('.')) {
            const colParts = col.split('.');
            return colParts[1] === key;
          }
          
          // Both don't have prefixes
          return col === key;
        });
        
        // Use the original column name if found, otherwise use the key as is
        newRow[originalColumn || key] = row[key];
      });
      return newRow;
    });
    
    // Write data to CSV
    const outputPath = await writeToCsv(transformedData, selectedColumns);
    
    // Return the CSV file path and record count
    return res.status(200).json({ 
      success: true, 
      filePath: outputPath.replace(/\\/g, '/'),
      count: data.length,
      message: `Successfully exported ${data.length} records to CSV with joined data`
    });
  } catch (error) {
    console.error('Error exporting joined data to CSV:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to export joined data: ${error.message}` 
    });
  }
});

// Preview data from ClickHouse
router.post('/preview', async (req, res) => {
  try {
    const { 
      host, port, protocol, database, username, password, jwt,
      table, selectedColumns, limit = 100
    } = req.body;
    
    // Build the query
    // Handle column names that may include table prefixes
    const columnsString = selectedColumns.map(col => {
      // If the column already has a table prefix that matches our table, use it as is
      if (col.startsWith(`${table}.`)) {
        return col;
      }
      // If it has another table prefix, extract just the column name
      if (col.includes('.')) {
        const parts = col.split('.');
        return parts[1];
      }
      // Otherwise use the column name as is
      return col;
    }).join(', ');
    
    const query = `SELECT ${columnsString} FROM ${database}.${table} LIMIT ${limit}`;
    
    console.log("Executing preview query:", query);
    
    const client = createClickHouseClient({
      host,
      port,
      protocol,
      database,
      username,
      password,
      jwt
    });
    
    // Execute query
    const result = await client.query({
      query,
      format: 'JSONEachRow'
    });
    
    const data = await result.json();
    
    // Map the results to include table prefixes in the column names for consistency
    const prefixedData = data.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        // Add table prefix to the column name
        newRow[`${table}.${key}`] = row[key];
      });
      return newRow;
    });
    
    // Return the preview data
    return res.status(200).json({ 
      success: true, 
      data: prefixedData,
      count: prefixedData.length
    });
  } catch (error) {
    console.error('Error previewing data:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to preview data: ${error.message}` 
    });
  }
});

export default router;