import {
  Avg,
  Count,
  CountDistinct,
  Max,
  Median,
  Min,
  Sum,
  Values,
} from "@cotera/nasty";
import { HOCKEY_DATA } from "./datasets/hockey";
import { db } from "./helpers";

describe("Aggregates", () => {
  describe("summary", () => {
    test("summary", async () => {
      const query = Values(HOCKEY_DATA).summary((t) => {
        return {
          TeamCount: Count(),
          ConferenceCount: CountDistinct(t.attr("conference")),
          TotalWins: Sum(t.attr("wins")),
          AvgWins: Avg(t.attr("wins")),
          MinWins: Min(t.attr("wins")),
          MaxWins: Max(t.attr("wins")),
          MedianWins: Median(t.attr("wins")),
        };
      });
      expect(await query.execute(db())).toEqual([
        { AvgWins: 2, count: 3, max: 3, min: 1, sum: 6 },
      ]);
    });

    // Section Goals
    //
    // 0. Learn how to group by no attributes
    // 1. Learn how to use `.summary` shorthand
    //
    test.skip("grouping on no attributes", () => {});
  });
});
