import { Relation, Ty } from "@cotera/nasty";
import { PGlite } from "@electric-sql/pglite";

const pg = new PGlite();

export const CHANGE_ME = () => {
	const err = new Error("CHANGE ME");
	if ((Error as any).captureStackTrace) {
		(Error as any).captureStackTrace(err, CHANGE_ME);
	}
	throw err;
};

class TestDb {
	async execute(relation: Relation): Promise<Record<string, Ty.Literal>[]> {
		const { sql, params } = relation.postgresSql;
		if (params.length > 0) {
			throw new Error(`TODO: Deal with parameters ${params}`);
		}
		const res = pg.query(sql);
		return res as any;
	}
}

export const db = () => new TestDb();
