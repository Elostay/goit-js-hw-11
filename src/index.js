import Notiflix from 'notiflix';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import './styles.css';
// const axios = require('axios');

const form = document.querySelector('.search-form');
const gallery = document.querySelector('.gallery');
const target = document.querySelector('.js-guard');

const BASE_URL = 'https://pixabay.com/api/';
const API_KEY = '39827869-ea8193496bafc954651761ff2';
const lightbox = new SimpleLightbox('.gallery a', {
  close: false,
  showCounter: false,
});
const optionsObserver = {
  root: null,
  rootMargin: '200px',
  threshold: 1.0,
};

form.addEventListener('submit', onSubmit);

let observer = new IntersectionObserver(observerScroll, optionsObserver);
let currentPage = 1;
let searchQuery;
function observerScroll(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      currentPage += 1;

      getTrending()
        .then(resp => {
          Notiflix.Notify.info(
            `Hooray! We found ${resp.data.totalHits - currentPage * 40} images.`
          );

          gallery.insertAdjacentHTML('beforeend', createMarkup(resp.data.hits));
          lightbox.refresh();
          const { height: cardHeight } =
            gallery.firstElementChild.getBoundingClientRect();

          window.scrollBy({
            top: cardHeight * 2,
            behavior: 'smooth',
          });

          if (currentPage * 40 >= resp.data.totalHits) {
            observer.unobserve(target);
          }
        })
        .catch(err => console.log(err));
    }
  });
}

async function onSubmit(e) {
  e.preventDefault();
  currentPage = 1;
  searchQuery = form.elements.searchQuery.value;
  if (form.elements.searchQuery.value === '') {
    return Notiflix.Notify.warning('Enter something');
  }

  const response = await getTrending();
  const dataArray = response.data.hits; // масив об'єктів

  if (dataArray.length === 0) {
    return Notiflix.Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  }
  gallery.innerHTML = createMarkup(dataArray);

  lightbox.refresh();
  observer.observe(target);

  form.reset();
}

function getTrending() {
  const params = new URLSearchParams({
    key: API_KEY,
    q: searchQuery,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    per_page: 40,
    page: currentPage,
  });
  return axios.get(`${BASE_URL}?${params}`);
}

function createMarkup(dataArray) {
  return dataArray
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<a href="${largeImageURL}"><div class="photo-card">
		  
		  <div class="thumb">

  <img src="${webformatURL}" alt="${tags}" loading="lazy" /></div>
  <div class="info">
    <p class="info-item">
      <b>Likes: ${likes}</b>
    </p>
    <p class="info-item">
      <b>Views: ${views}</b>
    </p>
    <p class="info-item">
      <b>Comments: ${comments}</b>
    </p>
    <p class="info-item">
      <b>Downloads: ${downloads}</b>
    </p>
  </div>
  
</div></a>`;
      }
    )
    .join('');
}
