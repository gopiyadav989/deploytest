import fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';

// Read a CSV file and return its contents as an array of objects
export const readCsv = (filePath, delimiter = ',') => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser({ separator: delimiter }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Get the CSV headers (column names)
export const getCsvHeaders = (filePath, delimiter = ',') => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser({ separator: delimiter }))
      .on('headers', (headers) => resolve(headers))
      .on('error', (error) => reject(error))
      .on('data', () => {})
      .on('end', () => {});
  });
};

// Write data to a CSV file
export const writeToCsv = async (data, headers, outputPath = null) => {
  if (!outputPath) {
    outputPath = path.join('uploads', `export_${Date.now()}.csv`);
  }

  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: headers.map(header => ({ id: header, title: header }))
  });

  await csvWriter.writeRecords(data);
  return outputPath;
};

// Infer column types from CSV data
export function inferCsvColumnTypes(rows) {
  if (!rows.length) return {};
  const types = {};
  const sample = rows.slice(0, 10); // Use first 10 rows for inference
  Object.keys(rows[0]).forEach(col => {
    let isNumber = true;
    let isInt = true;
    let isDate = true;
    for (const row of sample) {
      const value = row[col];
      if (value === '' || value == null) continue;
      if (isNumber && isNaN(Number(value))) isNumber = false;
      if (isInt && !/^-?\d+$/.test(value)) isInt = false;
      if (isDate && isNaN(Date.parse(value))) isDate = false;
    }
    if (isInt) types[col] = 'Int64';
    else if (isNumber) types[col] = 'Float64';
    else if (isDate) types[col] = 'DateTime';
    else types[col] = 'String';
  });
  return types;
}
