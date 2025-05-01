declare module '@salesforce/source-deploy-retrieve' {
  export class ComponentSet {
    static fromManifest(options: { 
      manifestPath: string;
      apiVersion: string;
      forceAddWildcards: boolean;
    }): Promise<ComponentSet>;
    
    size: number;
    
    retrieve(options: {
      usernameOrConnection: any;
      output: string;
      format: string;
      apiVersion: string;
      rootTypesWithDependencies: string[];
      unzip: boolean;
    }): Promise<{
      id: string;
      pollStatus: () => Promise<{
        response: {
          success: boolean;
          errorMessage?: string;
          retrieveTargetDir?: string;
          [key: string]: any;
        };
        [key: string]: any;
      }>;
    }>;
  }
}

declare module '@salesforce/core' {
  export class AuthInfo {
    static create(options: {
      username: string;
      password: string;
      instanceUrl: string;
    }): Promise<AuthInfo>;
  }

  export class Connection {
    static create(options: { authInfo: AuthInfo }): Promise<Connection>;
  }
} 