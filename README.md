# Salesforce Bot Dependency Retrieval

A TypeScript project to retrieve Salesforce Bot metadata with its dependencies. This project demonstrates the support for the new `rootTypesWithDependencies` parameter in Metadata API.

## Overview

This project uses Salesforce DX tools to retrieve Bot metadata along with all its dependencies from a Salesforce org. It uses the `rootTypesWithDependencies` parameter to ensure that all Bot-related dependencies are included in the retrieval.

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
SF_USERNAME=your_salesforce_username
SF_PASSWORD=your_salesforce_password
SF_TOKEN=your_security_token
SF_LOGIN_URL=https://login.salesforce.com
API_VERSION=64.0
```

4. Create a `package.xml` file in the root directory that specifies the metadata you want to retrieve.

## Usage

To build the TypeScript project:

```bash
npm run build
```

To run the retrieval tool:

```bash
npm run retrieve
```

Or you can use:

```bash
npm start
```

Which will build and then run the retrieve operation.

## Development

For development, you can use the watch mode:

```bash
npm run dev
```

## Testing

Run the test suite:

```bash
npm test
```

## Project Structure

- `src/` - TypeScript source files
  - `retrieve.ts` - Main module for retrieving Salesforce metadata
  - `main.ts` - Entry point for the application
- `__tests__/` - Test files
- `dist/` - Compiled JavaScript (generated)
- `tmp/` - Directory created for retrieved metadata
  - `unpackaged/` - Extracted metadata components

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

## About rootTypesWithDependencies

The `rootTypesWithDependencies` parameter in the Metadata API allows for retrieving all dependencies of specified metadata types in a single operation. This project demonstrates this feature specifically for Bot metadata type, where it:

1. Automatically includes all Bot dependencies (BotVersions, DialogNodes, etc.)
2. Eliminates the need to explicitly list all Bot-related components in package.xml
3. Ensures that all required components are retrieved together, maintaining referential integrity

This project serves as a demonstration of the new `rootTypesWithDependencies` functionality introduced in the Metadata API, providing a practical example of how to leverage this feature to simplify metadata retrieval operations.

Currently, this feature is only implemented for the `Bot` metadata type in this project. Future releases may support additional metadata types as the API evolves.

## Testing

The tests use Jest, a popular JavaScript testing framework. The tests verify key functionality:

1. The inclusion of 'Bot' in the rootTypesWithDependencies parameter
2. The use of metadata format instead of source format
3. The explicit request for unzipping
4. The proper handling of environment variables
5. The zip file extraction logic

To run the tests:

```bash
npm test
```

## Notes

- The script creates a `tmp` directory in the project root to store retrieved metadata.
- When running the script, it will unzip any retrieved zip files into a `tmp/unpackaged` directory.
- If you encounter any error regarding the missing `retrieve` script, make sure your package.json has been updated with the proper scripts section. 