import { Asc, Desc, Values } from "@cotera/nasty";
import { db, CHANGE_ME } from "./helpers";
import { describe, test, expect } from "vitest";

const data = [
  { a: 1, b: "Foo" },
  { a: 2, b: "Bar" },
  { a: 3, b: "Baz" },
];

describe("The basics", () => {
  describe("selecting", () => {
    // Section Goals
    //
    // 0. Learn how to change `test.skip` to `attempt` to run a koan
    // 1. Learn how to use `t.star()` to get all the attributes of relation
    // 2. Learn how to use `t.attr('foo')` to get attribute `'foo'`
    // 3. Learn how to _create_ new attributes
    // 4. Learn how to rename an existing attribute
    // 5. Learn how to rename _all_ attributes

    test("learn to complete an example", async () => {
      const query = Values(data).select((t) => {
        return CHANGE_ME(t);
        // Hint: here's the answer
        // return {
        //   a: t.attr('a'),
        //   b: t.attr('b')
        // }
      });

      expect(await query.execute(db())).toEqual([
        { a: 1, b: "Foo" },
        { a: 2, b: "Bar" },
        { a: 3, b: "Baz" },
      ]);
    });

    test.skip("select star", async () => {
      const query = Values(data).select((t) => {
        return CHANGE_ME(t);
      });

      expect(await query.execute(db())).toEqual([
        { a: 1, b: "Foo" },
        { a: 2, b: "Bar" },
        { a: 3, b: "Baz" },
      ]);
    });

    test.skip("select a particular attribute", async () => {
      const query = Values(data).select((t) => {
        return { a: t.attr("CHANGE ME!") };
      });

      expect(await query.execute(db())).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
    });

    test.skip("rename an attribute", async () => {
      const query = Values(data).select((t) => {
        return { CHANGE_ME: t.attr("a") };
      });

      expect(await query.execute(db())).toEqual([
        { some_new_name: 1 },
        { some_new_name: 2 },
        { some_new_name: 3 },
      ]);
    });

    test.skip("rename all attributes", async () => {
      const query = Values(data).renameAttributes(
        (oldName) => `${oldName}_CHANGE_ME`,
      );

      expect(await query.execute(db())).toEqual([
        { a_some_suffix: 1, b_some_suffix: "Foo" },
        { a_some_suffix: 2, b_some_suffix: "Bar" },
        { a_some_suffix: 3, b_some_suffix: "Baz" },
      ]);
    });

    test.skip("create a new attribute", async () => {
      const query = Values(data).select((_t) => {
        return { new_1: 1, new_2: 2 };
      });

      expect(await query.execute(db())).toEqual([
        { new_1: 1, new_2: 2, new_3: 3 },
        { new_1: 1, new_2: 2, new_3: 3 },
        { new_1: 1, new_2: 2, new_3: 3 },
      ]);
    });

    test.skip("create a new attribute and propogate all existing attributes", async () => {
      const query = Values(data).select((t) => {
        return { ...t.star(), new_1: 1 };
      });

      expect(await query.execute(db())).toEqual([
        { a: 1, b: "Foo", new_1: 1, new_2: "hi" },
        { a: 2, b: "Bar", new_1: 1, new_2: "hi" },
        { a: 3, b: "Baz", new_1: 1, new_2: "hi" },
      ]);
    });
  });

  describe("scalar expressions", () => {
    // Section goals
    //
    // 0. Learn how to do math on constants
    // 1. Learn hot to use `Constant`
    // 2. Learn how to use comparisions `(lte, gte, gt, lt, eq, neq)`
    // 3. Learn to use Not
    // 4. Learn how to use string functions (lower, upper, like, concat)
    // 5. Learn how to use `and` `or`

    test.skip("string functions", async () => {
      const query = Values(data).select((t) => {
        const b = t.attr("b");

        return {
          b,
          starts_with_b: CHANGE_ME(),
          upper_case_b: CHANGE_ME(),
          lower_case_b: CHANGE_ME(),
          b_with_suffix: CHANGE_ME(),
        };
      });

      expect(await query.execute(db())).toEqual([
        {
          b: "Foo",
          b_with_suffix: "Foo_suffix",
          lower_case_b: "foo",
          starts_with_b: false,
          upper_case_b: "FOO",
        },
        {
          b: "Bar",
          b_with_suffix: "Bar_suffix",
          lower_case_b: "bar",
          starts_with_b: true,
          upper_case_b: "BAR",
        },
        {
          b: "Baz",
          b_with_suffix: "Baz_suffix",
          lower_case_b: "baz",
          starts_with_b: true,
          upper_case_b: "BAZ",
        },
      ]);
    });
  });

  describe("filtering", () => {
    // Section goals
    //
    // 1. Learn how to use `.filter` to limit rows
    test.skip("only rows where a >= 2", async () => {
      const query = Values(data).filter((t) => t.attr("a").lte(10));

      expect(await query.execute(db())).toEqual([
        { a: 2, b: "bar" },
        { a: 3, b: "baz" },
      ]);
    });
  });

  describe("sort", () => {
    // Section goals
    //
    // 0. Sort with a limit
    // 1. Sort on an attribute
    // 2. Use `Asc` and `Desc` to sort in a particular direction

    test.skip("sort with a limit", async () => {
      const query = Values(data).sort((t) => Asc(t.attr("a")), { limit: 10 });
      expect(await query.execute(db())).toHaveLength(2);
    });

    test.skip("sort with a desc", async () => {
      const query = Values(data).sort((_t) => CHANGE_ME());

      expect(await query.execute(db())).toEqual([
        { a: 3, b: "Baz" },
        { a: 2, b: "Bar" },
        { a: 1, b: "Foo" },
      ]);
    });

    test.skip('sort on "a" < 2 DESC AND "b" ASC', async () => {
      const query = Values(data).sort((t) => [
        Desc(t.attr("a").lt(2)),
        Desc(t.attr("b")),
      ]);

      expect(await query.execute(db())).toEqual([
        { a: 1, b: "Foo" },
        { a: 3, b: "Baz" },
        { a: 2, b: "Bar" },
      ]);
    });
  });

  describe("join", () => {
    // Section goals
    //
    // 0. Inner Join
    // 2. Left Join
    // 3. Right Join
    // 4. Deal with attributes that are in both sides of the join

    const Users = Values([
      { id: 1, name: "Kendra" },
      { id: 2, name: "TJ" },
      { id: 3, name: "Ibby" },
      { id: 4, name: "Tom" },
      { id: 5, name: "Grant" },
    ]);

    const Preferences = Values([
      { user_id: 1, fav_color: "blue" },
      { user_id: 3, fav_color: "red" },
    ]);

    test.skip("inner join two tables", async () => {
      const query = Users.leftJoin(Preferences, (user, preference) => ({
        on: CHANGE_ME(),
        select: {
          ...user.star(),
          ...preference.except("user_id"),
        },
      }));

      expect(await query.execute(db())).toEqual([
        { fav_color: "blue", id: 1, name: "Kendra" },
        { fav_color: "red", id: 3, name: "Ibby" },
      ]);
    });
  });
});
