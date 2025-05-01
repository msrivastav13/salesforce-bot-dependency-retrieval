// @ts-nocheck
// Tests to verify the Bot dependency retrieval feature and other key functionality

import * as fs from 'fs';
import { jest, describe, it, expect } from '@jest/globals';

describe('retrieve.ts', () => {
    // Cache the source code to avoid reading the file multiple times
    const sourceCode = fs.readFileSync('src/retrieve.ts', 'utf8');

    it('should include Bot in rootTypesWithDependencies', () => {
        // Check if it contains the Bot dependency configuration
        expect(sourceCode).toContain("rootTypesWithDependencies: ['Bot']");
    });

    it('should use metadata format instead of source format', () => {
        // Check if it specifies metadata format
        expect(sourceCode).toContain("format: 'metadata'");
    });

    it('should explicitly request unzipping', () => {
        // Check if it explicitly requests unzipping
        expect(sourceCode).toContain('unzip: true');
    });

    it('should properly handle SF_USERNAME and SF_PASSWORD from environment variables', () => {
        // Check for proper environment variable usage
        expect(sourceCode).toContain("username: process.env.SF_USERNAME || ''");
        expect(sourceCode).toContain(
            'password: (process.env.SF_PASSWORD || \'\') + (process.env.SF_TOKEN || "")'
        );
    });

    it('should extract zip files if present', () => {
        // Check for zip extraction logic
        expect(sourceCode).toContain(
            "const zipFiles = fs.readdirSync(retrieveTargetDir).filter(file => file.endsWith('.zip'))"
        );
        expect(sourceCode).toContain('zip.extractAllTo(UNPACK_DIR, true)');
    });
});
