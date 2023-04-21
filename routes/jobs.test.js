"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: "0.5",
    companyHandle: "c1",
  };

  test("ok for auth users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new",
        salary: 100000,
        equity: "0.5",
        companyHandle: "c1",
      },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        equity: "0,4",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: "100000",
        equity: "0.5",
        companyHandle: "DescNew",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "title1",
          salary: 10000,
          equity: "0.0",
          companyHandle: "c1",
        },

        {
          id: expect.any(Number),
          title: "title2",
          salary: 20000,
          equity: "0.5",
          companyHandle: "c1",
        },

        {
          id: expect.any(Number),
          title: "title3",
          salary: 30000,
          equity: "0.4",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

// ************************************** GET /companies/with filters
describe("GET /jobs/query string", function () {
  test("works for name and min employee query", async function () {
    const resp = await request(app).get(`/jobs?title=tit&minSalary=20000`);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "title2",
          salary: 20000,
          equity: "0.5",
          companyHandle: "c1",
        },

        {
          id: expect.any(Number),
          title: "title3",
          salary: 30000,
          equity: "0.4",
          companyHandle: "c2",
        },
      ],
    });
  });
  test("works for hasEquity", async function () {
    const resp = await request(app).get(`/jobs?hasEquity=true`);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "title2",
          salary: 20000,
          equity: "0.5",
          companyHandle: "c1",
        },

        {
          id: expect.any(Number),
          title: "title3",
          salary: 30000,
          equity: "0.4",
          companyHandle: "c2",
        },
      ],
    });
  });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const jobResp = await request(app)
      .post("/jobs")
      .send({
        title: "NewJob",
        salary: 50000,
        equity: "0.0",
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u2Token}`);

    const jobId = jobResp.body.job.id;
    const res = await request(app).get(`/jobs/${jobId}`);
    expect(res.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "NewJob",
        salary: 50000,
        equity: "0.0",
        companyHandle: "c2",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/97899000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const jobResp = await request(app)
      .post("/jobs")
      .send({
        title: "NewJob",
        salary: 50000,
        equity: "0.0",
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u2Token}`);

    const jobId = jobResp.body.job.id;

    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        equity: "0.7",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "NewJob",
        salary: 50000,
        equity: "0.7",
        companyHandle: "c2",
      },
    });
  });

  test("unauth for anon", async function () {
    const jobResp = await request(app)
      .post("/jobs")
      .send({
        title: "NewJob",
        salary: 50000,
        equity: "0.0",
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u2Token}`);

    const jobId = jobResp.body.job.id;

    const resp = await request(app).patch(`/jobs/${jobId}`).send({
      title: "C1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/12`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const jobResp = await request(app)
      .post("/jobs")
      .send({
        title: "NewJob",
        salary: 50000,
        equity: "0.0",
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u2Token}`);

    const jobId = jobResp.body.job.id;

    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        id: 500,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const jobResp = await request(app)
      .post("/jobs")
      .send({
        title: "NewJob",
        salary: 50000,
        equity: "0.0",
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u2Token}`);

    const jobId = jobResp.body.job.id;

    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        equity: 590,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const jobResp = await request(app)
      .post("/jobs")
      .send({
        title: "NewJob",
        salary: 50000,
        equity: "0.0",
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u2Token}`);

    const jobId = jobResp.body.job.id;
    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: `${jobId}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
