import * as fs from 'fs';
import * as path from 'path';

export class IoStructureService {
    static createFolder(workPath: string) {
        // Створення директорії, якщо вона не існує.
        fs.mkdir(workPath, { recursive: true }, (err) => {
            if (err) {
                throw new Error(`Error #2: Помилка при створенні директорії: ${workPath}. Err: ${err}`);
            }
        });
    }

    /**
     * Свторює пустий файл.
     * 
     * @param workPath 
     * @param fileName 
     * @returns 
     */
    static createFile(workPath: string, fileName: string): string {
        // Повний шлях до файлу
        const fullPath = path.join(workPath, fileName);

        // Створення файлу
        fs.writeFile(fullPath, '', (err) => {
            if (err) {
                throw new Error (`Error #3: Помилка при створенні файлу: ${fullPath}. Err: ${err}`);
            }
        });

        return fullPath;
    }

    /**
     * Відкриважємо файл для запису стрімом.
     * 
     * @param fullPath 
     * @returns 
     */
    static createWriteStream(fullPath: string): fs.WriteStream {
        const writeStream: fs.WriteStream = fs.createWriteStream(fullPath);

        writeStream.on('error', (err) => {
            throw new Error(`Error #4: Сталася помилка при записі в файл: ${fullPath}, Err: ${err}`);
        });

        return writeStream;
    }
    
    /**
     * Відкриважємо файл для читання стрімом.
     * 
     * @param fullPath 
     * @returns 
     */
    static createReadStream(fullPath: string): fs.ReadStream {
        const readStream: fs.ReadStream = fs.createReadStream(fullPath);

        readStream.on('error', (err) => {
            throw new Error(`Error #5: Сталася помилка при читанні із файлу: ${fullPath}, Err: ${err}`);
        });

        return readStream;
    }

    static existsPath(selectedPath: string): boolean {
        return fs.existsSync(selectedPath);
    }

    static getFileSize(fullPath: string): number {
        if (!this.existsPath(fullPath)) {
            throw new Error(`Error #12: Неможливо отримати інформацію про файл ${fullPath}. Його не існує!`);
        }

        const stats = fs.statSync(fullPath);
        return stats.size;
    }

    static removeFolder(workPath: string) {
        // Видалення папки рекурсивно
        try {
            fs.rmSync(workPath, { recursive: true, force: true });
        } catch (error) {
            throw new Error(`Error #13: Error removing directory: ${workPath}. Err: ${error}`);
        }
    }

    static getFileList(workPath: string): string[] {
        if (!this.existsPath(workPath)) {
            throw new Error(`Error #18: Неможливо отримати інформацію про файли у папці ${workPath}, якої не існує!`);
        }

        return fs.readdirSync(workPath).map((fileName: string) => path.join(workPath, fileName));
    }
}