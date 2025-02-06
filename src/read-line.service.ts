import { createInterface, Interface } from 'node:readline';

export class Readline {

    private readonly readLine: Interface;

    constructor(
        process: NodeJS.Process,
    ) {
        // Створення інтерфейсу для читання з консолі
        this.readLine = createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }

    // Функція для запитання з відповіддю Y/N
    askYesNoQuestion(query: string) {
        return new Promise((resolve) => {
            this.readLine.question(`${query} (Y/N): `, (answer) => {
                resolve(answer.trim().toUpperCase());
            });
        });
    }
}