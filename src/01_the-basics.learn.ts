import { Eq, From, Ty, Values } from "@cotera/nasty";
import { test, expect } from "vitest";
import { db } from "./helpers";

// Welcome to Nasty, the "post-modern" data stack!

// Q. Why does Nasty exist?
//
// A. Nasty was built to maintain and test data pipelines at scale. Our team
// was ripping our hair out trying to maintain DBT/SQL scripts across 4+
// different data warehouses (Redshift, Bigquery, Postgres, Snowflake) on top
// of ever shifting data foundations maintained by our customer's internal data.
//
// really cool data tooling. Nasty exists to lower the human overhead of
// working on data pipelines by offloading all the boring stuff to the
// computer. Because Nasty understands your data pipelines so well, it can keep
// track of all the stuff you'd have to keep in your head.
//
// Q. Is Nasty an ORM? A SQL builder?
//
// A. Neither! It's a toolkit for mantaining data pipelines and building data
// tooling. It's specificly designed for OLAP workloads. Nasty ships with SQL
// generators for many different databases, but at it's core Nasty is a
// relation algebra abstract machine. It ships with a full typechecker library and interpreter.
//
// Q. Is Nasty a programming language?
//
// A. Kinda? Depends on how technical you want to get. In practice Nasty is a
// bunch of related Typescript libraries. If you want to get computer science-y
// you could describe Nasty as a "Hosted" programming language, which defines
//
// Q. Why is it called Nasty?
//
// A. Nasty stands for (Nasty Abstract Syntax Tree Thing-y). It's named after
// the fact it defines an "abstract syntax tree (AST)" for a simplified relation
// algebra abstract machine.
//
// Since we built it, Nasty has grown to have many useful data tools in the
// box. The AST part of N-AST-Y is now just a tiny part that most people will
// never interact with, but we think the name is kinda funny... so we're
// keeping it.

// Generating SQL
test("using nasty to generate SQL", () => {
	// Nasty can be used to generate data{base, warehouse} specific SQL. Nasty
	// ships with a SQL generator that supports many different data{base,
	// warehouse} dialects. For the purposes of the rest of the tutorial we're
	// going to run on duckdb on your machine, but this shows _how_ sql gen works

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

// Typechecking
test("See the type checker", () => {
	// The most poweful part of nasty is that it ships with a _full_ typechecker.
	// Nasty's goal is to be able to tell if a query is valid _before_ running it.

	const Orders = From({
		schema: "public",
		name: "orders",
		attributes: {
			// Nasty keeps track of nullability
			customer_id: { ty: "int", nullable: false },
			// The `Ty` library has helpful type manipulations
			quantity: Ty.nn("int"),
		},
	});

	const Customers = From({
		schema: "public",
		name: "customers",
		attributes: { id: Ty.nn("int"), state: "string" },
	});

	// Nasty will keep track of the attributes a relation has and correctly model
	// your entire data pipeline. Nasty models the expression language, joins,
	// windows, and aggreagtes. All of this information is available to tooling
	// and meta programming. Making changes on your data sources will show the
	// type errors all the way up to your visualization ands reverse etl
	// processes! Never again wonder what will break when you change a
	// foundational model!
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

	// The Nasty typechecker will analyze your relations and give you instant
	// feedback if something you're doing is invalid. Nasty calls into JS's
	// runtime to show you the exact line number of the error (this is hard to
	// show in docs but very powerful when actually writing Nasty)
	expect(() =>
		CustomerOrderStats.select((t) => ({
			...t.pick("id", "state", "oops_invalid_attribute!"),
		})),
	).toThrowError(
		// Error messages include helpful tips! A missing attribute lists out all the attributes that do exist and their types
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

// Values
test("Basic Values Examples", async () => {
	// Values clauses are a way to manually input data that you can later manipulate in Nasty.
	const res = await Values([{ n: 1 }, { n: 2 }]).execute(db());
	expect(res).toEqual([{ n: 1 }, { n: 2 }]);
});

test("select attributes", async () => {
	// In nasty you can select all attributes of a table using the `star` method, similar to SQL.
	const data = Values([
		{ a: 1, b: "Foo" },
		{ a: 2, b: "Bar" },
		{ a: 3, b: "Baz" },
	]);

	// These three queries are equivalent
	const query1 = data.select((t) => t.star());
	const query2 = data.select((t) => ({ ...t.star() }));

	// Both queries will return the same result
	const res = [
		{ a: 1, b: "Foo" },
		{ a: 2, b: "Bar" },
		{ a: 3, b: "Baz" },
	];

	expect(await query1.execute(db())).toEqual(res);
	expect(await query2.execute(db())).toEqual(res);

	// You can also pick attributes by name, similar to SQL.

	// Similar to query1 and query2, you can use ... to expand the t.pick or use it stand alone
	const query3 = data.select((t) => t.pick("a", "b"));
	const query4 = data.select((t) => ({ ...t.pick("a", "b") }));

	expect(await query3.execute(db())).toEqual(res);
	expect(await query4.execute(db())).toEqual(res);

	// Alternatively, you can use the `attr` method to select a single attribute.
	// This query is another equivalent way to select all attributes.
	const query5 = data.select((t) => ({ a: t.attr("a"), b: t.attr("b") }));

	expect(await query5.execute(db())).toEqual(res);
});

// renaming attributes
// creating new attributes from constant
// show errors when trying to select non-existing attributes
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
