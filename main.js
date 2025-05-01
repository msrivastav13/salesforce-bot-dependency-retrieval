import { retrieveMetadata } from './retrieve.module.js';

// Execute the retrieveMetadata function
retrieveMetadata()
  .then((result) => {
    console.log('Retrieve completed with result:', result.response.success ? 'SUCCESS' : 'FAILED');
  })
  .catch((err) => {
    console.error('Error during retrieve:', err);
    process.exit(1);
  }); 