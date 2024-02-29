import { Asc, Values } from "@cotera/nasty";
import { db, CHANGE_ME } from "./helpers";
import { describe, test, expect } from "vitest";

describe("Window Functions", () => {
	// Section Goals
	//
	// 1. Use Rank
	// 2. Use Lead/Lag
	// 3. Partition By
	test.skip("Lead/Lag", async () => {
		const data = [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }];

		const query = Values(data)
			.select((t) => {
				const a = t.attr("a");

				return {
					a,
					lead: CHANGE_ME(),
					lag: CHANGE_ME(),
				};
			})
			.sort((t) => Asc(t.attr("a")));

		expect(await query.execute(db())).toEqual([
			{ a: 1, lead: 2, lag: null },
			{ a: 2, lead: 3, lag: 1 },
			{ a: 3, lead: 4, lag: 2 },
			{ a: 4, lead: null, lag: 3 },
		]);
	});

	test.skip("partiton by", () => {});
});
