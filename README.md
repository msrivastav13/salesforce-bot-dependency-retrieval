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

## Usage

To build the TypeScript project:

```bash
npm run build
```

To run the retrieval tool:

```bash
npm run retrieve
```

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

## TypeScript Conversion

This project has been converted from JavaScript to TypeScript. The conversion includes:

1. Type definitions for Salesforce-specific APIs
2. Strong typing for all functions and variables
3. TypeScript configuration with ES modules support
4. TypeScript-compatible Jest testing setup

## Project Structure

- `src/` - TypeScript source files
  - `retrieve.ts` - Main module for retrieving Salesforce metadata
  - `main.ts` - Entry point for the application
  - `salesforce-types.d.ts` - Type definitions for Salesforce APIs
- `__tests__/` - Test files
- `dist/` - Compiled JavaScript (generated)

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

This project serves as a demonstration of the new `rootTypesWithDependencies` functionality introduced in the Metadata API, providing a practical example of how to leverage this feature to simplify metadata retrieval operations.

Currently, this feature is only implemented for the `Bot` metadata type in this project. Future releases may support additional metadata types as the API evolves.

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