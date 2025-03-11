const request = require("supertest")
const express = require("express")
const fetch = require("node-fetch")

jest.mock("node-fetch")

const apiHandler = require("../netlify/functions/api")

const app = express()
app.use("/.netlify/functions/api", (req, res, next) => {
  req.path = req.path.replace(/^\/api/, "")
  apiHandler.handler(
    { path: req.path, httpMethod: req.method, queryStringParameters: req.query },
    { statusCode: 200 },
    (err, result) => {
      if (err) return next(err)
      res.status(result.statusCode).set(result.headers).send(result.body)
    },
  )
})

describe("Music API", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    fetch.mockImplementation((url) => {
      if (url === "https://accounts.spotify.com/api/token") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: "mock-token" }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })
  })

  describe("GET /api/search", () => {
    it("should return 400 if artist is missing", async () => {
      const res = await request(app).get("/.netlify/functions/api/api/search")
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toBe("Artist name is required")
    })

    it("should fetch artists with search term", async () => {
      fetch.mockImplementation((url) => {
        if (url === "https://accounts.spotify.com/api/token") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ access_token: "mock-token" }),
          })
        }
        if (url.includes("/search")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                artists: {
                  items: [{ id: "1", name: "The Beatles", popularity: 90 }],
                },
              }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      })

      const res = await request(app).get("/.netlify/functions/api/api/search?artist=Beatles")

      expect(res.statusCode).toBe(200)
      expect(res.body.artists.items).toHaveLength(1)
      expect(res.body.artists.items[0].name).toBe("The Beatles")
    })
  })

  describe("GET /api/artist/:id", () => {
    it("should fetch artist details by id", async () => {
      fetch.mockImplementation((url) => {
        if (url === "https://accounts.spotify.com/api/token") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ access_token: "mock-token" }),
          })
        }
        if (url.includes("/artists/123")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "123",
                name: "The Beatles",
                popularity: 90,
              }),
          })
        }
        if (url.includes("/top-tracks")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ tracks: [] }),
          })
        }
        if (url.includes("/albums")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      })

      const res = await request(app).get("/.netlify/functions/api/api/artist/123")

      expect(res.statusCode).toBe(200)
      expect(res.body.artist.id).toBe("123")
      expect(res.body.artist.name).toBe("The Beatles")
    })
  })
})

