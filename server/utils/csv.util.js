const { parse } = require('csv-parse');
const { Readable } = require('stream');

// Takes the raw CSV file buffer and converts it into an array of JS objects.
// Each object represents one row from the CSV.
// Example output:
// [
//   { name: "John", email: "john@example.com", team: "Engineering" },
//   { name: "Sara", email: "sara@example.com", team: "Marketing" }
// ]
async function parseCsv(fileBuffer) {
  return new Promise((resolve, reject) => {
    // Convert the file buffer into a readable stream.
    // Think of a stream like water flowing through a pipe —
    // instead of loading the entire file at once, we read it row by row.
    // This is memory efficient for large CSV files.
    const stream = Readable.from(fileBuffer);

    const records = [];

    const parser = parse({
      // First row of the CSV is the header row — use it as object keys.
      // Without this, you'd get arrays like ["John", "john@example.com"]
      // With this, you get objects like { name: "John", email: "john@example.com" }
      columns: true,

      // Skip empty lines — no point processing blank rows.
      skip_empty_lines: true,

      // Remove extra spaces from values.
      // "  john@example.com  " becomes "john@example.com"
      trim: true,
    });

    // Every time a row is parsed, push it to our records array.
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    // If something goes wrong while parsing, reject the promise.
    parser.on('error', (error) => {
      reject(new Error(`CSV parsing failed: ${error.message}`));
    });

    // When all rows are parsed, resolve the promise with all records.
    parser.on('end', () => {
      resolve(records);
    });

    // Pipe the file stream into the parser.
    // This is what actually starts the reading process.
    stream.pipe(parser);
  });
}

// Validates that the CSV has an email column and extracts clean data.
// Returns an array of objects ready to be saved as campaignJob records.
function extractRecipients(records) {
  if (!records || records.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Check if any email column exists.
  // We check for common variations — "email", "Email", "EMAIL", "email address"
  const firstRow = records[0];
  const emailKey = Object.keys(firstRow).find((key) =>
    key.toLowerCase().includes('email'),
  );

  if (!emailKey) {
    throw new Error('CSV must have an email column');
  }

  const recipients = [];
  const seen = new Set(); // Track duplicate emails.

  records.forEach((row, index) => {
    const email = String(row[emailKey] || '')
      .toLowerCase()
      .trim();

    // Skip rows with no email.
    if (!email) {
      return;
    }

    // Basic email format check.
    const isValidEmail = /^\S+@\S+\.\S+$/.test(email);
    if (!isValidEmail) {
      return; // Skip invalid emails silently.
    }

    // Skip duplicate emails — no point sending the same person two emails.
    if (seen.has(email)) {
      return;
    }

    seen.add(email);

    // Store the entire row as csvRow so placeholders like {{name}}
    // can be replaced with real data when the email is actually sent.
    recipients.push({
      email,
      csvRow: row,
    });
  });

  if (recipients.length === 0) {
    throw new Error('No valid email addresses found in CSV');
  }

  return recipients;
}

module.exports = { parseCsv, extractRecipients };
