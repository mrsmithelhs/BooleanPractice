# Numeric Relational Equivalence

This note documents the narrow AP CSA comparison subset supported by Plan 24.

## Supported Shapes

The knowledge graph supports comparisons of the form:

- `identifier > integer`
- `identifier >= integer`
- `identifier < integer`
- `identifier <= integer`
- `identifier == integer`
- `identifier != integer`
- `identifier == identifier`
- `identifier != identifier`

The left side must always be a plain numeric variable identifier. The right side may be an integer literal for any operator, or a second numeric variable only for `==` and `!=`.

## Authored Inverse Pairs

The graph contains the following fixed inverse rules:

- `!(x > n)` <-> `x <= n`
- `!(x >= n)` <-> `x < n`
- `!(x < n)` <-> `x >= n`
- `!(x <= n)` <-> `x > n`
- `!(x == y)` <-> `x != y`
- `!(x != y)` <-> `x == y`

## Student-Facing Explanation

Numeric variables are stand-ins for unknown numbers. They let the app ask about the comparison itself without requiring the student to know the exact value ahead of time.

The UI should keep this explanation visible in plain language and should not imply support for dot notation, object fields, method calls, arrays, or collections.

## Unsupported Examples

These are intentionally out of scope:

- `str.length() > 5`
- `items.length <= 10`
- `car.milesPerHour() > 60`
- `list.size() == 0`

## Use In Feedback

Feedback may only claim a relational equivalence when a comparison matches one of the authored inverse pairs. Any unsupported shape should fail safely and avoid guessing.
