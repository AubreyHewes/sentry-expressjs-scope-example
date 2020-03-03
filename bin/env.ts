const fs = require("fs");
const path = require("path");
const DotEnv = require("dotenv");
const DotEnvExpand = require("dotenv-expand");

const paths = {
  dotenv: ".env"
};

const { NODE_ENV } = process.env;
if (!NODE_ENV) {
  throw new Error("The NODE_ENV environment variable is required but was not specified.");
}

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== "test" && `${paths.dotenv}.local`,
  paths.dotenv
]
  .filter(Boolean)
  .map(file => path.resolve(__dirname, "..", file));

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.
// https://github.com/motdotla/dotenv
dotenvFiles.forEach(dotenvFile => {
  // eslint-disable-next-line no-console
  console.log(`Checking dotenv file: ${dotenvFile}`);
  if (fs.existsSync(dotenvFile)) {
    // eslint-disable-next-line no-console
    console.log(`Using dotenv file: ${dotenvFile}`);
    // eslint-disable-next-line import/no-extraneous-dependencies,global-require
    DotEnvExpand(
      DotEnv.config({
        path: dotenvFile
      })
    );
  }
});
