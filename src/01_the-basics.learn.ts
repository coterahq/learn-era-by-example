import { Eq, From, Relation, Ty, Values } from "@cotera/nasty";
import { test, expect, describe } from "vitest";
import { db } from "./helpers";

// # Welcome to Nasty, the "post-modern" data stack!
//
// Q. Why does Nasty exist?
//
// A. Nasty was built to maintain testable/composable data pipelines. Our team
// was ripping our hair out trying to maintain dbt/SQL scripts across different
// data warehouses (Redshift, BigQuery, Postgres, Snowflake) on top of ever
// shifting data foundations maintained by our customer's internal data teams.
// Nasty is the result of our learnings from field experience.
//
// Q. Is Nasty an ORM? A SQL builder?
//
// A. Neither! Nasty is kinda it's own thing. Nasty is more like a minimal
// relational algebra programming language shipped as a Typescript library. It
// borrows a bunch of learnings from other programming languages and applies
// them to OLAP programming / data engineering.
//
// Q. Why is it called Nasty?
//
// A. Nasty stands for (Nasty Abstract Syntax Tree Thing-y). Nasty is named
// after the fact it defines an "abstract syntax tree (AST)" as its main
// interface, as opposed to SQL which exposes a text format

test("Using nasty to generate SQL", () => {
  // Nasty can be used to generate data{base, warehouse} specific SQL. Nasty
  // ships with a SQL generator that supports many different dialects.

  const Tab = From({
    schema: "some_schema",
    name: "some_table_name",
    attributes: {
      foo: "string",
      bar: "int",
    },
  }).filter((t) => t.attr("bar").gt(2));

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
  // A really powerful part of nasty is that it ships with a _full_ relational
  // algebra type checker. Nasty's goal is to be able to tell if a query is
  // valid _before_ running it. This allows for fast feedback on how a
  // potential change will affect your entire pipeline.

  const Orders = From({
    schema: "public",
    name: "orders",
    attributes: {
      // Nasty keeps track of nullability
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

  // Nasty will keep track of the attributes a relation has and calculates the
  // resulting types of each operation. Nasty models the full expression
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

  // Nasty analyzed the join and figures out the types of the output relation
  // (including nullability!)
  expect(CustomerOrderStats.attributes).toEqual({
    id: Ty.nn("int"),
    state: Ty.ty("string"),
    quantity: Ty.nn("int"),
  });

  // The Nasty type checker will analyze your relations and give you instant
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

TraceBack:
 -> attr - "from"
`,
  );
});

test("Introducing the `Values` clause", async () => {
  // Nasty has good interop with Javascript values. One thing it implements for
  // every warehouse is `Values`, which are a way of treating Javascript objects like rows.
  // This can be a handy Swiss Army Knife to move small tables around and write unit tests.

  // Here we're setting `SomeData` to be a `Relation` that's a values clause
  const SomeData = Values([{ n: 1 }, { n: 2 }]);

  // Nasty will infer the type of `SomeData` to be a table with a single column
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
  // This section explores a core Nasty concept called `Relation`. Relations
  // are similar to "tables" in SQL, they have one or more columns that have
  // names and types. They represent 0 or more rows that have those types
  //
  // Relations are immutable, all operations return new relations without
  // affecting the old relation.

  test("Using the `.select` method", async () => {
    // The select method is used to "project" the relation into another
    // relation. This involves creating new columns which are functions of the
    // old columns.

    const SomeData: Relation = Values([
      { a: 2, b: "Foo", c: true },
      { a: 2, b: "Bar", c: false },
      { a: 3, b: "Baz", c: true },
    ]);

    // The `.star` method works similarly `select * from $PREVIOUS_RELATION`
    const SelectedStar = SomeData.select((t) => ({ ...t.star() }));
    console.log(SelectedStar.bigQuerySql.sql);
    expect(SelectedStar.postgresSql.sql).toEqual(
      // We see cte1 which represents our `SomeData` values clause, the last
      // line of the query represents selecting * from cte1. Notice how Nasty
      // doesn't actually ever use the `*` shorthand. Since Nasty knows the
      // column names via the type checker it can select those columns them directly.
      `
with "cte1" as (
  (select arg_0 as "a", arg_1 as "b", arg_2 as "c" from (values (2, 'Foo', true), (2, 'Bar', false), (3, 'Baz', true)) as vals(arg_0, arg_1, arg_2))
)
select "a" as "a", "b" as "b", "c" as "c" from "cte1"
`.trim(),
    );

    // You can also use the `.pick` or `.expect` methods to only select specific attributes
    const PickingWantedAttributes = SomeData.select((t) => t.pick("a", "b"));
    const ExceptingUnwantedAttributes = SomeData.select((t) => t.except("c"));
    expect(PickingWantedAttributes.postgresSql).toEqual(
      ExceptingUnwantedAttributes.postgresSql,
    );
  });
});

// renaming attributes
// creating new attributes from constant
// where clause
// logical operators and/or/not
// distinct
// order by
// limit
// UnionAll
//
//
// generating different types of SQL
//
// New learn.ts: math operations
// New learn.ts:  aggregates (group by, count by, other agg functions)
// New learn.ts: windows
