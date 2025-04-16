import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getCsvHeaders, readCsv, inferCsvColumnTypes } from '../utils/csvUtils.js';
import createClickHouseClient from '../utils/clickhouseClient.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });


// Upload a CSV file
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    return res.status(200).json({
      success: true,
      filePath: req.file.path.replace(/\\/g, '/'),
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      success: false,
      message: `File upload failed: ${error.message}`
    });
  }
});

// Get columns from a CSV file
router.post('/columns', async (req, res) => {
  try {
    const { filePath, delimiter = ',' } = req.body;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get headers (column names) from the CSV
    const headers = await getCsvHeaders(filePath, delimiter);

    return res.status(200).json({
      success: true,
      columns: headers.map(header => ({ name: header, type: 'String' }))
    });
  } catch (error) {
    console.error('Error getting CSV columns:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to get columns: ${error.message}`
    });
  }
});

// Preview data from a CSV file
router.post('/preview', async (req, res) => {
  try {
    const { filePath, delimiter = ',', limit = 100 } = req.body;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Read the CSV file
    const data = await readCsv(filePath, delimiter);

    // Return a preview of the data (limited rows)
    return res.status(200).json({
      success: true,
      data: data.slice(0, limit),
      count: Math.min(data.length, limit)
    });
  } catch (error) {
    console.error('Error previewing CSV data:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to preview data: ${error.message}`
    });
  }
});

// Import CSV to ClickHouse
router.post('/to-clickhouse', async (req, res) => {
  try {
    const {
      filePath, delimiter = ',',
      host, port, protocol, database, username, password, jwt,
      tableName, selectedColumns, createTable = false
    } = req.body;

    console.log("Received import request:", {
      filePath,
      delimiter,
      host, port, protocol, database,
      tableName,
      selectedColumnsCount: selectedColumns.length,
      createTable
    });

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Create ClickHouse client
    const client = createClickHouseClient({
      host,
      port,
      protocol,
      database,
      username,
      password,
      jwt
    });

    // Try to ping the server to verify connection
    try {
      await client.ping();
      console.log("ClickHouse connection successful");
    } catch (pingError) {
      console.error("ClickHouse connection failed:", pingError);
      return res.status(500).json({
        success: false,
        message: `Failed to connect to ClickHouse: ${pingError.message}`
      });
    }

    // Read the CSV file
    const data = await readCsv(filePath, delimiter);
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty'
      });
    }

    console.log(`Read ${data.length} rows from CSV file`);

    // Skip table creation if it already exists
    let tableExists = false;
    try {
      // Check if table exists
      const tablesResult = await client.query({
        query: `SHOW TABLES LIKE '${tableName}'`,
        format: 'JSONEachRow'
      });

      const tables = await tablesResult.json();
      tableExists = tables.length > 0;
      console.log(`Table ${tableName} exists: ${tableExists}`);
    } catch (error) {
      console.log("Error checking if table exists:", error);
      // Continue anyway, will attempt to create table if requested
    }

    // Create new table if requested and doesn't exist
    if (createTable && !tableExists) {
      const headers = await getCsvHeaders(filePath, delimiter);

      // Filter headers based on selectedColumns
      const columnsToUse = headers.filter(header => selectedColumns.includes(header));

      // Infer types from the CSV data
      const dataSample = data.slice(0, 20); // Use first 20 rows for type inference
      const inferredTypes = inferCsvColumnTypes(dataSample);

      try {
        // Step 1: Create a table structure with inferred types
        const columnDefinitions = columnsToUse.map(col => {
          // Convert all column names to simple alphanumeric identifiers
          const safeCol = col.replace(/[^a-zA-Z0-9]/g, '_');
          // Use inferred type if available, otherwise default to String
          const type = inferredTypes[col] || 'String';
          return `\`${safeCol}\` ${type}`;
        }).join(', ');

        const createTableQuery = `CREATE TABLE ${database}.${tableName} (${columnDefinitions}) ENGINE = MergeTree() ORDER BY tuple()`;
        console.log('Creating table with query:', createTableQuery);
        await client.command({ query: createTableQuery });
        console.log('Table created successfully');

        // Build a mapping from original column names to sanitized versions
        const columnMapping = {};
        columnsToUse.forEach(col => {
          columnMapping[col] = col.replace(/[^a-zA-Z0-9]/g, '_');
        });

        // Replace selected columns with safe versions
        for (let i = 0; i < selectedColumns.length; i++) {
          const originalName = selectedColumns[i];
          selectedColumns[i] = columnMapping[originalName] || originalName;
        }
      } catch (tableError) {
        console.error('Error creating table:', tableError);
        return res.status(500).json({
          success: false,
          message: `Failed to create table: ${tableError.message}`
        });
      }
    }

    // Filter data to only include selected columns with proper mapping
    const filteredData = data.map(row => {
      const filteredRow = {};

      // Build a mapping from sanitized names back to original names
      const reverseMapping = {};
      if (createTable) {
        Object.keys(row).forEach(originalCol => {
          const sanitizedCol = originalCol.replace(/[^a-zA-Z0-9]/g, '_');
          reverseMapping[sanitizedCol] = originalCol;
        });
      }

      // Process each selected column (which may now be sanitized)
      selectedColumns.forEach(col => {
        if (createTable && reverseMapping[col]) {
          // This is a sanitized column name, get data from original column
          filteredRow[col] = row[reverseMapping[col]];
        } else {
          // Either we didn't create a table or this column wasn't sanitized
          filteredRow[col] = row[col];
        }
      });

      return filteredRow;
    });

    // Upload data in smaller batches to avoid query length issues
    const batchSize = 10; // Use extremely small batches for more reliable insertion
    let totalImported = 0;

    try {
      // Only show first record for debugging
      console.log("Sample record to insert:", JSON.stringify(filteredData[0]));

      for (let i = 0; i < filteredData.length; i += batchSize) {
        const batch = filteredData.slice(i, i + batchSize);

        console.log(`Inserting batch ${i / batchSize + 1} of ${Math.ceil(filteredData.length / batchSize)}, size: ${batch.length}`);

        try {
          // Get the columns
          const columns = Object.keys(batch[0]);

          // Simplest possible approach: one row at a time, using client.insert
          for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
            // Make a copy of the row to avoid modifying the original data
            const rowData = { ...batch[rowIndex] };

            // Log the first row for debugging
            if (rowIndex === 0) {
              console.log("Sample row:", rowData);
            }

            // Use the simplest insert method possible
            try {
              await client.insert({
                table: `${database}.${tableName}`,
                values: [rowData],
                format: 'JSONEachRow' // This is the most compatible format
              });

              // Log progress
              if (rowIndex % 5 === 0) {
                console.log(`Inserted ${rowIndex + 1}/${batch.length} rows in current batch`);
              }
            } catch (rowError) {
              console.error(`Error inserting row ${rowIndex + 1}:`, rowError);
              console.error("Problem row:", rowData);
              throw rowError; // Re-throw to be caught by the outer catch
            }
          }

          totalImported += batch.length;
          console.log(`Successfully inserted batch ${i / batchSize + 1}, total so far: ${totalImported}`);
        } catch (batchError) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, batchError);
          return res.status(500).json({
            success: false,
            message: `Failed to insert batch ${i / batchSize + 1}: ${batchError.message}`
          });
        }
      }

      return res.status(200).json({
        success: true,
        count: totalImported,
        message: `Successfully imported ${totalImported} records to ClickHouse`
      });
    } catch (insertError) {
      console.error('Error inserting data to ClickHouse:', insertError);
      return res.status(500).json({
        success: false,
        message: `Failed to insert data: ${insertError.message}`
      });
    }
  } catch (error) {
    console.error('Error importing to ClickHouse:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to import data: ${error.message}`
    });
  }
});



export default router;