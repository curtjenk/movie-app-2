var baseURL = 'https://api.themoviedb.org/3/';
var apiKey = 'api_key=2d9e9aacbdc397236dad8339b3d2c17c';
var totalPagesNowPlaying = 0;
var methodNowPlaying = 'movie/now_playing';
var methodSearch = 'search/movie?query=';
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
    var movieSearchTerm = $('input[type="text').val();
    var searchURL = baseURL + methodSearch + movieSearchTerm + '&' + apiKey;
    $.getJSON(searchURL, populatePosterGrid);
}

function getNowPlaying() {
    var nowPlayingURL = baseURL + methodNowPlaying + '?' + apiKey;
    console.log(nowPlayingURL);
    $.getJSON(nowPlayingURL, function(movieData) {
        totalPagesNowPlaying = movieData.total_pages;
        console.log(movieData);
        console.log('Total Pages Now Playing = ' + totalPagesNowPlaying);
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

                // console.log(typeAheadSource);
                // console.log(typeAheadSource.length);
            });

        });
    });
}

function populatePosterGrid(movieData) {

    var resultsLength = movieData.results.length;
    var movieHtml = "";
    for (i = 0; i < resultsLength; i++) {
        var title = movieData.results[i].title;
        var posterPath = movieData.results[i].poster_path;
        var uniqueId = movieData.results[i].id;

        var imgSrc = imageBaseURL + 'w300' + posterPath;

        if (posterPath) {
            movieHtml += '<div class="col-md-2 col-sm-2">';
            movieHtml += '<img ' + imgClassAttr + ' id="' + uniqueId + '"  src="' + imgSrc + '">';
            movieHtml += '</div>';
        }
        // else 
        // {
        //     console.log(title + " : " + posterPath);
        // }
        //begin populating the typeAheadSource
        if ($.inArray(title, typeAheadSource) === -1) typeAheadSource.push(title);
    }
    $('#poster-grid').html(movieHtml);
}

//modal stuff
    $('#poster-grid').on('click', 'div > img', function() {
 // alert('do modal');
        var currImageId = $(this).attr('id');
        var infoURL = baseURL + 'movie/' + currImageId + '?' + apiKey;
        var reviewURL = baseURL + 'movie/' + currImageId + '/reviews?' + apiKey;

        //Get the info on the selected/clicked movie
        $.getJSON(infoURL, function(movieData) {
            console.log(movieData);
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