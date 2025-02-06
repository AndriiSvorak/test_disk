import {checkSync, DiskUsage} from 'diskusage';
import { IoStructureService } from './io-structure.service.js';

export class DiskInfoService {
    static getDiskInfo(path: string): DiskUsage {
        try {
            const { available, free, total } = checkSync(path);
    
            return {
                available,
                free,
                total,
            }
        } catch (err: any) {
            throw 'Error #1: Помилка при отриманні інформації про диск: ${err.message}';
        }
    }

    static printDiskInfo(selectedPath: string) {
        const {free, available, total} = this.getDiskInfo(selectedPath);

        console.log(`Загальний обсяг диску: ${total / (1024 * 1024 * 1024)} ГБ`);
        console.log(`Вільний обсяг диску: ${free / (1024 * 1024 * 1024)} ГБ`);
        console.log(`Доступний обсяг диску: ${available / (1024 * 1024 * 1024)} ГБ`);
    }

    static checkPath(selectedPath: string): boolean {
        return IoStructureService.existsPath(selectedPath);
    }
}
