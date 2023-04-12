const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { sqlForPartialUpdate, sqlForFilter } = require("./sql");

describe("test sqlForPartialUpdate", function () {
  test("works", function () {
    const result = sqlForPartialUpdate(
      {
        firstName: "HeyHey",
        password: "12345",
      },
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1, "password"=$2',
      values: ["HeyHey", "12345"],
    });
  });

  test("bad request if no data", function () {
    expect(() =>
      sqlForPartialUpdate(
        {},
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        }
      ).toThrow(BadRequestError)
    );
  });
});

describe("test sqlForFilter", function () {
  test("works", function () {
    const result = sqlForFilter(
      {
        name: "carol",
        minEmployees: 2,
      },
      {
        name: "LOWER(name) LIKE",
        minEmployees: "num_employees >=",
        maxEmployees: "num_employees <=",
      }
    );
    expect(result).toEqual({
      setCols: "LOWER(name) LIKE $1 AND num_employees >= $2",
      values: ["%carol%", 2],
    });
  });

  test("bad request if no data", function () {
    expect(() =>
      sqlForFilter(
        {},
        {
          name: "LOWER(name) LIKE",
          minEmployees: "num_employees >=",
          maxEmployees: "num_employees <=",
        }
      ).toThrow(BadRequestError)
    );
  });
});
