document.addEventListener("DOMContentLoaded", () => {
    const artistSearchInput = document.getElementById("artist-search")
    const searchBtn = document.getElementById("search-btn")
    const artistResults = document.getElementById("artist-results")
    const loadingElement = document.getElementById("loading")
    const errorMessage = document.getElementById("error-message")
    const artistDetail = document.getElementById("artist-detail")
    const artistName = document.getElementById("artist-name")
    const artistMeta = document.getElementById("artist-meta")
    const releasesList = document.getElementById("releases-list")
    const similarArtistsContainer = document.getElementById("similar-artists-container")
    const backBtn = document.getElementById("back-btn")
  
    const API_BASE_URL = "/.netlify/functions/api"
  
    searchBtn.addEventListener("click", searchArtists)
    artistSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchArtists()
      }
    })
    backBtn.addEventListener("click", showSearchResults)
  
    async function searchArtists() {
      const artist = artistSearchInput.value.trim()
  
      if (!artist) {
        showError("Please enter an artist name")
        return
      }
  
      showLoading()
      clearResults()
      hideError()
      hideArtistDetail()
  
      try {
        const response = await fetch(`${API_BASE_URL}/api/search?artist=${encodeURIComponent(artist)}`)
  
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
  
        const data = await response.json()
  
        if (data.artists && data.artists.items && data.artists.items.length > 0) {
          displayArtistResults(data.artists.items)
        } else {
          showError("No artists found. Try a different search term.")
        }
      } catch (error) {
        console.error("Error searching artists:", error)
        showError("Failed to search artists. Please try again later.")
      } finally {
        hideLoading()
      }
    }
  
    function displayArtistResults(artists) {
      artists.forEach((artist) => {
        const col = document.createElement("div")
        col.className = "col-md-6 col-lg-4 mb-4"
  
        const card = document.createElement("div")
        card.className = "card h-100 artist-card"
        card.setAttribute("tabindex", "0")
        card.setAttribute("role", "button")
        card.setAttribute("aria-label", `View details for ${artist.name}`)

        const imageUrl =
          artist.images && artist.images.length > 0 ? artist.images[0].url : "https://via.placeholder.com/300"

        const popularity = artist.popularity || "N/A"

        const genres =
          artist.genres && artist.genres.length > 0 ? artist.genres.slice(0, 3).join(", ") : "No genres available"
  
        card.innerHTML = `
          <img src="${imageUrl}" class="card-img-top" alt="${artist.name}">
          <div class="card-body">
            <h3 class="card-title h5">${artist.name}</h3>
            <p class="card-text text-muted">Popularity: ${popularity}</p>
            <p class="card-text small">${genres}</p>
          </div>
        `
  
        card.addEventListener("click", () => getArtistDetails(artist.id))
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            getArtistDetails(artist.id)
          }
        })
  
        col.appendChild(card)
        artistResults.appendChild(col)
      })
    }

    async function getArtistDetails(artistId) {
      showLoading()
      hideError()
  
      try {
        const artistResponse = await fetch(`${API_BASE_URL}/api/artist/${artistId}`)
  
        if (!artistResponse.ok) {
          throw new Error(`API responded with status: ${artistResponse.status}`)
        }
  
        const artistData = await artistResponse.json()
  
        const similarResponse = await fetch(`${API_BASE_URL}/api/artist/${artistId}/similar`)
  
        if (!similarResponse.ok) {
          throw new Error(`API responded with status: ${similarResponse.status}`)
        }
  
        const similarData = await similarResponse.json()
  
        displayArtistDetails(artistData, similarData.artists)
      } catch (error) {
        console.error("Error fetching artist details:", error)
        showError("Failed to load artist details. Please try again later.")
        showSearchResults()
      } finally {
        hideLoading()
      }
    }

    function displayArtistDetails(data, similarArtists) {
      artistResults.classList.add("d-none")
      artistDetail.classList.remove("d-none")
  
      const artist = data.artist
      const topTracks = data.topTracks
      const albums = data.albums

      artistName.textContent = artist.name

      const followers = artist.followers ? artist.followers.total.toLocaleString() : "Unknown"
      const popularity = artist.popularity || "N/A"
      const genres = artist.genres && artist.genres.length > 0 ? artist.genres.join(", ") : "No genres available"
  
      artistMeta.innerHTML = `
        <div class="mb-3">
          <img src="${artist.images[0]?.url || "https://via.placeholder.com/300"}" 
               alt="${artist.name}" class="img-fluid rounded">
        </div>
        <p><strong>Followers:</strong> ${followers}</p>
        <p><strong>Popularity:</strong> ${popularity}/100</p>
        <p><strong>Genres:</strong> ${genres}</p>
        <p><a href="${artist.external_urls.spotify}" target="_blank" class="btn btn-success btn-sm mt-2">
          Open in Spotify
        </a></p>
      `
  
      releasesList.innerHTML = '<h4 class="mb-3">Top Tracks</h4>'
      if (topTracks && topTracks.length > 0) {
        const tracksList = document.createElement("ul")
        tracksList.className = "list-group"
  
        topTracks.forEach((track) => {
          const li = document.createElement("li")
          li.className = "list-group-item d-flex justify-content-between align-items-center"
  
          const duration = track.duration_ms
          const minutes = Math.floor(duration / 60000)
          const seconds = ((duration % 60000) / 1000).toFixed(0)
          const formattedDuration = `${minutes}:${seconds.padStart(2, "0")}`
  
          li.innerHTML = `
            <div>
              <strong>${track.name}</strong>
              <div class="text-muted small">Album: ${track.album.name}</div>
            </div>
            <span class="badge bg-secondary rounded-pill">${formattedDuration}</span>
          `
          tracksList.appendChild(li)
        })
  
        releasesList.appendChild(tracksList)
      } else {
        releasesList.innerHTML += "<p>No top tracks found</p>"
      }

      const albumsSection = document.createElement("div")
      albumsSection.className = "mt-4"
      albumsSection.innerHTML = '<h4 class="mb-3">Albums</h4>'
  
      if (albums && albums.length > 0) {
        const albumsRow = document.createElement("div")
        albumsRow.className = "row row-cols-2 row-cols-md-3 g-3"
  
        albums.forEach((album) => {
          const albumCol = document.createElement("div")
          albumCol.className = "col"
  
          albumCol.innerHTML = `
            <div class="card h-100">
              <img src="${album.images[0]?.url || "https://via.placeholder.com/300"}" 
                   class="card-img-top" alt="${album.name}">
              <div class="card-body">
                <h5 class="card-title h6">${album.name}</h5>
                <p class="card-text small text-muted">${album.release_date.substring(0, 4)}</p>
              </div>
            </div>
          `
  
          albumsRow.appendChild(albumCol)
        })
  
        albumsSection.appendChild(albumsRow)
      } else {
        albumsSection.innerHTML += "<p>No albums found</p>"
      }
  
      releasesList.appendChild(albumsSection)

      similarArtistsContainer.innerHTML = ""
      if (similarArtists && similarArtists.length > 0) {
        similarArtists.forEach((similar) => {
          const col = document.createElement("div")
          col.className = "col-md-6 col-lg-4 mb-3"
  
          const card = document.createElement("div")
          card.className = "card h-100 artist-card"
          card.setAttribute("tabindex", "0")
          card.setAttribute("role", "button")
          card.setAttribute("aria-label", `View details for ${similar.name}`)

          const imageUrl =
            similar.images && similar.images.length > 0 ? similar.images[0].url : "https://via.placeholder.com/300"
  
          card.innerHTML = `
            <img src="${imageUrl}" class="card-img-top" alt="${similar.name}">
            <div class="card-body">
              <h4 class="card-title h6">${similar.name}</h4>
              <p class="card-text small">${similar.genres ? similar.genres.slice(0, 2).join(", ") : ""}</p>
            </div>
          `
  
          card.addEventListener("click", () => getArtistDetails(similar.id))
          card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              getArtistDetails(similar.id)
            }
          })
  
          col.appendChild(card)
          similarArtistsContainer.appendChild(col)
        })
      } else {
        similarArtistsContainer.innerHTML = '<div class="col-12"><p>No similar artists found</p></div>'
      }
    }

    function showSearchResults() {
      artistDetail.classList.add("d-none")
      artistResults.classList.remove("d-none")
    }

    function showLoading() {
      loadingElement.classList.remove("d-none")
    }
  
    function hideLoading() {
      loadingElement.classList.add("d-none")
    }
  
    function showError(message) {
      errorMessage.textContent = message
      errorMessage.classList.remove("d-none")
    }
  
    function hideError() {
      errorMessage.classList.add("d-none")
    }
  
    function clearResults() {
      artistResults.innerHTML = ""
    }
  
    function hideArtistDetail() {
      artistDetail.classList.add("d-none")
    }
  })
  
  