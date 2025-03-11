const express = require("express")
const serverless = require("serverless-http")
const fetch = require("node-fetch")

const app = express()
const router = express.Router()

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

async function getSpotifyToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
    },
    body: "grant_type=client_credentials",
  })

  const data = await response.json()
  return data.access_token
}

router.get("/search", async (req, res) => {
  const { artist } = req.query

  if (!artist) {
    return res.status(400).json({ error: "Artist name is required" })
  }

  try {
    const token = await getSpotifyToken()

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Spotify API responded with status: ${response.status}`)
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error("Error searching artists:", error)
    res.status(500).json({ error: "Failed to search artists", details: error.message })
  }
})

router.get("/artist/:id", async (req, res) => {
  const { id } = req.params

  try {
    const token = await getSpotifyToken()

    const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!artistResponse.ok) {
      throw new Error(`Spotify API responded with status: ${artistResponse.status}`)
    }

    const tracksResponse = await fetch(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!tracksResponse.ok) {
      throw new Error(`Spotify API responded with status: ${tracksResponse.status}`)
    }

    const albumsResponse = await fetch(
      `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album&limit=10&market=US`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!albumsResponse.ok) {
      throw new Error(`Spotify API responded with status: ${albumsResponse.status}`)
    }

    const artist = await artistResponse.json()
    const tracks = await tracksResponse.json()
    const albums = await albumsResponse.json()

    res.json({
      artist,
      topTracks: tracks.tracks,
      albums: albums.items,
    })
  } catch (error) {
    console.error("Error fetching artist details:", error)
    res.status(500).json({ error: "Failed to fetch artist details", details: error.message })
  }
})

router.get("/artist/:id/similar", async (req, res) => {
  const { id } = req.params

  try {
    const token = await getSpotifyToken()

    const response = await fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Spotify API responded with status: ${response.status}`)
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error("Error finding similar artists:", error)
    res.status(500).json({ error: "Failed to find similar artists", details: error.message })
  }
})

app.use("/api/", router)

module.exports.handler = serverless(app)

