declare namespace chrome {
    namespace storage {
        class local {
            static get(arr: string[]): Promise<any>;
            static set(arr: any): Promise<any>;
        }
    }
}