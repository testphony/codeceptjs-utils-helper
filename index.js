
const requireg = require('requireg');
const { Timer } = require('@kronoslive/codeceptjs-utils');
const Ajv = require('ajv');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const codeceptjsPath = path.resolve(global.codecept_dir, './node_modules/codeceptjs');
const codeceptjs = requireg(codeceptjsPath);
const config = codeceptjs.config.get();
const { skipLongData } = require('@kronoslive/codeceptjs-utils');
const { ajvSortCheck } = require('@kronoslive/codeceptjs-utils');
const { walkSync } = require('@kronoslive/codeceptjs-utils');

const ajv = new Ajv({ verbose: true, allErrors: config.mocha.reporterOptions['codeceptjs/lib/reporter/cli'].options.verbose, v5: true });
require('ajv-merge-patch')(ajv);

let mochawesome;

/**
 * Хэлпер с различными утилитами (например методы для работы с ajv).
 */
class Utils extends Helper {
  /**
   *
   * @param {object} config
   */
  constructor(config) {
    super(config);
    this._validateConfig(config);
  }

  /**
   *
   * @param {object} config
   * @private
   */
  _validateConfig(config) {
    this.options = {
      waitForTimeout: 3000, // ms
      waitForInterval: 500, // ms
    };
    this.schemasLoad = false;

    Object.assign(this.options, config);
  }

  /**
   *
   * @returns {boolean}
   * @private
   */
  _beforeSuite() {
    mochawesome = this.helpers.Mochawesome;
    if (!this.schemasLoad) this._loadJSONSchemas();
    return true;
  }

  _finishTest() {
    const htmlPath = `${path.join(
      global.codecept_dir,
      `${config.mocha.reporterOptions.mochawesome.options.reportDir}`,
    )}/${config.mocha.reporterOptions.mochawesome.options.reportFilename}.html`;
    if (fs.existsSync(htmlPath)) {
      const data = fs.readFileSync(htmlPath, 'utf-8');
      const newValue = data.replace(
        '<head>',
        `<head><script type="text/javascript">    
                    setTimeout(() => {if (top.location!= self.location) {
                        window.parent.document.getElementById("tab-content-of-results") ? 
                        window.parent.document.getElementById("tab-content-of-results").getElementsByTagName("iframe")[0].style.height = '20000px' :
                        window.parent.document.getElementById("tab-content-of-test_results").getElementsByTagName("iframe")[0].style.height = '20000px';
                    }}
                        , 3000); </script>`,
      );
      fs.writeFileSync(htmlPath, newValue, 'utf-8');
    }
    return true;
  }

  _failed() {

  }

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
  seeDataHasValidJsonSchema(schema, params = [], data) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    let schemaJson = require(path.join(global.codecept_dir, `./schemas/${schema}`));
    if (typeof schemaJson === 'function') {
      schemaJson = schemaJson.apply(this, params);
    }
    const valid = ajv.validate(schemaJson, data);
    if (!valid) {
      mochawesome.addMochawesomeContext({
        title: `Json schema for ${schema}`,
        value: JSON.stringify(schemaJson, null, 2),
      });
      const report = ajv.errors;
      report.forEach((err, index) => {
        report[index].data = skipLongData(report[index].data);
        delete report[index].parentSchema;
        delete report[index].schema;
        if (err.keyword === '$merge') {
          report[index] = {
            dataPath: err.dataPath,
            keyword: err.keyword,
            schemaPath: err.schemaPath,
            message: 'should pass $merge keyword validation. Skip Data Show',
          };
        }
      });
      mochawesome.addMochawesomeContext({
        title: 'Json schema errors',
        value: report,
      });
    }
    assert.ok(valid, 'Find JSON schema errors. See additional context for more details');
  }

  /**
   * Load custom keywords and all json schemas from schemas folder
   * @private
   */
  _loadJSONSchemas() {
    if (fs.existsSync(path.join(global.codecept_dir, './schemas/'))) {
      let files = walkSync(path.join(global.codecept_dir, './schemas/'));
      Object.keys(ajvSortCheck).forEach((keyword) => {
        ajv.addKeyword(keyword, ajvSortCheck[keyword]);
      });

      files = files.filter((file) => file.indexOf('.json') + 5 === file.length);
      files.forEach((file) => {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        ajv.addSchema(require(path.join(global.codecept_dir, `./schemas/${file}`)), file);
      });
    }
    this.schemasLoad = true;
  }

  /**
   * Метод ожидает выполнение условия в установленный таймаут. Проверяем выполнение условие через интервал.
   * @param {function} condition
   * @param {number} timeout
   * @param {string} timeoutMsg
   * @param {number} interval
   * @returns {*}
   */
  waitUntil(condition, timeout, timeoutMsg = 'timeout', interval) {
    if (typeof timeout !== 'number') {
      timeout = this.options.waitForTimeout;
    }

    if (typeof interval !== 'number') {
      interval = this.options.waitForInterval;
    }

    let fn;

    if (typeof condition === 'function') {
      fn = condition.bind(this);
    } else {
      fn = () => Promise.resolve(condition);
    }

    const timer = new Timer(interval, timeout, fn, true, true);

    return timer.catch((e) => {
      if (e.message === 'timeout' && typeof timeoutMsg === 'string') {
        throw new Error(timeoutMsg);
      }

      if (e.type === 'NoSuchElement') {
        throw new Error(e.message);
      }

      throw new Error(`Promise was rejected with the following reason: ${e.message}`);
    });
  }

  wait(milliseconds = 1000) {
    const promise = new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, milliseconds);
    });
    return promise;
  }
}

module.exports = Utils;
