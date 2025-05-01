import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as sdr from '@salesforce/source-deploy-retrieve';
const { ComponentSet } = sdr;
import { AuthInfo, Connection } from '@salesforce/core';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

dotenv.config();

const TMP_DIR = path.resolve(process.cwd(), "tmp");
const UNPACK_DIR = path.join(TMP_DIR, "unpackaged");

export interface RetrieveResult {
  response: {
    success: boolean;
    errorMessage?: string;
    retrieveTargetDir?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export async function setupConnection(): Promise<Connection> {
  const authInfo = await AuthInfo.create({
    username: process.env.SF_USERNAME || '',
    password: (process.env.SF_PASSWORD || '') + (process.env.SF_TOKEN || ""),
    instanceUrl: process.env.SF_LOGIN_URL || ''
  } as any); // Using any here to bypass the typings issue with password

  return await Connection.create({ authInfo });
}

export async function retrieveMetadata(): Promise<RetrieveResult | undefined> {
  try {
    const conn = await setupConnection();
    console.log("✔ Connected to Salesforce");

    // Ensure TMP_DIR exists and clean any existing unpackaged directory
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
      console.log(`Created directory: ${TMP_DIR}`);
    } else if (fs.existsSync(UNPACK_DIR)) {
      // Clean existing unpackaged directory
      fs.rmSync(UNPACK_DIR, { recursive: true, force: true });
      console.log(`Cleaned existing directory: ${UNPACK_DIR}`);
    }

    // Check if package.xml exists and read it
    if (!fs.existsSync('package.xml')) {
      throw new Error('package.xml not found in the current directory');
    }
    
    const packageXmlContent = fs.readFileSync('package.xml', 'utf8');
    console.log("Read package.xml successfully:");
    console.log(packageXmlContent.slice(0, 300) + (packageXmlContent.length > 300 ? '...' : ''));

    // Create a component set from the package.xml
    console.log("Creating ComponentSet from package.xml...");
    const components = await ComponentSet.fromManifest({
      manifestPath: 'package.xml',
      apiVersion: process.env.API_VERSION || '64.0',
      forceAddWildcards: true
    } as any); // Using any to bypass type issues
    
    console.log(`ComponentSet created with ${components.size} components`);

    // Create and start the retrieve operation with rootTypesWithDependencies
    console.log("Starting retrieve operation...");
    const retrieve = await components.retrieve({
      usernameOrConnection: conn,
      output: TMP_DIR,
      format: 'metadata', // Use metadata format instead of source
      apiVersion: process.env.API_VERSION || '64.0',
      rootTypesWithDependencies: ['Bot'],
      unzip: true // Explicitly request unzipping
    });

    console.log(`Retrieve operation started with ID: ${retrieve.id}`);
    
    // Wait for the retrieve to complete
    console.log("Waiting for retrieve to complete...");
    const result = await retrieve.pollStatus();
    
    console.log("Retrieve result:", JSON.stringify(result.response, null, 2));
    
    if (result.response && !result.response.success) {
      throw new Error(result.response.errorMessage || 'Retrieve failed');
    }

    console.log("🎉 Retrieve completed successfully");
    
    // Check for retrievetargetdir property which contains the actual path to the retrieved files
    const retrieveTargetDir = result.response && result.response.retrieveTargetDir ? result.response.retrieveTargetDir : TMP_DIR;
    console.log(`Retrieve target directory: ${retrieveTargetDir}`);
    
    // List files in output directory
    console.log(`Files in ${TMP_DIR}:`);
    const listAllFiles = (dir: string, indent = '') => {
      if (!fs.existsSync(dir)) {
        console.log(`${indent}Directory does not exist: ${dir}`);
        return;
      }
      
      const files = fs.readdirSync(dir);
      if (files.length === 0) {
        console.log(`${indent}(empty directory)`);
        return;
      }
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        console.log(`${indent}- ${file} (${stats.isDirectory() ? 'directory' : 'file'}, ${stats.size} bytes)`);
        if (stats.isDirectory()) {
          listAllFiles(filePath, indent + '  ');
        }
      });
    };
    
    listAllFiles(TMP_DIR);
    
    // If retrieveTargetDir is different from TMP_DIR, list files there too
    if (retrieveTargetDir !== TMP_DIR && fs.existsSync(retrieveTargetDir)) {
      console.log(`\nFiles in retrieveTargetDir (${retrieveTargetDir}):`);
      listAllFiles(retrieveTargetDir);
    }

    // Check if there's a zip file we need to manually extract
    const zipFiles = fs.readdirSync(TMP_DIR).filter(file => file.endsWith('.zip'));
    if (zipFiles.length > 0) {
      console.log("Found zip files, manually extracting...");
      
      // Create unpack directory if it doesn't exist
      if (!fs.existsSync(UNPACK_DIR)) {
        fs.mkdirSync(UNPACK_DIR, { recursive: true });
      }
      
      // Extract zip file using unzip command if available, otherwise just copy
      try {
        for (const zipFile of zipFiles) {
          const zipPath = path.join(TMP_DIR, zipFile);
          console.log(`Extracting ${zipPath} to ${UNPACK_DIR}`);
          
          // Try to use unzip command if available
          try {
            execSync(`unzip -o "${zipPath}" -d "${UNPACK_DIR}"`, { stdio: 'inherit' });
            
            // Clean up zip file after successful extraction
            fs.unlinkSync(zipPath);
            console.log(`Removed zip file: ${zipPath}`);
          } catch (error) {
            console.log("Unzip command failed, copying zip file instead");
            fs.copyFileSync(zipPath, path.join(UNPACK_DIR, zipFile));
          }
        }
        
        // List extracted files
        if (fs.existsSync(UNPACK_DIR)) {
          console.log(`Files in ${UNPACK_DIR}:`);
          const listDir = (dir: string, indent = '') => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
              const filePath = path.join(dir, file);
              const stats = fs.statSync(filePath);
              console.log(`${indent}- ${file} (${stats.isDirectory() ? 'directory' : 'file'}, ${stats.size} bytes)`);
              if (stats.isDirectory()) {
                listDir(filePath, indent + '  ');
              }
            });
          };
          listDir(UNPACK_DIR);
        }
      } catch (error: any) {
        console.error("Error extracting zip file:", error.message);
      }
    }

    return result;

  } catch (error: any) {
    console.error("❌", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if this file is being run directly
const isMainModule = process.argv[1] === (typeof __filename !== 'undefined' ? __filename : '');

// If this file is being run directly, execute retrieveMetadata
if (isMainModule) {
  retrieveMetadata()
    .then((result) => {
      if (result && result.response) {
        console.log('Retrieve completed with result:', result.response.success ? 'SUCCESS' : 'FAILED');
      }
    })
    .catch((err) => {
      console.error('Error during retrieve:', err);
      process.exit(1);
    });
} 