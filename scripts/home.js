import { omdbConfig } from "../config/omdb-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { firebaseConfig } from "../config/firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

window.movies = window.movies || {};

movies.openAddMovieModal = () => {
    document.getElementById('add-movie-modal').style.display = 'block';
}

movies.closeAddMovieModal = () => {
    document.getElementById('add-movie-modal').style.display = 'none';
    document.getElementById('movie-search-bar').value = '';
    document.getElementById('add-movie-results').innerHTML = '';
}
movies.searchMovies = async () => {
  const search = document.getElementById('movie-search-bar').value;
  const url = `${omdbConfig.baseUrl}?apikey=${omdbConfig.apiKey}&s=${encodeURIComponent(search)}&type=movie`;

  try {
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);

      const searchResults = document.getElementById('add-movie-results');
      searchResults.innerHTML = '';

      if (data.Search && data.Search.length > 0) {
        data.Search.forEach(movie => {
            const div = document.createElement('div');
            div.className = 'search-result-card';

            const posterImg = document.createElement('img');
            posterImg.src = movie.Poster;
            div.appendChild(posterImg);

            const titleDiv = document.createElement('div');
            titleDiv.className = 'search-result-title';
            titleDiv.innerHTML = movie.Title + ' (' + movie.Year + ')';
            div.appendChild(titleDiv);

            div.onclick = () => {
                movies.addMovieFromSearch(movie);
                movies.closeAddMovieModal();
            }
            searchResults.appendChild(div);
        });
      } else {
          searchResults.innerHTML = 'No results found';
      }

  } catch (error) {
      console.error(error);
  }
}

movies.addMovieFromSearch = async (movie) => {
  await set(ref(db, `movies/${movie.imdbID}`), {
    imdbID: movie.imdbID,
    Poster: movie.Poster,
    Title: movie.Title,
    Year: movie.Year,
  });
}

movies.getAllMovies = async () => {
  try {
    const moviesRef = ref(db, 'movies');
    const snapshot = await get(moviesRef);
    const movies = [];

    snapshot.forEach((childSnapshot) => {
      const movie = childSnapshot.val();
      movies.push(movie);
    });

    const div = document.getElementById('movie-list');
    div.innerHTML = '';

    movies.forEach((movie) => {
      const movieDiv = document.createElement('div');
      movieDiv.className = 'movie-card';

      const posterImg = document.createElement('img');
      posterImg.src = movie.Poster;
      movieDiv.appendChild(posterImg);

      const titleDiv = document.createElement('div');
      titleDiv.className = 'movie-title';
      titleDiv.innerHTML = movie.Title + ' (' + movie.Year + ')';
      movieDiv.appendChild(titleDiv);

      div.appendChild(movieDiv);
    });
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener('DOMContentLoaded', movies.getAllMovies);
