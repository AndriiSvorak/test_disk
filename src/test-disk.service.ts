import * as fs from 'fs';
import { BLOCK_SIZE, FileSizeEum, HelperService } from "./helper.service.js";
import { IoStructureService } from "./io-structure.service.js";
import { DiskInfoService } from './disk-info.service.js';
import { DiskUsage } from 'diskusage';
import { ProgressInfo } from './progress-info.js';
import { Readline } from './read-line.service.js';
import { TestFileInfo } from './models/test-file-info.js';
import { OptionTypeEnum } from './enums/option-type.enum.js';
import { ConsoleOptions } from './interfaces/console-options.js';

export enum SizeTypeEnum {
    GB,
    MB,
    None,
}

const RESERVED_SIZE_FOR_AVOIDING_OVERSAVING_DATA = 0.9;

export class TestDiskService {
    private static getTestSize(size: string, selectedPath: string): number {
        if(size === 'full_free_size') {
            const diskInfo: DiskUsage = DiskInfoService.getDiskInfo(selectedPath);

            return diskInfo.free;
        } else {
            const enteredSize: number = parseInt(size);

            if (!enteredSize || enteredSize === Infinity || Number.isNaN(enteredSize)) {
                throw new Error(`Error #11: Неможливо пропарсити число. Вказано: ${size}. Пропарсано: ${enteredSize}`);
            }

            let sizeType: SizeTypeEnum = SizeTypeEnum.None;
            if (size.toUpperCase().indexOf('GB') > 0) {
                sizeType = SizeTypeEnum.GB;
            } else if (size.toUpperCase().indexOf('MB') > 0) {
                sizeType = SizeTypeEnum.MB;
            }

            switch(sizeType) {
                case SizeTypeEnum.GB: 
                    return enteredSize * 1024 * 1024 * 1024;
                case SizeTypeEnum.MB: 
                    return enteredSize * 1024 * 1024;
                case SizeTypeEnum.None: 
                default:
                    throw new Error(`Error #10: Неможливо визначити розмір тестування. Вказано ${size}!`);
            }
        }
    }


    // static async test(selectedPath: string, size: string, readLine: Readline): Promise<void> {
    static async test(options: ConsoleOptions, readLine: Readline): Promise<void> {
        const selectedPath: string = options.path;
        const size: string = options.size;

        // Перевірити інформацію про диск і вивести на екран.
        const existsPath: boolean = DiskInfoService.checkPath(selectedPath);
            if (!existsPath) {
                throw new Error(`Error #8: Шлях відсутній: ${selectedPath}. Перевірте чи правильно вказано шлях!`);
            }
        DiskInfoService.printDiskInfo(selectedPath);

        // Cтворити папку де буде відбуватися тестування.
        const workPath: string = await HelperService.createTestFolder(options, readLine);

        // Ініціалізуємо пустий список тест файлів.
        const testFileInfoList: TestFileInfo[] = [];

        // Визначаємо розмір зони тестування.
        const maxTestingSize: number = options.type === OptionTypeEnum.OnlyTest
            ? this.getTestFilesSize(workPath) + 4097
            : this.getTestSize(size, selectedPath);
        const progressInfo: ProgressInfo = new ProgressInfo(maxTestingSize - 4097);

        // Створюємо тест файли.
        if (options.type === OptionTypeEnum.All || options.type === OptionTypeEnum.OnlyCreate) {
            let alreadyCreatedTestFileSize: number = 0;
            let testStep: number = 1;

            while (alreadyCreatedTestFileSize <= (maxTestingSize - 4097)) {
                // Перевіряємо кількість вільного місця до створення пустого файла.
                if (!this.hasAvailableSpaceOnTheDisk(selectedPath)) {
                    break;
                }
    
                // Свторити файл за допомогою createFileAndFill;
                const fullPath: string = HelperService.createFile(workPath, testStep);
                
                // Перевіряємо кількість вільного місця після створення пустого файла.
                if (!this.hasAvailableSpaceOnTheDisk(selectedPath)) {
                    break;
                }
    
                let leftFreeSizeOnDisk: number = DiskInfoService.getDiskInfo(selectedPath).free;
                const freeSpaceForTestLeft: number = Math.floor(Math.min(maxTestingSize - alreadyCreatedTestFileSize, leftFreeSizeOnDisk) * RESERVED_SIZE_FOR_AVOIDING_OVERSAVING_DATA);
                let testFileSize: FileSizeEum = HelperService.getFileSizeForTesting(freeSpaceForTestLeft);
    
                // Виконати метод createFileAndTest();
                const testFileInfo: TestFileInfo = await this.createTestFile(testFileSize, fullPath, progressInfo);
                testFileInfoList.push(testFileInfo);
                alreadyCreatedTestFileSize += testFileInfo.fileSize;
                testStep++;
            }
        }    

        if (options.type === OptionTypeEnum.All || options.type === OptionTypeEnum.OnlyTest) {
            if (options.type === OptionTypeEnum.OnlyTest) {
                testFileInfoList.push(...this.scanFilesInFolder(workPath));
            }
            for(let testFileInfo of testFileInfoList) {
                await this.checkTestFile(testFileInfo, progressInfo);
            }
        }

        progressInfo.finish();

        if (options.type === OptionTypeEnum.All) {
            // Видалити папку із файлами де відбувалося тестування.
            IoStructureService.removeFolder(workPath);
        }
        console.log('Перевірка місця відбулося успішло! Натисніть Ctrl+C для виходу із програми!');
    }

    private static getTestFilesSize(workPath: string): number {
        const filesInFolder: string[] = IoStructureService.getFileList(workPath).filter((filePath: string) => filePath.substring(filePath.length-5) === '.data');

        return filesInFolder.reduce((acc: number, filePath: string) => (acc + IoStructureService.getFileSize(filePath)), 0);
    }

    private static scanFilesInFolder(workPath: string): TestFileInfo[] {
        const filesInFolder: string[] = IoStructureService.getFileList(workPath).filter((filePath: string) => filePath.substring(filePath.length-5) === '.data');

        console.log(filesInFolder);

        return this.parseInfoFromFiles(filesInFolder);
        return [];
    }

    private static parseInfoFromFiles(filePaths: string[]): TestFileInfo[] {
        return filePaths.map((filePath: string): TestFileInfo => {
            // Відкриваємо файл для читання (отримуємо файловий дескриптор)
            const fd = fs.openSync(filePath, 'r');
            // Створюємо буфер для зберігання прочитаних байтів
            let buffer = Buffer.alloc(8);

            // Читаємо перші 8 байт із файлу
            fs.readSync(fd, buffer, 0, 8, 0);

            // Витягуємо перші 4 байти
            let valueBuffer = buffer.slice(0, 4);
            // Перетворюємо 4 байти у звичайне число (наприклад, у форматі Big-Endian)
            const startCouter: number = valueBuffer.readUInt32LE(0);

            // Видаляємо з буфера вже оброблені байти
            buffer = buffer.slice(4);
            // Витягуємо настіпні 4 байти
            valueBuffer = buffer.slice(0, 4);
            // Перетворюємо 4 байти у звичайне число (наприклад, у форматі Big-Endian)
            const nextValue: number = valueBuffer.readUInt32LE(0);
            const increaseStep: number = nextValue > startCouter 
                ? nextValue - startCouter
                : nextValue + BLOCK_SIZE - startCouter;

            // Закриваємо файл
            fs.closeSync(fd);

            return new TestFileInfo(
                filePath, 
                startCouter, 
                increaseStep, 
                IoStructureService.getFileSize(filePath),
            );
        });
    }

    private static hasAvailableSpaceOnTheDisk(workPath: string, expectedMinSize: number = FileSizeEum.SIZE_4_KB*2): boolean {
        return DiskInfoService.getDiskInfo(workPath).free > expectedMinSize;
    }

    private static async createTestFile(fileSize: number, fullPath: string, progressInfo: ProgressInfo): Promise<TestFileInfo> {
        

        progressInfo.setInProgressFile(fullPath, fileSize);

        // Наповнити файл інформацією.
        return await this.fillFileInfo(fullPath, fileSize, progressInfo);
    }

    private static async checkTestFile(testFileInfo: TestFileInfo, progressInfo: ProgressInfo): Promise<void> {
        progressInfo.setInProgressFile(testFileInfo.filePath, testFileInfo.fileSize);
        
        // Перевірити файл за допомогою testFile;
        await this.checkFileInfo(testFileInfo, progressInfo);
    }

    private static async fillFileInfo(fullPath: string, fileSize: FileSizeEum, progressInfo: ProgressInfo): Promise<TestFileInfo> {
        const startCouter: number = Math.floor(Math.random() * 10000000000) % BLOCK_SIZE;
        const increaseStep: number = Math.floor(Math.random() * 9 + 1) * 4;

        let currentStep: number = 0;
        let curretSize = currentStep * 4;
        // Створення 4-байтового буфера
        const stream: fs.WriteStream = IoStructureService.createWriteStream(fullPath);
        let writeTime: number = 0;

        return new Promise(async (resolve, reject) => {
            while (fileSize > curretSize) {
                const buffer = Buffer.alloc(4 * 1024);
                for (let subPosition: number = 0; subPosition < 1024; subPosition++) {
                    const nextDataCounter = (startCouter + (currentStep + subPosition) * increaseStep) % BLOCK_SIZE;
                    buffer.writeUInt32LE(nextDataCounter, subPosition * 4);
                }
                const writeToFile = new Promise<void>((resolve, reject) => {
                    if (writeTime % 5 === 0) {
                        setTimeout(() => {
                            stream.write(buffer);
                            resolve();
                        });
                    } else {
                        stream.write(buffer);
                        resolve();
                    }

                    writeTime++;
                });

                await writeToFile;
                progressInfo.increaseWroteSize(4096);
                currentStep += 1024;
                curretSize = currentStep * 4;
            }
    
            stream.end();
    
            stream.on('finish', () => {
                const createdFileSize: number = IoStructureService.getFileSize(fullPath);
                if (createdFileSize !== fileSize) {
                    throw new Error(`Error #14: Розмір створеного файлу і очікуваного розміру файлу відрізняється! createdFileSize: ${createdFileSize}, expectedFileSize: ${fileSize}`);
                }
                setTimeout(() => {
                    resolve(new TestFileInfo(
                        fullPath,
                        startCouter,
                        increaseStep,
                        fileSize,
                    ));
                }, 1000);
            });
              
            stream.on('error', (error) => {
                reject(`Error #9: Помилка запису у файл ${fullPath}. Err: ${error}`);
            });
        });
    }

    static async checkFileInfo(testFileInfo: TestFileInfo, progressInfo: ProgressInfo): Promise<string|void> {
        let currentStep: number = 0;
        let readSize = currentStep * 4;
        let expectedDataCounter: number = 0;
        let increaseStep: number = 0;

        // Буфер для збереження даних
        let buffer = Buffer.alloc(0);
        const readStream: fs.ReadStream = IoStructureService.createReadStream(testFileInfo.filePath);

        return new Promise((resolve, reject) => {

            // Обробка події 'data', яка спрацьовує, коли є доступні дані для читання
            readStream.on('data', (chunk: Buffer) => {
                // Додаємо нові дані до буфера
                buffer = Buffer.concat([buffer, chunk]);

                const bufferSize: number = buffer.length;

                // Поки в буфері є 4 байти, зчитуємо їх
                while (buffer.length >= 4) {
                    // Витягуємо перші 4 байти
                    const valueBuffer = buffer.slice(0, 4);

                    // Перетворюємо 4 байти у звичайне число (наприклад, у форматі Big-Endian)
                    const dataCounterFromFile: number = valueBuffer.readUInt32LE(0);

                    if (currentStep < 2) {
                        if (currentStep === 0) {
                            expectedDataCounter = dataCounterFromFile;
                            if (dataCounterFromFile !== testFileInfo.startCouter) {
                                throw new Error(`Error #15: Стартова число у файлі відрізняється від запланованого числа у тесті. File startCouter: ${dataCounterFromFile}, Expected startCouter: ${testFileInfo.startCouter}, Файл: ${testFileInfo.filePath}`);
                            }
                        } else {
                            if (dataCounterFromFile < testFileInfo.startCouter) {
                                increaseStep = dataCounterFromFile + BLOCK_SIZE - expectedDataCounter;
                            } else {
                                increaseStep = dataCounterFromFile - expectedDataCounter;
                            }
                            // increaseStep = dataCounterFromFile - expectedDataCounter;
                            expectedDataCounter = dataCounterFromFile % BLOCK_SIZE;
                            if (increaseStep !== testFileInfo.increaseStep) {
                                throw new Error(`Error #16: Крок підвищення у файлі відрізняється від запланованого кроку у тесті. File startCouter: ${increaseStep}, Expected startCouter: ${testFileInfo.increaseStep}, Файл: ${testFileInfo.filePath}`);
                            }
                        }
                    } else {
                        expectedDataCounter = (expectedDataCounter + increaseStep) % BLOCK_SIZE;
                        if (expectedDataCounter !== dataCounterFromFile) {
                            reject(`Error #6: Дані із файлом не співпадають! Очікується число ${expectedDataCounter}. Отримане число ${dataCounterFromFile}. increaseStep: ${increaseStep}. currentStep: ${currentStep}`);
                            return;
                        }

                        // Якщо помилка буде знайдена під час виконання вивести на екран інформацію.
                        // ToDo;
                    }

                    currentStep++;
                    readSize = currentStep * 4;

                    if (readSize > testFileInfo.fileSize) {
                        reject(`Error #7: Файл мітить більше данних ніж очікувалося. Прочитано байт: ${readSize}. Очікується: ${testFileInfo.fileSize}!`);
                        return;
                    }

                    // Видаляємо з буфера вже оброблені байти
                    buffer = buffer.slice(4);
                }

                progressInfo.increaseReadSize(bufferSize);
            });

            // Обробка події 'end', яка спрацьовує, коли весь файл прочитано
            readStream.on('end', () => {
                resolve();
            });
            readStream.on('error', (error: string) => {
                reject(error);
            });
        });
    }
}