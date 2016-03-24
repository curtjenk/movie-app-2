var baseURL = 'https://api.themoviedb.org/3/';
var apiKey = 'api_key=2d9e9aacbdc397236dad8339b3d2c17c';
var totalPagesNowPlaying = 0;
var methodNowPlaying = 'movie/now_playing';
var methodSearchAll = 'search/------?query=';
var methodSearchMovie = 'search/movie?query=';
var methodSearchTV = 'search/tv?query=';
var methodSearchPerson = 'search/person?query=';
var methodPopular = 'movie/popular';
var methodTopRated = 'movie/top_rated';
var methodUpcoming = 'movie/upcoming';
var typeAheadSource = [];
var imageBaseURL = '';
var imgClassAttr = 'data-toggle="modal" data-target="#myModal" class="img-thumbnail img-responsive img-launch-modal movie"';

$(document).ready(function() {
    getImagesBaseURL();
    getNowPlaying();
    getListOfMovies();
    // $('input[type="submit"').click(search);
    $('#movie-search-form').submit(function() {

        search();
        event.preventDefault(); //don't let the form submit
    });
    $("#search-val").autocomplete({ source: typeAheadSource });


});

function search() {
    var searchTerm = $('input[type="text').val();
    if (searchTerm.length < 1 || searchTerm === null || searchTerm === "") return;

    var searchURL = '';
    var searchBy = $('#search-by').val();
    switch (searchBy) {
        case 'all':
        case 'tv':
            searchURL = baseURL + methodSearchTV + searchTerm + '&' + apiKey;
            break;
        case 'movie':
            searchURL = baseURL + methodSearchMovie + searchTerm + '&' + apiKey;
            break;
        case 'person':
            searchURL = baseURL + methodSearchPerson + searchTerm + '&' + apiKey;
            break;
        default:
            searchURL = baseURL + methodSearchMovie + searchTerm + '&' + apiKey;
    }
    searchURL = encodeURI(searchURL);
    // console.log(searchURL);
    $.getJSON(searchURL, populatePosterGrid);
}

function getNowPlaying() {
    var nowPlayingURL = baseURL + methodNowPlaying + '?' + apiKey;
    // console.log(nowPlayingURL);
    $.getJSON(nowPlayingURL, function(movieData) {
        totalPagesNowPlaying = movieData.total_pages;
        //console.log(movieData);
        //console.log('Total Pages Now Playing = ' + totalPagesNowPlaying);
        populatePosterGrid(movieData);

        //get page 2
        $.getJSON(nowPlayingURL + '&page=2', function(movieData) {
            populateTypeAheadSource(movieData);
            //get page 3
            $.getJSON(nowPlayingURL + '&page=3', function(movieData) {
                populateTypeAheadSource(movieData);
            });
        });

    });
}

function populateTypeAheadSource(movieData) {
    var resultsLength = movieData.results.length;

    for (i = 0; i < resultsLength; i++) {
        var title = movieData.results[i].title;
        if ($.inArray(title, typeAheadSource) === -1) typeAheadSource.push(title);
    }
}

function getImagesBaseURL() {
    var configURL = baseURL + 'configuration' + '?' + apiKey;
    $.getJSON(configURL, function(configData) {
        imageBaseURL = configData.images.base_url;
        // console.log(configData.images.base_url);
    });
}
// used to populate the type ahead for searching
// only called at startup!!!
function getListOfMovies() {

    var popularURL = baseURL + methodPopular + '?' + apiKey;
    var topRatedURL = baseURL + methodTopRated + '?' + apiKey;
    var upcomingURL = baseURL + methodUpcoming + '?' + apiKey;
    var movieNames = [];
    $.getJSON(popularURL, function(list) {
        populateTypeAheadSource(list);

        $.getJSON(topRatedURL, function(list) {
            populateTypeAheadSource(list);

            $.getJSON(upcomingURL, function(list) {
                populateTypeAheadSource(list);
            });

        });
    });
}

function populatePosterGrid(data) {

    var newHtml = '';
    var searchBy = $('#search-by').val();
    switch (searchBy) {
        case 'all':
        case 'tv':
        case 'movie':
            newHtml = popGridMovieData(data);
            break;
        case 'person':
            // different format;
            console.log('----------- Person Search results ----------');
            console.log(data);
            newHtml = popGridPersonData(data);
            break;
        default:
            newHtml = popGridMovieData(data);
    }

    $('#poster-grid').html(newHtml);
}

function popGridMovieData(data) {
    var resultsLength = data.results.length;
    var movieHtml = "";
    for (i = 0; i < resultsLength; i++) {
        var title = data.results[i].title;
        var posterPath = data.results[i].poster_path;
        var uniqueId = data.results[i].id;
        var mediaType = data.results[i].media_type;

        var imgSrc = imageBaseURL + 'w300' + posterPath;

        if (posterPath) {
            movieHtml += '<div class="col-md-2 col-sm-2">';
            movieHtml += '<img ' + imgClassAttr + ' id="' + uniqueId + '" ' + mediaType + ' src="' + imgSrc + '">';
            movieHtml += '</div>';
        }
        //Continue "learning" -- populating the typeAheadSource
        if ($.inArray(title, typeAheadSource) === -1) typeAheadSource.push(title);
    }
    return movieHtml;
}
//todo: use mediaType to get the correct details to fill the modal
//todo: show cast in the modal (??maybe)
function popGridPersonData(data) {
    var resultsLength = data.results.length;
    var newHtml = "";
    for (i = 0; i < resultsLength; i++) {
        for (y = 0; y < data.results[i].known_for.length; y++) {
            var title = data.results[i].known_for[y].title;
            var posterPath = data.results[i].known_for[y].poster_path;
            var uniqueId = data.results[i].known_for[y].id;
            var mediaType = data.results[i].known_for[y].media_type;

            var imgSrc = imageBaseURL + 'w300' + posterPath;

            if (posterPath) {
                newHtml += '<div class="col-md-2 col-sm-2">';
                newHtml += '<img ' + imgClassAttr + ' id="' + uniqueId + '" ' + mediaType + ' src="' + imgSrc + '">';
                newHtml += '</div>';
            }
            //Continue "learning" -- populating the typeAheadSource
            if ($.inArray(title, typeAheadSource) === -1) typeAheadSource.push(title);
        }
    }
    return newHtml;
}

//modal stuff
$('#poster-grid').on('click', 'div > img', function() {
    // alert('do modal');
    var currImageId = $(this).attr('id');
    var infoURL = baseURL + 'movie/' + currImageId + '?' + apiKey;
    var reviewURL = baseURL + 'movie/' + currImageId + '/reviews?' + apiKey;

    //Get the info on the selected/clicked movie
    $.getJSON(infoURL, function(movieData) {
        // console.log(movieData);
        $('.modal-title').html(movieData.title);
        var releaseDate = movieData.release_date;
        var overview = movieData.overview;
        var movieHtml = "";
        movieHtml = '<h4>Released</h4>';
        movieHtml += '<p class="indent">' + releaseDate + '</p>';
        if (overview) {
            movieHtml += '<h4>Overview</h4>';
            movieHtml += '<p class="indent">' + overview + '</p>';
        }
        $('.modal-body').html(movieHtml);
    });
    //Now retrieve movie reviews
    $.getJSON(reviewURL, function(movieData) {
        if (movieData.results.length > 0) {
            $('.modal-body').append('<h4>Reviews</h4>');
        }
        for (var i = 0; i < movieData.results.length; i++) {
            $('.modal-body').append('<p style="font: italic bold 12px/30px Georgia, serif;">' + movieData.results[i].author + '</p>');
            $('.modal-body').append('<p  class="indent">' + movieData.results[i].content + '</p>');
        }
    });
});
