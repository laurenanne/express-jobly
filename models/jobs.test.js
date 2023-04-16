"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// create;

describe("create", function () {
  const newJob = {
    id: 600,
    title: "title",
    salary: 100000,
    equity: "0.5",
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
                FROM jobs
                WHERE id = 600`
    );
    expect(result.rows).toEqual([
      {
        id: 600,
        title: "title",
        salary: 100000,
        equity: "0.5",
        company_handle: "c1",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// findAll*****************************

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 30,
        title: "title1",
        salary: 10000,
        equity: "0.6",
        companyHandle: "c1",
      },
      {
        id: 31,
        title: "title2",
        salary: 20000,
        equity: "0.5",
        companyHandle: "c1",
      },
      {
        id: 32,
        title: "title3",
        salary: 30000,
        equity: "0.4",
        companyHandle: "c2",
      },
    ]);
  });
});

// // find using filters***************************
describe("find", function () {
  test("works: with a set of filters: title and min salary", async function () {
    let jobs = await Job.find({ title: "title", minSalary: 20000 });
    expect(jobs).toEqual([
      {
        id: 31,
        title: "title2",
        salary: 20000,
        equity: "0.5",
        companyHandle: "c1",
      },
      {
        id: 32,
        title: "title3",
        salary: 30000,
        equity: "0.4",
        companyHandle: "c2",
      },
    ]);
  });
  test("works: with min salary and hasEquity true filters", async function () {
    let jobs = await Job.find({ minSalary: 30000, hasEquity: true });
    expect(jobs).toEqual([
      {
        id: 32,
        title: "title3",
        salary: 30000,
        equity: "0.4",
        companyHandle: "c2",
      },
    ]);
  });
  test("works: hasEquity true filters", async function () {
    let jobs = await Job.find({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: 30,
        title: "title1",
        salary: 10000,
        equity: "0.6",
        companyHandle: "c1",
      },
      {
        id: 31,
        title: "title2",
        salary: 20000,
        equity: "0.5",
        companyHandle: "c1",
      },
      {
        id: 32,
        title: "title3",
        salary: 30000,
        equity: "0.4",
        companyHandle: "c2",
      },
    ]);
  });

  test("works: with title contains tit and hasEquity false filters", async function () {
    let jobs = await Job.find({ title: "tit", hasEquity: false });
    expect(jobs).toEqual([
      {
        id: 30,
        title: "title1",
        salary: 10000,
        equity: "0.6",
        companyHandle: "c1",
      },
      {
        id: 31,
        title: "title2",
        salary: 20000,
        equity: "0.5",
        companyHandle: "c1",
      },
      {
        id: 32,
        title: "title3",
        salary: 30000,
        equity: "0.4",
        companyHandle: "c2",
      },
    ]);
  });
  test("no company meets criteria", async function () {
    try {
      await Job.find({ title: "nope" });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// get***************************
describe("get", function () {
  test("works", async function () {
    let job = await Job.get(31);
    expect(job).toEqual({
      id: 31,
      title: "title2",
      salary: 20000,
      equity: "0.5",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// Update******************
describe("update", function () {
  const updateData = {
    title: "New",
    salary: 700,
    equity: "0.9",
  };

  test("works", async function () {
    let job = await Job.update(30, updateData);
    expect(job).toEqual({
      id: 30,
      ...updateData,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
               FROM jobs
               WHERE id = 30`
    );
    expect(result.rows).toEqual([
      {
        id: 30,
        title: "New",
        salary: 700,
        equity: "0.9",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let job = await Job.update(31, updateDataSetNulls);
    expect(job).toEqual({
      id: 31,
      ...updateDataSetNulls,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
          FROM jobs
          WHERE id = 31`
    );
    expect(result.rows).toEqual([
      {
        id: 31,
        title: "New",
        salary: null,
        equity: null,
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(1900, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(30, {});
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// DELETE*************************
describe("remove", function () {
  test("works", async function () {
    await Job.remove(30);
    const res = await db.query("SELECT id FROM jobs WHERE id=30");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(20000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
