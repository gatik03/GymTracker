/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");

// Use the installed compiler so these checks also run on Node 20.
const filename = require.resolve("../src/lib/apiErrors.ts");
const compiled = new Module(filename, module);
compiled.paths = module.paths;
compiled._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { getApiFieldErrors, getApiErrorMessage } = compiled.exports;

const apiError = (data) => ({ isAxiosError: true, response: { data } });

test("DRF field errors keep their field names and exclude general errors", () => {
  const error = apiError({
    weight: ["Weight must be positive."],
    date: "An entry already exists for this date.",
    detail: "Request rejected.",
    non_field_errors: ["Duplicate entry."],
    ignored: null,
  });
  assert.deepEqual(getApiFieldErrors(error), {
    weight: "Weight must be positive.",
    date: "An entry already exists for this date.",
  });
  assert.equal(getApiErrorMessage(error, "Failed"), "Request rejected.");
});

test("network errors and malformed responses do not become field errors", () => {
  for (const error of [null, new Error("private server details"), apiError(null), apiError("not JSON"), apiError(["error"])]) {
    assert.deepEqual(getApiFieldErrors(error), {});
  }
  assert.equal(getApiErrorMessage(new Error("private server details"), "Try again"), "Try again");
});
