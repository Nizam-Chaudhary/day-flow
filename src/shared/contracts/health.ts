export interface AppHealth {
    databaseReady: boolean;
    databasePath: string;
    lastMigrationAt?: string;
}
