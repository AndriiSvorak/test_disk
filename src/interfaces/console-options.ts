import { OptionValues } from "commander";
import { OptionTypeEnum } from "src/enums/option-type.enum";

export interface ConsoleOptions extends OptionValues {
    type: OptionTypeEnum;
    path: string;
    size: string;
}