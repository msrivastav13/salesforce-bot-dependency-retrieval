import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ComponentSet } from '@salesforce/source-deploy-retrieve';
import { AuthInfo, Connection } from '@salesforce/core';
import AdmZip from 'adm-zip';

dotenv.config();

const TMP_DIR = path.resolve(process.cwd(), 'tmp');
const UNPACK_DIR = path.join(TMP_DIR, 'unpackaged');
const API_VERSION = process.env.API_VERSION || '64.0';

// Define RetrieveResult type
export interface RetrieveResult {
    response: {
        success: boolean;
        errorMessage?: string;
        retrieveTargetDir?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

/**
 * Sets up a Salesforce connection using environment variables
 */
export async function setupConnection(): Promise<Connection> {
    if (!process.env.SF_USERNAME) {
        throw new Error('SF_USERNAME environment variable not set');
    }

    const authConfig: any = {
        username: process.env.SF_USERNAME,
        password: `${process.env.SF_PASSWORD || ''}${process.env.SF_TOKEN || ''}`
    };
    
    // Only add instanceUrl if it exists
    if (process.env.SF_LOGIN_URL) {
        authConfig.instanceUrl = process.env.SF_LOGIN_URL;
    }
    
    const authInfo = await AuthInfo.create(authConfig);
    return Connection.create({ authInfo });
}

/**
 * Retrieves metadata from Salesforce using SDR
 */
export async function retrieveMetadata(): Promise<RetrieveResult> {
    try {
        // Establish connection
        const connection = await setupConnection();

        // Prepare directories
        prepareDirectories();

        // Validate package.xml
        const packagePath = path.resolve(process.cwd(), 'package.xml');
        if (!fs.existsSync(packagePath)) {
            throw new Error('package.xml not found in the current directory');
        }

        // Create component set from manifest
        const components = await ComponentSet.fromManifest({
            manifestPath: packagePath,
            apiVersion: API_VERSION,
            forceAddWildcards: true
        });

        console.log('Starting retrieve operation...');
        
        // Perform the retrieve operation
        const retrieve = await components.retrieve({
            usernameOrConnection: connection,
            output: TMP_DIR,
            format: 'metadata',
            apiVersion: API_VERSION,
            rootTypesWithDependencies: ['Bot'],
            unzip: true
        });

        // Poll until completion
        const result = await retrieve.pollStatus();

        if (!result.response.success) {
            throw new Error(result.response.errorMessage || 'Retrieve failed without specific error message');
        }

        // Extract zip files if needed
        await extractZipFilesIfNeeded(result);

        console.log(`Retrieve completed successfully. Files are in ${UNPACK_DIR}`);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : '';
        
        console.error(`Retrieve failed: ${errorMessage}`);
        if (errorStack) console.error(errorStack);
        
        throw error;
    }
}

/**
 * Prepares the directory structure for the retrieve operation
 */
function prepareDirectories(): void {
    // Create tmp directory if it doesn't exist
    if (!fs.existsSync(TMP_DIR)) {
        fs.mkdirSync(TMP_DIR, { recursive: true });
    }
    
    // Clean existing unpackaged directory
    if (fs.existsSync(UNPACK_DIR)) {
        fs.rmSync(UNPACK_DIR, { recursive: true, force: true });
    }
    
    // Create fresh unpackaged directory
    fs.mkdirSync(UNPACK_DIR, { recursive: true });
}

/**
 * Extracts zip files from retrieve result if needed
 */
async function extractZipFilesIfNeeded(result: RetrieveResult): Promise<void> {
    const retrieveTargetDir = result.response.retrieveTargetDir || TMP_DIR;
    
    // Find all zip files in the target directory
    const zipFiles = fs.readdirSync(retrieveTargetDir)
        .filter(file => file.endsWith('.zip'));
    
    if (zipFiles.length === 0) {
        console.log('No zip files found to extract');
        return;
    }
    
    // Extract each zip file
    for (const zipFile of zipFiles) {
        const zipPath = path.join(retrieveTargetDir, zipFile);
        
        try {
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(UNPACK_DIR, true);
            
            // Clean up zip file after extraction
            fs.unlinkSync(zipPath);
            console.log(`Extracted ${zipFile} to ${UNPACK_DIR}`);
        } catch (error) {
            console.error(`Error extracting ${zipFile}:`, 
                error instanceof Error ? error.message : 'Unknown error');
        }
    }
}
