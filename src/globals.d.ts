// esbuild substitutes process.env.COVELY_TARGET at build time. Declared here
// so checkJs doesn't complain about referencing it from JS source.
declare const process: {
  env: {
    COVELY_TARGET: "extension" | "web";
    COVELY_VERSION: string;
  };
};
