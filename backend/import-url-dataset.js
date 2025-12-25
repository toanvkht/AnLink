const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Parse URL to extract components
function parseURL(urlString) {
  try {
    const url = new URL(urlString);
    const domain = url.hostname;
    const subdomain = domain.split('.').length > 2 ? domain.split('.').slice(0, -2).join('.') : null;

    return {
      scheme: url.protocol.replace(':', ''),
      domain: domain,
      subdomain: subdomain,
      path: url.pathname || '/',
      query: url.search || null,
      fragment: url.hash || null
    };
  } catch (error) {
    return null;
  }
}

// Generate hash for URL
function generateHash(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

// Map type to status
function mapTypeToStatus(type) {
  const typeLower = type.toLowerCase();
  if (typeLower === 'legitimate') return 'safe';
  if (typeLower === 'phishing') return 'confirmed_phishing';
  return 'pending';
}

async function importURLDataset() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting URL dataset import...\n');

    const csvPath = path.join(__dirname, '..', 'database', 'Phishing URL dataset', 'URL dataset.csv');

    // Read CSV file
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    console.log(`📊 Total lines in CSV: ${lines.length}`);
    console.log(`📊 Records to import: ${lines.length - 1} (excluding header)\n`);

    // Skip header
    const dataLines = lines.slice(1);

    // Process in batches
    const BATCH_SIZE = 1000;
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
      const batch = dataLines.slice(i, i + BATCH_SIZE);
      const values = [];
      const params = [];
      let paramIndex = 1;

      for (const line of batch) {
        const [url, type] = line.split(',').map(s => s.trim());

        if (!url || !type) {
          skipped++;
          continue;
        }

        const parsed = parseURL(url);
        if (!parsed) {
          skipped++;
          continue;
        }

        const urlHash = generateHash(url);
        const status = mapTypeToStatus(type);

        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`);
        params.push(url, url, urlHash, parsed.scheme, parsed.domain, parsed.subdomain, parsed.path, status);
        paramIndex += 8;
      }

      if (values.length > 0) {
        try {
          const query = `
            INSERT INTO suspicious_urls (original_url, normalized_url, url_hash, scheme, domain, subdomain, path, status)
            VALUES ${values.join(', ')}
            ON CONFLICT (url_hash) DO NOTHING
          `;

          const result = await client.query(query, params);
          imported += batch.length - skipped;

          const progress = ((i + batch.length) / dataLines.length * 100).toFixed(1);
          console.log(`✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Processed ${i + batch.length}/${dataLines.length} (${progress}%)`);
        } catch (error) {
          console.error(`✗ Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
          errors += batch.length;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Import Summary:');
    console.log('='.repeat(60));
    console.log(`✓ Total processed: ${dataLines.length}`);
    console.log(`✓ Successfully imported: ${imported}`);
    console.log(`⊘ Skipped (invalid): ${skipped}`);
    console.log(`✗ Errors: ${errors}`);
    console.log('='.repeat(60));

    // Get final counts by status
    const counts = await client.query(`
      SELECT status, COUNT(*) as count
      FROM suspicious_urls
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\n📊 Database Statistics:');
    counts.rows.forEach(row => {
      console.log(`   ${row.status.padEnd(20)}: ${row.count}`);
    });

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    client.release();
    process.exit(1);
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         AnLink URL Dataset Import Utility                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

importURLDataset();
