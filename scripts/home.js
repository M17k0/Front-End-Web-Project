import { omdbConfig } from "../config/omdb-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { firebaseConfig } from "../config/firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

window.movies = window.movies || {};

movies.page = 'movies';
movies.movies = [];
movies.sortAsc = null;
movies.user = null;
movies.userWatchedMovies = [];


window.addEventListener('DOMContentLoaded', async () => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/auth.html';
  }
  
  try
  {
    const userSnapshot = await get(ref(db, `users/${userId}`));
    const user = userSnapshot.val();
    
    const watchedSnapshot = await get(ref(db, `userWatchedMovies/${userId}`));
    const watched = watchedSnapshot.val();
    
    movies.user = user;
    movies.userWatchedMovies = watched || [];
    
    document.body.style.display = 'block';

    document.getElementById('username').innerHTML = user.username;
    movies.getAllMovies();
  }
  catch (error) {
    movies.logOut();
  }
});


movies.selectPage = (page) => {
  movies.closeMovieDetails();

  movies.page = page;
  document.getElementById('movies-page-link').classList.remove('active');
  document.getElementById('watched-page-link').classList.remove('active');

  document.getElementById(page + '-page-link').classList.add('active');

  movies.getAllMovies();
}

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

  if (movies.page === 'watched') {
    movies.saveWatched(movie.imdbID, true);
  }

  movies.getAllMovies();
}

movies.getAllMovies = async () => {
  try {
    const moviesRef = ref(db, 'movies');
    const snapshot = await get(moviesRef);
    let moviesArr = [];

    snapshot.forEach((childSnapshot) => {
      const movie = childSnapshot.val();

      if (movies.page === 'movies'
          || ( movies.page === 'watched' && movies.userWatchedMovies.includes(movie.imdbID))) {
        moviesArr.push(movie);
      }
    });

    movies.movies = moviesArr;
    movies.sortMovies();
  } catch (error) {
    console.error(error);
  }
}

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

    const watchedButton = document.createElement('button');
    if (movies.userWatchedMovies.includes(movie.imdbID)) {
      watchedButton.className = 'btn accent watched-button';
      watchedButton.innerHTML = 'Unwatch';
    }
    else {
      watchedButton.className = 'btn watched-button';
      watchedButton.innerHTML = 'Watched';
    }
    watchedButton.onclick = (e) => { movies.toggleWatched(e, movie.imdbID); };

    buttonsDiv.appendChild(watchedButton);

    if (movies.page === 'movies') {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn danger delete-button';
      deleteButton.innerHTML = 'Delete';
      deleteButton.onclick = () => { movies.deleteMovie(movie.imdbID) };

      buttonsDiv.appendChild(deleteButton);
    } else {
      buttonsDiv.appendChild(document.createElement('div'));
    }
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
  const url = `${omdbConfig.baseUrl}?apikey=${omdbConfig.apiKey}&i=${imdbID}&plot=full`;

  try {
    const response = await fetch(url);
    const data = await response.json();


    document.getElementById('md-info-title').innerHTML = data.Title;
    document.getElementById('md-info-year').innerHTML = data.Year;
    document.getElementById('md-info-runtime').innerHTML = data.Runtime;
    document.getElementById('md-poster-desktop').src = data.Poster;
    document.getElementById('md-poster-mobile').src = data.Poster;

    document.getElementById('md-info-plot').innerHTML = data.Plot;

    const populateRow = (rowElement, data) => {
      rowElement.innerHTML = '';
      (data || '').split(',').forEach((item) => {
        const badge = document.createElement('span');
        badge.className = 'info-badge';
        badge.innerHTML = item.trim();
        rowElement.appendChild(badge);
      });
    };

    populateRow(document.getElementById('md-info-director'), data.Director);
    populateRow(document.getElementById('md-info-writer'), data.Writer);
    populateRow(document.getElementById('md-info-actors'), data.Actors);
    populateRow(document.getElementById('md-info-genres'), data.Genre);
    populateRow(document.getElementById('md-info-language'), data.Language);

    let ratingsRow = document.getElementById('md-info-ratings');
    ratingsRow.innerHTML = '';

    const addRatingBadge = (ratingsRow, ratingSite, ratingValue) => {
      let ratingBadge = document.createElement('span');
      ratingBadge.className = 'info-badge';
      ratingBadge.innerHTML = '<b>' + ratingSite + ':</b> ' + ratingValue;
      ratingsRow.appendChild(ratingBadge);
    };

    if (data.imdbRating) {
      addRatingBadge(ratingsRow, 'IMDB', data.imdbRating);
    }
    
    let rottenTomatoesRating = data.Ratings.find((rating) => rating.Source === 'Rotten Tomatoes')?.Value;
    if (rottenTomatoesRating) {
      addRatingBadge(ratingsRow, 'Rotten Tomatoes', rottenTomatoesRating);
    }

    if (data.Metascore) {
      addRatingBadge(ratingsRow, 'Metacritic', data.Metascore);
    }

    document.getElementById('page').style.display = 'none';
    document.getElementById('movie-details-page').style.display = 'block';

  } catch (error) {
    console.error(error);
  }
}

movies.closeMovieDetails = () => {
  document.getElementById('page').style.display = 'block';
  document.getElementById('movie-details-page').style.display = 'none';
}

movies.toggleWatched = async (event, imdbID) => {
  try {
    let watched = movies.userWatchedMovies.includes(imdbID);
    watched = !watched;

    await movies.saveWatched(imdbID, watched);

    if (watched) {
      event.target.className = "btn accent watched-button";
      event.target.innerHTML = "Unwatch";
    } else {
      if (movies.page === 'watched') {
        movies.movies = movies.movies.filter((movie) => movie.imdbID !== imdbID);
        movies.renderMoviesList();
      }
      else {        
        event.target.className = "btn watched-button";
        event.target.innerHTML = "Watched";
      }
    }
  } catch (error) {
    alert('Error marking movie as watched');
  }
}

movies.saveWatched = async (imdbID, watched) => {
  try {
    const moviesRef = ref(db, `userWatchedMovies/${movies.user.id}`);
    const snapshot = await get(moviesRef);
    let moviesArr = snapshot.val() || [];

    if (moviesArr.includes(imdbID)
        && !watched) {
      moviesArr = moviesArr.filter((id) => id !== imdbID);
    } else if (!moviesArr.includes(imdbID)
               && watched) {
      moviesArr.push(imdbID);
    }

    movies.userWatchedMovies = moviesArr;
    await set(ref(db, `userWatchedMovies/${movies.user.id}`), moviesArr);
  } catch (error) {
    alert('Error marking movie as watched');
  }
}

movies.deleteMovie = async (imdbID) => {
  let confirm = window.confirm('Are you sure you want to delete this movie?');
  if (!confirm) {
    return;
  }

  await set(ref(db, `movies/${imdbID}`), null);
  movies.getAllMovies();
}