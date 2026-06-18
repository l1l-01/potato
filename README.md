# Potato

> WARNING: WORK IN PROGRESS
>
> This project is currently under active development and is considered experimental.
> Features may change, break, or be removed at any time. The codebase is primarily
> a learning project that I started with almost no understanding of how programming
> languages are built.
>
> **Also: IndexedDB is more like ComplainDB.**

## About

The goal of this project is not to create a complete database solution, but to explore
how programming and query languages are designed and implemented.

## What Works

- Currently LET , POST , DROP are fully working
- 1 is working, 0 is not working

| Feature | Status | Notes                        |
| ------- | ------ | ---------------------------- |
| `LET`   | 1      | Create table                 |
| `GET`   | 0      | Retrieve one row or more     |
| `POST`  | 1      | Create data                  |
| `UPD`   | 0      | Update one col or more       |
| `DLT`   | 0      | Delete one row or all rows   |
| `DROP`  | 1      | Drop one table or all tables |

## Queries Examples

```sql
LET users $name STR $age INT
```

| Query   | Type            | Notes                                |
| ------- | --------------- | ------------------------------------ |
| `LET`   | CRUD keyword    | CRUD keyword                         |
| `users` | Table name      |                                      |
| `$name` | Field name      | All fields start with the symbol '$' |
| `STR`   | String datatype | Only supports words                  |
| `$age`  | Field age       | All fields start with the symbol '$' |
| `INT`   | Integer number  |                                      |

```sql
POST users $name :l1l $age :99
```

| Query   | Type         | Notes                                |
| ------- | ------------ | ------------------------------------ |
| `POST`  | CRUD keyword |                                      |
| `users` | Table name   |                                      |
| `$name` | Field name   | All fields start with the symbol '$' |
| `:l1l`  | Value        | All values start with ':'            |
| `$age`  | Field age    | All fields start with the symbol '$' |
| `:99`   | Value        | All values start with ':'            |

```sql
DROP (It simply drops all tables)
```

```sql
DROP users
```

| Query   | Type         | Notes |
| ------- | ------------ | ----- |
| `DROP`  | CRUD keyword |       |
| `users` | Table name   |       |

## License

MIT License © l1l-01
