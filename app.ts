import express, { Request, Response, NextFunction } from "express";
import createError, { HttpError } from "http-errors";
import * as Sentry from "@sentry/node";
import path from "path";
import helmet from "helmet";
import bodyParser from "body-parser";
import logger from "morgan";
import favicon from "serve-favicon";
import compression from "compression";
import fallback from "express-history-api-fallback";

const __DEV__ = process.env.NODE_ENV === "development";

const app = express();

if (process.env.SENTRY_PUBLIC_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_PUBLIC_DSN,
    environment: (process.env.NODE_ENV ?? "development").toUpperCase(),
    release: (process.env.GIT_COMMIT || "CI=0").substring(0, 12)
  });
  // Clear the Sentry scope as the first middleware on the the app
  app.use((req: Request, res: Response, next: NextFunction) => {
    Sentry.configureScope(scope => {
      scope.clear();
    });
    next();
  });
  // The Sentry request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
}

if (process.env.TRUST_PROXY) {
  app.set("trust proxy", process.env.TRUST_PROXY);
}
app.disable("x-powered-by");
app.use(helmet());

app.use(compression());

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.use(logger(__DEV__ ? "dev" : "combined"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const root = path.join(__dirname, "public");
app.use(
  express.static(root, {
    maxAge: "365d"
  })
);
app.use(fallback("index.html", { root }));

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404, "Not Found"));
});

if (process.env.SENTRY_PUBLIC_DSN) {
  // The Sentry error handler must be before any other (final) error middleware
  app.use(Sentry.Handlers.errorHandler());
}

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    message: res.locals.message,
    error: res.locals.error
  });
});

export default app;
