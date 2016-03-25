var baseURL = 'https://api.themoviedb.org/3/';
var imageBaseURL = ''; //Set by calling the configuration endpoint
var apiKey = 'api_key=2d9e9aacbdc397236dad8339b3d2c17c';
var totalPagesNowPlaying = 0;
var methodNowPlaying = 'movie/now_playing';
var methodSearchMulti = 'search/multi?query=';
var methodSearchMovie = 'search/movie?query=';
var methodSearchTV = 'search/tv?query=';
var methodSearchPerson = 'search/person?query=';
var methodPopular = 'movie/popular';
var methodTopRated = 'movie/top_rated';
var methodUpcoming = 'movie/upcoming';
var methodGenreMovieList = 'genre/movie/list';
var methodGenreTVList = 'genre/tv/list';
var typeAheadSource = []; //Use for Autocomplete datasourec
var genres = {}; //hashmap that contains the genre id (key) and genre name (value)

var genreMovieListURL = encodeURI(baseURL + methodGenreMovieList + '?' + apiKey);
var genreTVListURL = encodeURI(baseURL + methodGenreTVList + '?' + apiKey);
var imgClassAttr = 'data-toggle="modal" data-target="#myModal" class="img-thumbnail img-responsive img-launch-modal movie"';


$(document).ready(function() {
    getImagesBaseURL();
    loadGenreList();
    getNowPlaying();
    getListOfMovies();
    $('#movie-search-form').submit(function() {
        search();
        event.preventDefault(); //don't let the form submit
    });
    $("#search-val").autocomplete({ source: typeAheadSource });

    $("#search-by").change(function() {
        //todo: create typeAhead sources 1 for each type then swap out the autocomplete source.
    });

    // ---------- begin Isotope setup ---------------
    //create Isotope events 
    $("#genre-buttons").on("click", 'input', function() {
        var filter = '';
        var id = $(this).attr('id');
        console.log(id);
        if (id === 'All') {
            filter = '*';
        } else {
            var parts = id.split(' ', 3);
            // console.log(parts);
            for (var y = 0; y < parts.length; y++) {
                if (parts[y].length > 0) {
                    filter += '.' + parts[y];
                }
            }
            // console.log(filter);
        }

        $('#poster-grid').isotope({ filter: filter });
        console.log("genre button clicked");
    });
});

function loadGenreList() {
    $.getJSON(genreMovieListURL, function(data) {
        //console.log(data);
        var genreHTML = '';
        for (var i = 0; i < data.genres.length; i++) {
            genres[data.genres[i].id] = data.genres[i].name;
        }
        // console.log(genres);

        $.getJSON(genreTVListURL, function(data) {
            for (i = 0; i < data.genres.length; i++) {
                genres[data.genres[i].id] = data.genres[i].name;
            }
            // console.log(genres);
            genreHTML += '<input type="button" id="All" class="btn btn-default" value="All">';
            $.each(genres, function(k, v) {
                genreHTML += '<input type="button" id="' + v.replace('&', '') + '" class="btn btn-default" value="' + v.replace('&', '') + '">';
            });


            $('#genre-buttons').html(genreHTML);

        });

    });
}

function search() {

    var searchTerm = $('input[type="text').val();
    if (searchTerm.length < 1 || searchTerm === null || searchTerm === "") return;

    $('#poster-grid').isotope('destroy');

    var searchURL = '';
    var searchBy = $('#search-by').val();
    switch (searchBy) {
        case 'all':
            searchALL(searchTerm);
            break;
        case 'tv':
            searchMovieTV(methodSearchTV, searchTerm, 'tv');
            break;
        case 'movie':
            searchMovieTV(methodSearchMovie, searchTerm, 'movie');
            break;
        case 'person':
            searchPerson(searchTerm);
            break;
        default:
            searchMovieTV(methodSearchMovie, searchTerm);
    }
}

function searchALL(searchTerm) {
    var newHtml = '';
    var searchURL = encodeURI(baseURL + methodSearchTV + searchTerm + '&' + apiKey);

    $.getJSON(searchURL, function(data) {
        newHtml += popGridMovieTVData(data, 'tv');
        $.getJSON(searchURL + '&page=2', function(data) {
            newHtml += popGridMovieTVData(data, 'tv');

            searchURL = encodeURI(baseURL + methodSearchMovie + searchTerm + '&' + apiKey);
            $.getJSON(searchURL, function(data) {
                newHtml += popGridMovieTVData(data, 'movie');
                $.getJSON(searchURL + '&page=2', function(data) {
                    newHtml += popGridMovieTVData(data, 'movie');

                    searchURL = encodeURI(baseURL + methodSearchPerson + searchTerm + '&' + apiKey);
                    $.getJSON(searchURL, function(data) {
                        newHtml += popGridPersonData(data);
                        $.getJSON(searchURL + '&page=2', function(data) {
                            newHtml += popGridPersonData(data);
                            $('#poster-grid').html(newHtml);
                            initializeIsotope();
                        });
                    });
                });
            });
        });
    });
}

function searchMovieTV(whichMethod, searchTerm, media) {
    var newHtml = '';
    var searchURL = encodeURI(baseURL + whichMethod + searchTerm + '&' + apiKey);
    $.getJSON(searchURL, function(data) {
        newHtml = popGridMovieTVData(data, media);
        $.getJSON(searchURL + '&page=2', function(data) {
            newHtml += popGridMovieTVData(data, media);
            $.getJSON(searchURL + '&page=3', function(data) {
                newHtml += popGridMovieTVData(data, media);
                $('#poster-grid').html(newHtml);
                initializeIsotope();
            });
        });

    });
}

function searchPerson(searchTerm) {
    var newHtml = '';
    var searchURL = encodeURI(baseURL + methodSearchPerson + searchTerm + '&' + apiKey);
    $.getJSON(searchURL, function(data) {
        newHtml = popGridPersonData(data);
        $.getJSON(searchURL + '&page=2', function(data) {
            newHtml += popGridPersonData(data);
            $.getJSON(searchURL + '&page=3', function(data) {
                newHtml += popGridPersonData(data);
                $('#poster-grid').html(newHtml);
                initializeIsotope();
            });
        });
    });
}

//works for Movie and TV data
function popGridMovieTVData(data, media) {
    var resultsLength = data.results.length;
    var movieHtml = "";
    //console.log(data);
    for (i = 0; i < resultsLength; i++) {
        var title = data.results[i].title;
        var posterPath = data.results[i].poster_path;
        var uniqueId = data.results[i].id;
        var mediaType = media;

        var imgSrc = imageBaseURL + 'w300' + posterPath;

        // var tempMsg = "popGridMovieTVData " + i;
        // console.log(tempMsg);
        var genreAttrs = getGenreAttrs(data.results[i].genre_ids);

        if (posterPath) {
            movieHtml += '<div class="col-md-2 col-sm-2 now-playing ' + genreAttrs + '">';
            movieHtml += '<img ' + imgClassAttr + ' id="' + uniqueId + '" ' + 'media-type="' + mediaType + '" src="' + imgSrc + '">';
            movieHtml += '</div>';
        }
        //Continue "learning" -- populating the typeAheadSource
        if ($.inArray(title, typeAheadSource) === -1) typeAheadSource.push(title);


    }
    return movieHtml;
}

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
                newHtml += '<div class="col-md-2 col-sm-2 now-playing">';
                newHtml += '<img ' + imgClassAttr + ' id="' + uniqueId + '" ' + 'media-type="' + mediaType + '" src="' + imgSrc + '">';
                newHtml += '</div>';
            }
            //Continue "learning" -- populating the typeAheadSource
            if ($.inArray(title, typeAheadSource) === -1) typeAheadSource.push(title);
        }
    }
    return newHtml;
}

function getGenreAttrs(dataGenreArray) {
    // console.log(dataGenreArray);
    var attrs = '';
    for (var i = 0; i < dataGenreArray.length; i++) {
        if (attrs.length > 0) {
            attrs += ' ';
        }
        attrs += genres[dataGenreArray[i]];
    }
    // console.log(attrs);
    return attrs;
}

function initializeIsotope() {
   
    var theGrid = $('#poster-grid').isotope({
        // options
        itemSelector: '.now-playing'
            //layoutMode: 'fitRows'
    });

    theGrid.imagesLoaded().progress(function() {
        theGrid.isotope('layout');
    });
}

//get at least three pages for nowPlaying
function getNowPlaying() {
    var nowPlayingURL = encodeURI(baseURL + methodNowPlaying + '?' + apiKey);

    $.getJSON(nowPlayingURL, function(movieData) {
        totalPagesNowPlaying = movieData.total_pages;
        var newHtml = popGridMovieTVData(movieData, 'movie');
        //get page 2
        $.getJSON(nowPlayingURL + '&page=2', function(movieData) {
            newHtml += popGridMovieTVData(movieData, 'movie');
            populateTypeAheadSource(movieData);
            //get page 3
            $.getJSON(nowPlayingURL + '&page=3', function(movieData) {
                newHtml += popGridMovieTVData(movieData, 'movie');
                populateTypeAheadSource(movieData);
                $('#poster-grid').html(newHtml);
                initializeIsotope();
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
        //  console.log("image base Url = " + imageBaseURL);
    });
}
// used to populate the type ahead for searching
// only called at startup!!!
function getListOfMovies() {


    var topRatedURL = baseURL + methodTopRated + '?' + apiKey;
    var upcomingURL = baseURL + methodUpcoming + '?' + apiKey;
    var movieNames = [];
    for (i = 1; i < 6; i++) {
        var popularURL = baseURL + methodPopular + '?' + apiKey + '&page=' + i;
        $.getJSON(popularURL, function(list) {
            populateTypeAheadSource(list);
        });
    }
    $.getJSON(topRatedURL, function(list) {
        populateTypeAheadSource(list);
    });

    $.getJSON(upcomingURL, function(list) {
        populateTypeAheadSource(list);
    });
}

//modal stuff
$('#poster-grid').on('click', 'div > img', function() {
    // alert('do modal');
    var currImageId = $(this).attr('id');
    var mediaType = $(this).attr('media-type');


    var infoURL = baseURL + mediaType + '/' + currImageId + '?' + apiKey;
    var reviewURL = baseURL + mediaType + '/' + currImageId + '/reviews?' + apiKey;
    var creditsURL = baseURL + mediaType + '/' + currImageId + '/credits?' + apiKey;

    //Get the info on the selected/clicked movie
    $.getJSON(infoURL, function(movieData) {

        var title = '';
        var releaseDate = '';
        var overview = movieData.overview;
        var movieHtml = "";
        if (mediaType === 'tv') {
            title = movieData.name;
            releaseDate = movieData.first_air_date + " Through " + movieData.last_air_date + " With " + movieData.number_of_episodes + " episodes";
        } else {
            title = movieData.title;
            releaseDate = movieData.release_date;
        }

        movieHtml = '<h4>Released</h4>';
        movieHtml += '<p class="indent">' + releaseDate + '</p>';
        if (overview) {
            movieHtml += '<h4>Overview</h4>';
            movieHtml += '<p class="indent">' + overview + '</p>';
        }
        $('.modal-title').html(title);
        $('.modal-body').html(movieHtml);
    });
    //Now Cast and Crew information
    $.getJSON(creditsURL, function(data) {
        // console.log(data);
        if (data.cast.length > 0) {
            $('.modal-body').append('<h4>Cast</h4>');
            for (i = 0; i < data.cast.length; i++) {
                $('.modal-body').append('<div class="col-sm-6">' + data.cast[i].name + ' : ' + data.cast[i].character + '</div>');
            }
        }
        if (data.crew.length > 0) {
            $('.modal-body').append('<div style="clear: both;"><h4>Crew</h4></div>');
            for (i = 0; i < data.crew.length; i++) {
                $('.modal-body').append('<div class="col-sm-6">' + data.crew[i].name + ' : ' + data.crew[i].job + '</div>');
            }
        }
    });
    //Now retrieve movie reviews
    $.getJSON(reviewURL, function(movieData) {
        //console.log(movieData);
        if (movieData.results.length > 0) {
            $('.modal-body').append('<h4>Reviews</h4>');
        }
        for (var i = 0; i < movieData.results.length; i++) {
            $('.modal-body').append('<p style="font: italic bold 12px/30px Georgia, serif;">' + movieData.results[i].author + '</p>');
            $('.modal-body').append('<p  class="indent">' + movieData.results[i].content + '</p>');
        }
    });
});
