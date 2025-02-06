import {createCommand} from 'commander';
import { TestDiskService } from './test-disk.service.js';
import { Readline } from './read-line.service.js';
import { ExitError } from './exit-error.js';
import { ConsoleOptions } from './interfaces/console-options.js';

// Error #18:

const program = createCommand();
program
    .version('1.0.0')
    .description('Check disk free space')
    .option('-p, --path <string>', 'Path to disk place')
    .option('-s, --size <string>', 'Size of testing. Could be selected some size like: <3GB> or <10MB> or <full_free_size>', 'full_free_size')
    .option('-t, --type <string>', 'Type of testing: <all> - Do create files and test them; <only_create> - Do only create file, without testing; <only_test> - Do testing already created files', 'all')
    .parse(process.argv);

const options: ConsoleOptions = program.opts();

const readLine: Readline = new Readline(process);


try {
    if (readLine) {
        const answer = await readLine.askYesNoQuestion(`Дійсно бажаєте запуститиперевірку диска?`);
        if (answer === 'Y') {
            await TestDiskService.test(options, readLine);
        }
    }
} catch(error) {
    if (error instanceof ExitError) {
        console.log(error.message);
        process.exit(0);
    } else {
        console.error(error);
        process.exit(1);
    }
}
