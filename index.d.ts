export = Utils;
/**
 * Хэлпер с различными утилитами (например методы для работы с ajv).
 */
declare class Utils {
    /**
     *
     * @param {object} config
     */
    constructor(config: object);
    /**
     *
     * @param {object} config
     * @private
     */
    private _validateConfig;
    options: {
        waitForTimeout: number;
        waitForInterval: number;
    };
    schemasLoad: boolean;
    /**
     *
     * @returns {boolean}
     * @private
     */
    private _beforeSuite;
    _finishTest(): boolean;
    _failed(): void;
    /**
     * Validate that latest ws response message has specified JSON schema.
     * @param {string} schema - path to JSON schema file. is relative to schemas folder
     * @param {array} params
     * @param {*} data - specify data that should be validated
     *
     * ```
     * I.seeResponseHasValidJsonSchema('authPassed.json', {something: "value"});
     * ```
     */
    seeDataHasValidJsonSchema(schema: string, params: any[], data: any): void;
    /**
     * Load custom keywords and all json schemas from schemas folder
     * @private
     */
    private _loadJSONSchemas;
    /**
     * Метод ожидает выполнение условия в установленный таймаут. Проверяем выполнение условие через интервал.
     * @param {function} condition
     * @param {number} timeout
     * @param {string} timeoutMsg
     * @param {number} interval
     * @returns {*}
     */
    waitUntil(condition: Function, timeout: number, timeoutMsg: string, interval: number): any;
    wait(milliseconds?: number): any;
}
