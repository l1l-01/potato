# Potato

> WARNING: This project is primarily a learning project
> that I started with almost no understanding of how programming
> languages are built.
>
> **Also: IndexedDB is more like ComplainDB.**

## About

The goal of this project is not to create a complete database solution, but to explore
how programming and query languages are designed and implemented.

> **Note:** You need to refresh the page after each query.

![img](./1.png)
![img](./3.png)
![img](./2.png)

- What works has a status of 1, and 0 is not working

# Operations

| Datatype | Status | meaning                   |
| -------- | ------ | ------------------------- |
| `LET`    | 1      | Create a table            |
| `POST`   | 1      | Add data to a table       |
| `GET`    | 1      | Retrive data from a table |
| `UPD`    | 0      | Update data               |
| `DLT`    | 1      | Delete a row of data      |
| `DROP`   | 1      | Drop a table              |

# Data Types

| Datatype | Status | meaning |
| -------- | ------ | ------- |
| `BOOL`   | 1      | Boolean |
| `STR`    | 1      | String  |
| `INT`    | 1      | Integer |
| `FLT`    | 1      | Float   |
| `DATE`   | 0      | Date    |

# More

| Datatype | Status | meaning |
| -------- | ------ | ------- |
| `:`      | 1      | Value   |
| `@`      | 1      | Limit   |
| `$`      | 1      | Field   |
| `WHERE`  | 1      |         |
| `AND`    | 0      |         |
| `OR`     | 0      |         |

# Errors

| Errors                                                                                                       |
| ------------------------------------------------------------------------------------------------------------ |
| ERROR(000): Your query is empty.                                                                             |
| ERROR(001): UNKNOWN KEYWORD...                                                                               |
| Error(002): Missing CRUD keyword. An action must be specified. Use one of: LET, POST, GET, UPD, DLT.         |
| Error(003): Only one CRUD operation can run at a time. You are trying to use more than one:...               |
| ERROR(004): Misplaced CRUD keyword:...                                                                       |
| ERROR(005): You can only perform one CRUD operation on a single table at a time:...                          |
| ERROR(006): Your query is missing a table name.                                                              |
| MISPLACED_TABLE_NAME: ERROR(007): Misplaced table name:...                                                   |
| ERROR(008): Missing operation. Please use one of: LET, GET, UPD, DLT, DROP.                                  |
| ERROR(009): ID is created automatically, remove the provided id:...                                          |
| ERROR(010): Limit can only be used in a GET query:...                                                        |
| ERROR(011): Operators can only be used in a GET and UPD queries:...                                          |
| ERROR(012): Keywords can only be used in a GET and UPD queries:...                                           |
| ERROR(013): Fields and their types are required to create a table.                                           |
| ERROR(014): Fields and their values are required to create a table.                                          |
| ERROR(015): Missing field(s):...                                                                             |
| ERROR(016): Missing datatype(s):...                                                                          |
| ERROR(017): Missing value(s):...                                                                             |
| ERROR(018): Datatype must appear after its field:...                                                         |
| ERROR(019): Value must appear after its field, its field's datatype, or an operator:...                      |
| ERROR(020): Datatype(s) not allowed: ...                                                                     |
| ERROR(021): You can only use one WHERE keyword:...                                                           |
| ERROR(022): You can't use the AND keyword at the end of the query...                                         |
| ERROR(023): You are only allowed to use id (#1), field ($field) and value (:value) after the keyword AND:... |
| ERROR(024): You are only allowed to use AND or OR or BETWEEN after the keyword ',':...                       |
| ERROR(025): You are not allowed to update the ID.                                                            |
| ERROR(026): You are only allwoed to use fields in LET, GET, UPD and DLT queries:...                          |
| ERROR(027): You are not allwoed to use ids in DROP query:...                                                 |
| ERROR(028): Duplicated DESC:...                                                                              |
| ERROR(029): Can't open database:...                                                                          |
| ERROR(030): Database failed to open:...                                                                      |
| ERROR(031): Missing metadata for table:...                                                                   |
| ERROR(032): Table Already exists:...                                                                         |
| ERROR(033): Table doesn't exist:...                                                                          |
| ERROR(034): Field does not exist:...                                                                         |
| ERROR(035): Datatype is null:...                                                                             |
| ERROR(036): Table metadata doesn't match with the data you are trying to POST:...                            |
| Error(037): Transaction aborted!                                                                             |
| Error(038): Transaction error:...                                                                            |
| Error(039): Table is empty:                                                                                  |

## Queries Examples

All these examples show what currently works.

- Create a users table

```code
LET users $name STR $age INT
```

- Insert data into users

```code
POST users $name :l1l $age :99
```

- Retrieve all data from users

```code
GET users
```

- Retrieve a row by id

```code
GET users WHERE $id :14
```

- Retrieve a row by field value

```code
GET users WHERE $name :bruh
```

- Delete all rows in users

```code
DLT users
```

- Drop the users table

```code
DROP users
```

- Drop all tables

```code
DROP
```

## License

MIT License © l1l-01
