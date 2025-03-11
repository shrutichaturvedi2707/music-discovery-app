const fs = require("fs")
const path = require("path")
const { JSDOM } = require("jsdom")

const html = fs.readFileSync(path.resolve(__dirname, "../frontend/index.html"), "utf8")

describe("Music Discovery App UI", () => {
  let dom, document, window

  beforeEach(() => {
    dom = new JSDOM(html, {
      url: "http://localhost/",
      resources: "usable",
      runScripts: "dangerously",
    })

    window = dom.window
    document = window.document

    window.fetch = jest.fn()
    window.bootstrap = {
      Modal: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn(),
      })),
    }
  })

  it("should have the correct title", () => {
    expect(document.title).toBe("Music Discovery App")
  })

  it("should have a search input field", () => {
    const input = document.getElementById("artist-search")
    expect(input).not.toBeNull()
    expect(input.placeholder).toContain("Enter an artist name")
  })

  it("should have a search button", () => {
    const button = document.getElementById("search-btn")
    expect(button).not.toBeNull()
    expect(button.textContent.trim()).toBe("Search")
  })

  it("should have a results container", () => {
    const resultsContainer = document.getElementById("artist-results")
    expect(resultsContainer).not.toBeNull()
  })
})

