# Salesforce Metadata Retrieval

This project is designed to retrieve metadata from a Salesforce org using the Salesforce Source Deploy & Retrieve module, with a focus on demonstrating the `rootTypesWithDependencies` feature of the Metadata API.

## Key Features

- Demonstrates the `rootTypesWithDependencies` parameter in Salesforce Metadata API v64.0+
- Currently supports Bot metadata type retrieval with all its dependencies
- Automatically extracts all Bot-related metadata components in a single operation
- Handles retrieval, unzipping, and organization of the retrieved metadata

## Prerequisites

- Node.js (v16+)
- npm
- Salesforce credentials
- Bot/Bot-related metadata in your Salesforce org

## Setup

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file in the root directory with the following content:

```
SF_USERNAME=your_salesforce_username
SF_PASSWORD=your_salesforce_password
SF_TOKEN=your_salesforce_security_token
SF_LOGIN_URL=https://login.salesforce.com
API_VERSION=64.0
```

4. Create a `package.xml` file in the root directory that specifies the metadata you want to retrieve.

## Available Commands

- `npm run retrieve` - Run the original retrieval script
- `npm start` - Run the retrieval using the module version
- `npm test` - Run the test suite

## About rootTypesWithDependencies

The `rootTypesWithDependencies` parameter in the Metadata API allows for retrieving all dependencies of specified metadata types in a single operation. This project demonstrates this feature specifically for Bot metadata type, where it:

1. Automatically includes all Bot dependencies (BotVersions, DialogNodes, etc.)
2. Eliminates the need to explicitly list all Bot-related components in package.xml
3. Ensures that all required components are retrieved together, maintaining referential integrity

Currently, this feature is only implemented for the `Bot` metadata type in this project. Future releases may support additional metadata types as the API evolves.

## Project Structure

- `retrieve.js` - Original script that auto-executes metadata retrieval
- `retrieve.module.js` - Modular version with exported functions for testing
- `main.js` - Entry point that uses the modular version
- `__tests__/retrieve.test.js` - Tests for the metadata retrieval functionality
- `package.xml` - Defines the metadata components to retrieve

## Testing

The tests use Jest, a popular JavaScript testing framework. They mock external dependencies to test the functionality without actually connecting to Salesforce.

To run the tests:

```bash
npm test
```

## Notes

- The script creates a `tmp` directory in the project root to store retrieved metadata.
- When running the script, it will unzip any retrieved zip files into a `tmp/unpackaged` directory.
- The tests cover the main functionality of connecting to Salesforce, retrieving metadata, and handling various scenarios, including verifying that the `rootTypesWithDependencies` parameter is correctly passed with the 'Bot' value. 