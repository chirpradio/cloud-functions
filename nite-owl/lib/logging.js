function createWithGlobal(globals) {
  return (severity) => {
    return (message) => {
      const logEntry = Object.assign(
        {
          severity,
          message,
        },
        globals
      );
      console.log(JSON.stringify(logEntry));
    };
  };
}
let logger = undefined;

function getLogger(component) {
  return (req) => {
    if (logger && !req && logger.req) {
      return logger;
    }
    const project = process.env.GOOGLE_PROJECT_ID;
    // Build structured log messages as an object.
    const globalLogFields = { component };

    // Add log correlation to nest all log messages beneath request log in Log Viewer.
    // (This only works for HTTP-based invocations where `req` is defined.)
    if (typeof req !== "undefined") {
      const traceHeader = req.header("X-Cloud-Trace-Context");
      if (traceHeader && project) {
        const [trace] = traceHeader.split("/");
        globalLogFields["logging.googleapis.com/trace"] =
          `projects/${project}/traces/${trace}`;
      }
    }
    const logCreator = createWithGlobal(globalLogFields);
    logger = {
      debug: logCreator("DEBUG"),
      info: logCreator("INFO"),
      warn: logCreator("WARNING"),
      error: logCreator("ERROR"),
      req: req,
    };
    return logger;
  };
}

module.exports = {
  getLogger,
};
