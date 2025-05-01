import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as sdr from '@salesforce/source-deploy-retrieve';
const { ComponentSet } = sdr;
import { AuthInfo, Connection } from '@salesforce/core';
import AdmZip from 'adm-zip';

dotenv.config();

const TMP_DIR = path.resolve(process.cwd(), 'tmp');
const UNPACK_DIR = path.join(TMP_DIR, 'unpackaged');

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
        password: (process.env.SF_PASSWORD || '') + (process.env.SF_TOKEN || ''),
        instanceUrl: process.env.SF_LOGIN_URL || '',
    } as any); // Using any here to bypass the typings issue with password

    return await Connection.create({ authInfo });
}

export async function retrieveMetadata(): Promise<RetrieveResult | undefined> {
    try {
        const conn = await setupConnection();

        // Ensure TMP_DIR exists and clean any existing unpackaged directory
        if (!fs.existsSync(TMP_DIR)) {
            fs.mkdirSync(TMP_DIR, { recursive: true });
        } else if (fs.existsSync(UNPACK_DIR)) {
            // Clean existing unpackaged directory
            fs.rmSync(UNPACK_DIR, { recursive: true, force: true });
        }

        // Check if package.xml exists and read it
        if (!fs.existsSync('package.xml')) {
            throw new Error('package.xml not found in the current directory');
        }

        // Create a component set from the package.xml
        const components = await ComponentSet.fromManifest({
            manifestPath: 'package.xml',
            apiVersion: process.env.API_VERSION || '64.0',
            forceAddWildcards: true,
        } as any); // Using any to bypass type issues

        // Create and start the retrieve operation with rootTypesWithDependencies
        const retrieve = await components.retrieve({
            usernameOrConnection: conn,
            output: TMP_DIR,
            format: 'metadata', // Use metadata format instead of source
            apiVersion: process.env.API_VERSION || '64.0',
            rootTypesWithDependencies: ['Bot'],
            unzip: true, // Explicitly request unzipping
        });

        // Wait for the retrieve to complete
        const result = await retrieve.pollStatus();

        if (result.response && !result.response.success) {
            throw new Error(result.response.errorMessage || 'Retrieve failed');
        }

        // Check for retrievetargetdir property which contains the actual path to the retrieved files
        const retrieveTargetDir =
            result.response && result.response.retrieveTargetDir
                ? result.response.retrieveTargetDir
                : TMP_DIR;

        // Check if there's a zip file we need to manually extract
        const zipFiles = fs.readdirSync(retrieveTargetDir).filter((file) => file.endsWith('.zip'));
        if (zipFiles.length > 0) {
            // Create unpack directory if it doesn't exist
            if (!fs.existsSync(UNPACK_DIR)) {
                fs.mkdirSync(UNPACK_DIR, { recursive: true });
            }

            // Process each zip file using adm-zip
            try {
                for (const zipFile of zipFiles) {
                    const zipPath = path.join(retrieveTargetDir, zipFile);

                    try {
                        // Extract zip file using adm-zip
                        const zip = new AdmZip(zipPath);
                        zip.extractAllTo(UNPACK_DIR, true); // true for overwrite

                        // Clean up zip file after successful extraction
                        fs.unlinkSync(zipPath);
                        console.log(`Successfully extracted ${zipFile} to ${UNPACK_DIR}`);
                    } catch (error: any) {
                        console.error(`Error extracting ${zipFile}:`, error.message);
                    }
                }
            } catch (error: any) {
                console.error('Error processing zip files:', error.message);
            }
        }

        return result;
    } catch (error: any) {
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
}
