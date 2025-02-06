export class TestFileInfo {
    constructor(
        public readonly filePath: string,
        public readonly startCouter: number,
        public readonly increaseStep: number,
        public readonly fileSize: number,
    ) {
    }
}