import {MultiBar, Presets, SingleBar} from "cli-progress";
import { HelperService } from "./helper.service.js";

const FileInfo = {
    type: 'File ',
    filePath: '',
}
const WriteTotalInfo = {
    type: 'Write',
    filePath: '',
}
const CheckTotalInfo = {
    type: 'Check',
    filePath: '',
}

export class ProgressInfo {
    private wroteTotalSize: number = 0;
    private readTotalSize: number = 0;

    private wroteFileSize: number = 0;
    private readFileSize: number = 0;

    private inProgressFilePath: string = '';

    // Створюємо мульті-прогрес бар
    private multibar = new MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: '{type} progress |{bar}| {progressFileSize} / {totalFileSize} | {percentage}% | {filePath}'
    }, Presets.rect);

    // Створюємо два прогрес-бари
    private progressFileInfo: SingleBar;
    private progressWriteTotalInfo: SingleBar;
    private progressCheckTotal: SingleBar;

    private maxLenghtForSize: number;

    constructor(
        public totalSize: number,
    ) {
        // Створюємо два прогрес-бари
        this.progressFileInfo = this.multibar.create(totalSize, 0);
        this.progressWriteTotalInfo = this.multibar.create(totalSize, 0);
        this.progressCheckTotal = this.multibar.create(totalSize, 0);
        this.maxLenghtForSize = Math.ceil(totalSize.toString().length / 3) + totalSize.toString().length + 1;

        this.progressFileInfo.update(0, {
            ...FileInfo,
            progressFileSize: HelperService.convertSizeForView(0, this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(totalSize, this.maxLenghtForSize),
            filePath: this.inProgressFilePath,
        });
        this.progressWriteTotalInfo.update(0, {
            ...WriteTotalInfo,
            progressFileSize: HelperService.convertSizeForView(0, this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(totalSize, this.maxLenghtForSize),
        });
        this.progressCheckTotal.update(0, {
            ...CheckTotalInfo,
            progressFileSize: HelperService.convertSizeForView(0, this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(totalSize, this.maxLenghtForSize),
        });
    }

    increaseWroteSize(size: number) {
        this.wroteFileSize += size;
        this.wroteTotalSize += size;
        this.progressFileInfo.update(this.wroteFileSize,  {
            ...FileInfo,
            progressFileSize: HelperService.convertSizeForView(this.wroteFileSize, this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(this.progressFileInfo.getTotal(), this.maxLenghtForSize),
            filePath: this.inProgressFilePath,
        });
        this.progressWriteTotalInfo.update(this.wroteTotalSize, {
            ...WriteTotalInfo,
            progressFileSize: HelperService.convertSizeForView(this.wroteTotalSize, this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(this.totalSize, this.maxLenghtForSize),
        });
    }

    increaseReadSize(size: number) {
        this.readFileSize += size;
        this.readTotalSize += size;
        this.progressFileInfo.update(this.readFileSize,  {
            ...FileInfo,
            progressFileSize: HelperService.convertSizeForView(this.readFileSize, this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(this.progressFileInfo.getTotal(), this.maxLenghtForSize),
            filePath: this.inProgressFilePath,
        });
        this.progressCheckTotal.update(this.readTotalSize, {
            ...CheckTotalInfo,
            progressFileSize: HelperService.convertSizeForView(this.readTotalSize, this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(this.totalSize, this.maxLenghtForSize),
        });
    }

    setInProgressFile(filePath: string, expectedFileSize: number) {
        this.inProgressFilePath = filePath;
        this.wroteFileSize = 0;
        this.readFileSize = 0;
        this.progressFileInfo.setTotal(expectedFileSize);
        this.progressFileInfo.update(0,  {
            ...FileInfo,
            progressFileSize: HelperService.convertSizeForView(0, this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(expectedFileSize, this.maxLenghtForSize),
            filePath: this.inProgressFilePath,
        });
    }
    
    finish() {
        this.progressFileInfo.update(this.progressFileInfo.getTotal(), {
            ...FileInfo,
            progressFileSize: HelperService.convertSizeForView(this.progressFileInfo.getTotal(), this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(this.progressFileInfo.getTotal(), this.maxLenghtForSize),
            filePath: this.inProgressFilePath,
        });
        this.progressWriteTotalInfo.update(this.progressWriteTotalInfo.getTotal(), {
            ...WriteTotalInfo,
            progressFileSize: HelperService.convertSizeForView(this.progressWriteTotalInfo.getTotal(), this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(this.progressWriteTotalInfo.getTotal(), this.maxLenghtForSize),
        });
        this.progressCheckTotal.update(this.progressCheckTotal.getTotal(), {
            ...CheckTotalInfo,
            progressFileSize: HelperService.convertSizeForView(this.progressCheckTotal.getTotal(), this.maxLenghtForSize),
            totalFileSize: HelperService.convertSizeForView(this.progressCheckTotal.getTotal(), this.maxLenghtForSize),
        });
        this.multibar.stop();
    }
}