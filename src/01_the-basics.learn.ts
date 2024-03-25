import { Asc, Desc, Eq, From, Relation, Ty, Values } from "@cotera/era";
import { test, expect, describe } from "vitest";
import { db } from "./helpers";

// Welcome to ERA, a cross warehouse, type checked, unit testable analytics
// library for building data applications.

test("Using era to generate SQL", () => {
  // ERA can be used to generate data{base, warehouse} specific SQL. Era
  // ships with a SQL generator that supports many different dialects.

  const Tab = From({
    schema: "some_schema",
    name: "some_table_name",
    attributes: {
      foo: "string",
      bar: "int",
    },
  }).where((t) => t.attr("bar").gt(2));

  expect(Tab.postgresSql.sql).toEqual(
    'select "bar" as "bar", "foo" as "foo" from "some_schema"."some_table_name" where ("bar" > 2)',
  );

  expect(Tab.bigQuerySql.sql).toEqual(
    "select `bar` as `bar`, `foo` as `foo` from `some_schema`.`some_table_name` where (`bar` > 2)",
  );

  expect(Tab.snowflakeSql.sql).toEqual(
    'select "bar" as "bar", "foo" as "foo" from "some_schema"."some_table_name" where ("bar" > 2)',
  );

  expect(Tab.redshiftSql.sql).toEqual(
    'select "bar" as "bar", "foo" as "foo" from "some_schema"."some_table_name" where ("bar" > 2)',
  );
});

test("Introduction to the type checker", () => {
  // A really powerful part of era is that it ships with a _full_ relational
  // algebra type checker. ERA's goal is to be able to tell if a query is
  // valid _before_ running it. This allows for fast feedback on how a
  // potential change will affect your entire pipeline.

  const Orders = From({
    schema: "public",
    name: "orders",
    attributes: {
      // ERA keeps track of nullability
      customer_id: { ty: "int", nullable: false },
      // The `Ty` library has helpful type manipulation helpers
      quantity: Ty.nn("int"),
    },
  });

  const Customers = From({
    schema: "public",
    name: "customers",
    attributes: { id: Ty.nn("int"), state: "string" },
  });

  // ERA will keep track of the attributes a relation has and calculates the
  // resulting types of each operation. ERA models the full expression
  // language, joins, windows, and aggregates.
  //
  // All of this information is available to tooling, unit testing, and meta
  // programming. Making changes on your data sources will show the type errors
  // all the way up to your visualization layer ands reverse ETL processes! Never
  // again wonder what will break when you change a foundational model.
  const CustomerOrderStats = Customers.leftJoin(Orders, (customer, orders) => ({
    on: Eq(customer.attr("id"), orders.attr("customer_id")),
    select: {
      ...customer.star(),
      ...orders.pick("quantity"),
    },
  }));

  // ERA analyzed the join and figures out the types of the output relation
  // (including nullability!)
  expect(CustomerOrderStats.attributes).toEqual({
    id: Ty.nn("int"),
    state: Ty.ty("string"),
    quantity: Ty.nn("int"),
  });

  // The ERA type checker will analyze your relations and give you instant
  // feedback if something you're doing is invalid.
  //
  expect(() =>
    CustomerOrderStats.select((t) => ({
      ...t.pick("id", "state", "oops_invalid_attribute!"),
    })),
  ).toThrowError(
    // Error messages include helpful tips! For example a missing attribute
    // lists out all the attributes that _do_ exist (with their types)
    `NoSuchAttribute - "oops_invalid_attribute!" does not exist in 
(
  "id" int NOT NULL,
  "state" string,
  "quantity" int NOT NULL
)
`,
  );
});

test("Introducing the `Values` clause", async () => {
  // ERA has good interop with Javascript values. One thing it implements for
  // every warehouse is `Values`, which are a way of treating Javascript objects like rows.
  // This can be a handy Swiss Army Knife to move small tables around and write unit tests.

  // Here we're setting `SomeData` to be a `Relation` that's a values clause
  const SomeData = Values([{ n: 1 }, { n: 2 }]);

  // ERA will infer the type of `SomeData` to be a table with a single column
  // named `n` of type `"int"`
  expect(SomeData.attributes).toEqual({ n: Ty.nn("int") });

  // We can see the SQL this compiles to.
  expect(SomeData.postgresSql.sql).toEqual(
    '(select arg_0 as "n" from (values (1), (2)) as vals(arg_0))',
  );
  expect(SomeData.snowflakeSql.sql).toEqual(
    `select cast(value['n'] as integer) as "n" from table (flatten(input => parse_json((:1))))`,
  );
  // etc...

  // Any relation (including `Values`) can be executed on a database connection
  // by using the `.execute` method
  //
  // This is running on an in memory DuckDB instance
  const res = await Values([{ n: 1 }, { n: 2 }]).execute(db());
  expect(res).toEqual([{ n: 1 }, { n: 2 }]);
});

describe(Relation.name, () => {
  // This section explores a core ERA concept called `Relation`. Relations
  // are similar to "tables" in SQL, they have one or more columns that have
  // names and types. They represent 0 or more rows that have those types
  //
  // Relations are immutable, all operations return new relations without
  // affecting the old relation.

  test("the `.select` method", async () => {
    // The select method is used to "project" the relation into another
    // relation. This involves creating new columns which are functions of the
    // old columns.

    // We can use the `.select` method to create a pipeline of operations
    const Pipeline =
      // We start from some table
      From({
        name: "foo",
        schema: "bar",
        attributes: { a: "int", b: "int", c: "int" },
      })
        // We can use `t.star()` which is roughly the same as `select * from ...`
        .select((t) => ({ ...t.star() }))
        // The "select" API works with a regular old Javascript object, so you
        // can use spreading or other object functionality to decide what attributes you want
        //
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        .select((t) => ({
          // This "spreads" * into the new attributes
          ...t.star(),
          // This creates a new attribute called "d" with a value of 1
          d: 1,
          // This creates a new attribute called "better_a" that is equal to
          // the previous relations's "a" attribute +1
          better_a: t.attr("a").add(1),
        }))
        // We can "pick" just the attributes we want, ERA has access to the
        // type check information after every select, so it can use that to both
        // typecheck and dyanmicly adjust the columns selected
        .select((t) => ({ ...t.pick("a", "b", "d") }))
        // We can also do the "reverse" of `.pick` with `.except`, which
        // returns all the attributes _except_ the selected attributes
        .select((t) => ({ ...t.except("b") }))
        // ERA makes bulk renaming a breeze
        .select((t) => ({
          ...t.renameWith((oldName) => `some_prefix_${oldName}`),
        }))
        // ERA supports `distinct` in `.select`
        .select((t) => ({ ...t.star() }), { distinct: true });

    expect(Pipeline.attributes).toEqual({
      some_prefix_a: Ty.ty("int"),
      some_prefix_d: Ty.nn("int"),
    });
  });

  test("the `.where` method", async () => {
    // The `Relation`'s `.where` method allows for filtering relations

    // Imagine we have 3 rows, each with one attribute named "foo" which is an integer
    const SomeData = Values([{ foo: 1 }, { foo: 10 }, { foo: 100 }]);

    // By default all three rows are included
    expect(await SomeData.execute(db())).toHaveLength(3);

    // We can use the `.where` clause to filter the rows where "foo" is not
    // greater than 5
    expect(
      await SomeData.where((t) => t.attr("foo").gt(5)).execute(db()),
    ).toEqual([{ foo: 10 }, { foo: 100 }]);

    // We can chain multiple where clauses
    expect(
      await SomeData.where((t) => t.attr("foo").gt(5))
        .where((t) => t.attr("foo").lt(20))
        .execute(db()),
    ).toEqual([{ foo: 10 }]);
  });

  test("the `.orderBy` method", async () => {
    // You can sort relations using `Asc` and `Desc`
    const SomeData = Values([{ foo: 1 }, { foo: 10 }, { foo: 100 }]);

    expect(
      await SomeData.orderBy((t) => Asc(t.attr("foo"))).execute(db()),
    ).toEqual([{ foo: 1 }, { foo: 10 }, { foo: 100 }]);

    expect(
      await SomeData.orderBy((t) => Desc(t.attr("foo"))).execute(db()),
    ).toEqual([{ foo: 100 }, { foo: 10 }, { foo: 1 }]);

    // Alternatively the `.select` method provides a `orderBy` parameter
    expect(
      await SomeData.select((t) => t.star(), {
        orderBy: (t) => Desc(t.attr("foo")),
      }).execute(db()),
    ).toEqual([{ foo: 100 }, { foo: 10 }, { foo: 1 }]);

    // NOTE: sorts do not automatically propogate through multiple CTEs.
    // Warehouses are allowed to (and do in practice) ignore sorts that aren't
    // top level. ERA SQL gen may eventually add more `sort` guarantees, but
    // currently makes no effort to preserve sorts that aren't top level
  });

  test("the `.limit` method", async () => {
    const SomeData = Values([{ foo: 1 }, { foo: 10 }, { foo: 100 }]);

    // This table has 3 rows
    expect(await SomeData.execute(db())).toHaveLength(3);

    // We can limit the respose using the `.limit` method
    expect(await SomeData.limit(1).execute(db())).toHaveLength(1);

    // Alternatively, we can add the `limit` parameter in a `.select`
    expect(
      await SomeData.select((t) => t.star(), {
        limit: 1,
        offset: 1,
        orderBy: (t) => Asc(t.attr("foo")),
      }).execute(db()),
    ).toEqual([{ foo: 10 }]);

    // As an advanced feature we provied `assertLimit` which fails the query if
    // there are more rows in the underlying relation than the limit
    expect(await SomeData.assertLimit(10).execute(db())).toHaveLength(3);

    // This fails the query while the query is running, meaning you can use it
    // to fail transactions that have an unexpected number of rows
    await expect(SomeData.assertLimit(1).execute(db())).rejects.toThrow(
      "Invariant *LIMIT IS BELOW 1* failed!",
    );
  });
});
