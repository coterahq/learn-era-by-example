import { DuckDbNativeDriver } from "@cotera/nasty-drivers";

export const CHANGE_ME = () => {
	const err = new Error("CHANGE ME");
	Error.captureStackTrace(err, CHANGE_ME);
	throw err;
};

export const db = () => DuckDbNativeDriver.emphemeral();
