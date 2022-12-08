import { Notify } from 'notiflix';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const API_KEY = '27227070-2daccb9679d1d87f210af339a';
const BASE_URL = 'https://pixabay.com/api/';
const PARAMS =
  'image_type=photo&orientation=horizontal&safesearch=true&per_page=40';

const refs = {
  form: document.querySelector('.search-form'),
  input: document.querySelector('input'),
  loadMore: document.querySelector('.load-more'),
  gallery: document.querySelector('.gallery'),
  guard: document.querySelector('.js-guard'),
};

const options = {
  root: null,
  rootMargin: '300px',
  threshold: 1.0,
};

const observer = new IntersectionObserver(onLoad, options);

const lightbox = new SimpleLightbox('.gallery a', {});

let page = 1;

refs.form.addEventListener('submit', onFormSubmit);

function onFormSubmit(evt) {
  evt.preventDefault();
  refs.gallery.innerHTML = '';
  page = 1;
  requestAPI()
    .then(data => {
      if (data.totalHits === 0) {
        Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
      } else {
        Notify.success(`Hooray! We found ${data.totalHits} images.`);
      }
      refs.gallery.insertAdjacentHTML(
        'beforeend',
        createMarkup(data.hits)
      );
      lightbox.refresh();
      smoothScroling();
      observer.observe(refs.guard);
    })
    .catch(err => {
      Notify.failure(`${err}`);      
    });
}

async function requestAPI() {
  const resp = await axios.get(
    `${BASE_URL}?key=${API_KEY}&q=${refs.input.value}&${PARAMS}&page=${page}`
  );
  if ((resp.status < 200) & (resp.status > 299)) {
    throw new Error(resp.statusText);
  }
  return resp.data;
}

function createMarkup(arr) {
  return arr.map(({largeImageURL, webformatURL, tags, likes, views, comments, downloads}) => `<div class='photo-card'>
  <div class='thumb'>
    <a href='${largeImageURL}' class='photo-link'>
      <img src='${webformatURL}' alt='${tags}' loading='lazy' width='350' />
    </a>
  </div>
  <div class='info'>
    <p class='info-item'>
      <b>Likes</b>
      ${likes}
    </p>
    <p class='info-item'>
      <b>Views</b>
      ${views}
    </p>
    <p class='info-item'>
      <b>Comments</b>
      ${comments}
    </p>
    <p class='info-item'>
      <b>Downloads</b>
      ${downloads}
    </p>
  </div>
</div>`).join('');
}

function smoothScroling() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function onLoad(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      page += 1;
      requestAPI()
        .then(data => {
          refs.gallery.insertAdjacentHTML(
            'beforeend',
            createMarkup(data.hits)
          );
          lightbox.refresh();
          smoothScroling();
          observer.observe(refs.guard);
          if (page === Math.ceil(data.totalHits / 40)) {
            Notify.info(
              "We're sorry, but you've reached the end of search results."
            );
            observer.unobserve(refs.guard);
          }
        })
        .catch(err => {
          Notify.failure(`${err}`);
        });
    }
  });
}
