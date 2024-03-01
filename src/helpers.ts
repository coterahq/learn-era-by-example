import { DuckDbNativeDriver } from "@cotera/nasty-drivers";

export const CHANGE_ME = (..._vars: any[]) => {
  const err = new Error("CHANGE ME");
  if ((Error as any).captureStackTrace) {
    (Error as any).captureStackTrace(err, CHANGE_ME);
  }
  throw err;
};

export const db = () => DuckDbNativeDriver.emphemeral();
