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
  movies.getAllMovies();
}

movies.movies = [];
movies.sortAsc = null;

movies.getAllMovies = async () => {
  try {
    const moviesRef = ref(db, 'movies');
    const snapshot = await get(moviesRef);
    let moviesArr = [];

    snapshot.forEach((childSnapshot) => {
      const movie = childSnapshot.val();
      moviesArr.push(movie);
    });

    movies.movies = moviesArr;
    movies.sortMovies();
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  movies.user = JSON.parse(localStorage.getItem('user'));
  if (!movies.user
    || !movies.user.id) {
    window.location.href = '/auth.html';
  }

  document.getElementById('username').innerHTML = movies.user.name;
  movies.getAllMovies();
});

movies.logOut = () => {
  localStorage.removeItem('user');
  window.location.href = '/auth.html';
}

movies.renderMoviesList = () => {
  const div = document.getElementById('movie-list');
  div.innerHTML = '';

  movies.movies.forEach((movie) => {
    const movieDiv = document.createElement('div');
    movieDiv.className = 'movie-card';

    
    const posterImg = document.createElement('img');
    posterImg.src = movie.Poster;
    movieDiv.appendChild(posterImg);
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'movie-title';
    titleDiv.innerHTML = movie.Title + ' (' + movie.Year + ')';
    movieDiv.appendChild(titleDiv);
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'movie-buttons';

    const moreInfoButton = document.createElement('button');
    moreInfoButton.className = 'btn more-info-button';
    moreInfoButton.innerHTML = 'More Info';
    moreInfoButton.onclick = () => { movies.showMovieDetails(movie.imdbID); };

    buttonsDiv.appendChild(moreInfoButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn danger delete-button';
    deleteButton.innerHTML = 'Delete';
    deleteButton.onclick = () => { movies.deleteMovie(movie.imdbID) };

    buttonsDiv.appendChild(deleteButton);

    movieDiv.appendChild(buttonsDiv);

    div.appendChild(movieDiv);
  });
}

movies.sortMovies = () => {
  if (movies.sortAsc === null) {
    movies.sortAsc = true;
  }

  movies.movies.sort((a, b) => {
    if (movies.sortAsc) {
      return a.Title.localeCompare(b.Title);
    } else {
      return b.Title.localeCompare(a.Title);
    }
  });  
  movies.renderMoviesList();
}

movies.toggleTitleSorting = () => {
  movies.sortAsc = !movies.sortAsc;
  movies.sortMovies();
}

movies.showMovieDetails = async (imdbID) => {

}

movies.deleteMovie = async (imdbID) => {
  let confirm = window.confirm('Are you sure you want to delete this movie?');
  if (!confirm) {
    return;
  }

  await set(ref(db, `movies/${imdbID}`), null);
  movies.getAllMovies();
}
