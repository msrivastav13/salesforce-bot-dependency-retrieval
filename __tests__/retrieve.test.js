import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { AuthInfo, Connection } from '@salesforce/core';
import pkg from '@salesforce/source-deploy-retrieve';
const { ComponentSet } = pkg;

// Import the module under test
import { retrieveMetadata, setupConnection } from '../retrieve.module.js';

// Mock modules
jest.mock('fs');
jest.mock('dotenv');
jest.mock('@salesforce/core');
jest.mock('@salesforce/source-deploy-retrieve');
jest.mock('child_process');
jest.mock('url', () => ({
  fileURLToPath: jest.fn().mockReturnValue('mocked-file-path')
}));

describe('retrieveMetadata function', () => {
  // Setup common mocks
  const mockConnection = {
    // Add any connection methods used in the code
  };
  
  const mockComponentSet = {
    retrieve: jest.fn(),
    size: 5
  };
  
  const mockRetrieve = {
    id: 'test-retrieve-id',
    pollStatus: jest.fn()
  };
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Set up the mocks for individual functions
    fs.existsSync = jest.fn();
    fs.mkdirSync = jest.fn();
    fs.rmSync = jest.fn();
    fs.readFileSync = jest.fn();
    fs.readdirSync = jest.fn();
    fs.statSync = jest.fn();
    fs.unlinkSync = jest.fn();
    fs.copyFileSync = jest.fn();
    
    // Mock AuthInfo and Connection
    AuthInfo.create = jest.fn().mockResolvedValue({});
    Connection.create = jest.fn().mockResolvedValue(mockConnection);
    
    // Mock ComponentSet
    ComponentSet.fromManifest = jest.fn().mockResolvedValue(mockComponentSet);
    mockComponentSet.retrieve = jest.fn().mockResolvedValue(mockRetrieve);
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Mock process.exit
    process.exit = jest.fn();
    
    // Mock environment variables
    process.env = {
      SF_USERNAME: 'test-username',
      SF_PASSWORD: 'test-password',
      SF_TOKEN: 'test-token',
      SF_LOGIN_URL: 'https://test.salesforce.com',
      API_VERSION: '64.0'
    };
  });

  test('should connect to Salesforce successfully', async () => {
    // Setup
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('<mock-package-xml>');
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ isDirectory: () => false, size: 100 });
    mockRetrieve.pollStatus.mockResolvedValue({
      response: {
        success: true
      }
    });
    
    // Execute
    await retrieveMetadata();
    
    // Verify
    expect(AuthInfo.create).toHaveBeenCalledWith({
      username: 'test-username',
      password: 'test-passwordtest-token',
      instanceUrl: 'https://test.salesforce.com'
    });
    expect(Connection.create).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('✔ Connected to Salesforce');
  });
  
  test('should create tmp directory if it does not exist', async () => {
    // Setup
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('tmp')) return false;
      if (path === 'package.xml') return true;
      return false;
    });
    fs.readFileSync.mockReturnValue('<mock-package-xml>');
    fs.readdirSync.mockReturnValue([]);
    mockRetrieve.pollStatus.mockResolvedValue({
      response: {
        success: true
      }
    });
    
    // Execute
    await retrieveMetadata();
    
    // Verify
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Created directory:'));
  });
  
  test('should clean existing unpackaged directory', async () => {
    // Setup
    fs.existsSync.mockImplementation((path) => {
      return true; // All directories exist
    });
    fs.readFileSync.mockReturnValue('<mock-package-xml>');
    fs.readdirSync.mockReturnValue([]);
    mockRetrieve.pollStatus.mockResolvedValue({
      response: {
        success: true
      }
    });
    
    // Execute
    await retrieveMetadata();
    
    // Verify
    expect(fs.rmSync).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cleaned existing directory:'));
  });
  
  test('should throw error if package.xml not found', async () => {
    // Setup
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('tmp')) return true;
      if (path === 'package.xml') return false;
      return false;
    });
    
    // Execute and verify
    await retrieveMetadata();
    
    // Verify
    expect(console.error).toHaveBeenCalledWith('❌', 'package.xml not found in the current directory');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  test('should handle successful metadata retrieval', async () => {
    // Setup
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('<mock-package-xml>');
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ isDirectory: () => false, size: 100 });
    mockRetrieve.pollStatus.mockResolvedValue({
      response: {
        success: true
      }
    });
    
    // Execute
    await retrieveMetadata();
    
    // Verify
    expect(ComponentSet.fromManifest).toHaveBeenCalledWith({
      manifestPath: 'package.xml',
      apiVersion: '64.0',
      forceAddWildcards: true
    });
    expect(mockComponentSet.retrieve).toHaveBeenCalledWith({
      usernameOrConnection: mockConnection,
      output: expect.any(String),
      format: 'metadata',
      apiVersion: '64.0',
      rootTypesWithDependencies: ['Bot'],
      unzip: true
    });
    expect(mockRetrieve.pollStatus).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('🎉 Retrieve completed successfully');
  });
  
  test('should include rootTypesWithDependencies parameter in retrieve call', async () => {
    // Setup
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('<mock-package-xml>');
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ isDirectory: () => false, size: 100 });
    mockRetrieve.pollStatus.mockResolvedValue({
      response: {
        success: true
      }
    });
    
    // Execute
    await retrieveMetadata();
    
    // Verify that rootTypesWithDependencies parameter exists and contains expected value
    expect(mockComponentSet.retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        rootTypesWithDependencies: ['Bot']
      })
    );
    
    // Verify the exact parameter structure
    const retrieveCallArgs = mockComponentSet.retrieve.mock.calls[0][0];
    expect(retrieveCallArgs).toHaveProperty('rootTypesWithDependencies');
    expect(Array.isArray(retrieveCallArgs.rootTypesWithDependencies)).toBe(true);
    expect(retrieveCallArgs.rootTypesWithDependencies).toContain('Bot');
  });
  
  test('should handle failed metadata retrieval', async () => {
    // Setup
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('<mock-package-xml>');
    mockRetrieve.pollStatus.mockResolvedValue({
      response: {
        success: false,
        errorMessage: 'Test error message'
      }
    });
    
    // Execute
    await retrieveMetadata();
    
    // Verify
    expect(console.error).toHaveBeenCalledWith('❌', 'Test error message');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
}); 