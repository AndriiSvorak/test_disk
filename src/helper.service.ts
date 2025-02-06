import * as fs from 'fs';
import * as path from 'path';
import { IoStructureService } from "./io-structure.service.js";
import { Readline } from './read-line.service.js';
import { ExitError } from './exit-error.js';
import { ConsoleOptions } from './interfaces/console-options.js';
import { OptionTypeEnum } from './enums/option-type.enum.js';

// 2 GB, 100 MB, 10 MB, 1 MB, 100 KB, 4KB. 
export const enum FileSizeEum {
    SIZE_2_GB = 4096 * 250000 * 2,
    SIZE_100_MB = 4096 * 25000,
    SIZE_10_MB = 4096 * 2500,
    SIZE_1_MB = 4096 * 250,
    SIZE_100_KB = 4096 * 25,
    SIZE_4_KB = 4096,
}

export const BLOCK_SIZE = 256 * 256 * 256 * 256 - 1;

export class HelperService {
    static createFileName(testStep: number): string {
        return `test-${'0'.repeat(4 - testStep.toString().length)}${testStep}.data`;
    }

    static async createTestFolder(options: ConsoleOptions, readLine: Readline): Promise<string> {
        const workPath: string = path.join(options.path, 'disk_test');
        if (options.type === OptionTypeEnum.All || options.type === OptionTypeEnum.OnlyCreate) {
            if (IoStructureService.existsPath(workPath)) {
                const answer = await readLine.askYesNoQuestion(`Знайдена тимчасова папка ${workPath}. Для продовдення потрібно видалити її. Ви дійсно бажаєте її видалити?`);
                if (answer === 'N') {
                    throw new ExitError(`Зупинено користувачем!`);
                }
                IoStructureService.removeFolder(workPath);
            }
        }
        if (options.type === OptionTypeEnum.OnlyTest) {
            if (!IoStructureService.existsPath(workPath)) {
                throw new Error(`Error #17: Відсутня папка із файлами для тестування! workPath: ${workPath}`);
            }
        } else {
            IoStructureService.createFolder(workPath);
        }

        return workPath;
    }

    static createFile(workPath: string, testStep: number): string {
        // Створити пустий файл.
        const newFileName: string = this.createFileName(testStep);
        return IoStructureService.createFile(workPath, newFileName);
    }

    static getFileSizeForTesting(freeSpaceForTestLeft: number): FileSizeEum {
        if (freeSpaceForTestLeft < FileSizeEum.SIZE_100_KB) {
            return FileSizeEum.SIZE_4_KB;
        } else if (freeSpaceForTestLeft < FileSizeEum.SIZE_1_MB) {
            return FileSizeEum.SIZE_100_KB;
        } else if (freeSpaceForTestLeft < FileSizeEum.SIZE_10_MB) {
            return FileSizeEum.SIZE_1_MB;
        } else if (freeSpaceForTestLeft < FileSizeEum.SIZE_100_MB) {
            return FileSizeEum.SIZE_10_MB;
        } else if (freeSpaceForTestLeft < FileSizeEum.SIZE_2_GB) {
            return FileSizeEum.SIZE_100_MB;
        } else {
            return FileSizeEum.SIZE_2_GB;
        }
    }

    static convertSizeForView(size: number, maxLenght: number = 15): string {
        const numberAsString: string = size.toString();
        const firstBlock: number = numberAsString.length % 3;
        const totalSize: number = numberAsString.length;

        let reuslt: string = numberAsString.substring(0, firstBlock);
        if (firstBlock !== 0) {
            reuslt += ',';
        }
        for(let i = 0; i < Math.floor(totalSize / 3); i++) {
            reuslt += numberAsString.substring(firstBlock+i*3, firstBlock+(i+1)*3) + ',';
        }
        return  ' '.repeat(maxLenght-reuslt.length-1) + reuslt.substring(0, reuslt.length-1);
    }
}