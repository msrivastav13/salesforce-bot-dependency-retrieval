import { retrieveMetadata } from './retrieve.js';

console.log('Starting Salesforce Bot dependency retrieval...');

// Execute the retrieveMetadata function
retrieveMetadata()
    .then((result) => {
        if (result && result.response) {
            if (result.response.success) {
                console.log('✅ Retrieve completed successfully!');
                
                // Log some useful information from the result if available
                if (result.response.fileProperties) {
                    const fileCount = Array.isArray(result.response.fileProperties) 
                        ? result.response.fileProperties.length 
                        : 1;
                    console.log(`Retrieved ${fileCount} file(s)`);
                }
            } else {
                console.error('❌ Retrieve failed:', result.response.errorMessage || 'Unknown error');
                process.exit(1);
            }
        }
    })
    .catch((err) => {
        console.error('❌ Error during retrieve:', err.message || err);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    });
