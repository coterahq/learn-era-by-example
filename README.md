# Learn Nasty By Example

Inspired by [Ruby Koans](https://www.rubykoans.com/)

## What is this?

This is a repository to get you started with understanding the Nasty Analytics Toolkit.

## Who is this for?

This is for people who has a little understanding of SQL but maybe not
familiarity with Typescript, unit tests, or advanced SQL constructs (windows,
aggregates, ...etc). After teaching the basics, the examples get progressively
more advanced and show of more powerful analytics tools.

## How is this structured

This repository is structured in terms of individual examples

```typescript
test.skip("I'm a description of the example", () => {
  // Example code here
});
```

In order to attempt an example remove the `.skip` like so
```typescript
test("I'm a description of the example", () => {
  // Example code here
});
```

## Getting Started

### Try in Github Codespaces (TODO)

### Try Locally

#### Install NodeJS

#### `npm i`

#### `npm run test -- --watch-all`

