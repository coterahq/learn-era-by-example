import { Asc, Desc, Values } from "@cotera/nasty";
import { db, CHANGE_ME } from "./helpers";
import { describe, test, expect } from "vitest";

const data = [
  { a: 1, b: "Foo" },
  { a: 2, b: "Bar" },
  { a: 3, b: "Baz" },
];

describe("selecting", () => {
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

describe("filtering", () => {
  test.skip("only rows where a >= 2", async () => {
    const query = Values(data).where((t) => t.attr("a").lte(10));

    expect(await query.execute(db())).toEqual([
      { a: 2, b: "bar" },
      { a: 3, b: "baz" },
    ]);
  });
});

describe("sort", () => {
  test.skip("sort with a limit", async () => {
    const query = Values(data).orderBy((t) => Asc(t.attr("a")), { limit: 10 });
    expect(await query.execute(db())).toHaveLength(2);
  });

  test.skip("sort with a desc", async () => {
    const query = Values(data).orderBy((_t) => CHANGE_ME());

    expect(await query.execute(db())).toEqual([
      { a: 3, b: "Baz" },
      { a: 2, b: "Bar" },
      { a: 1, b: "Foo" },
    ]);
  });

  test.skip('order on "a" < 2 DESC AND "b" ASC', async () => {
    const query = Values(data).orderBy((t) => [
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

describe("limit", () => {
  test.skip("add a limit", async () => {
    const Data = Values([1, 2, 3, 4, 5].map((n) => ({ n }))).limit(CHANGE_ME());
    expect(await Data.execute(db())).toHaveLength(4);
  });
});
