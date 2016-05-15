// may minimize for production?

$(document).ready(function() {
    var jumbotron = $('.jumbotron');
    var top = jumbotron.offset().top;
    var height = jumbotron.outerHeight();
    var nav_height = $('#bs-navbar').outerHeight();
    var limit = top + height - nav_height;
    var $window = $(window);
    var $nav = $('#bs-navbar');
    var timer;

    function handleScroll() {
        if ($window.scrollTop() > limit) {
            $nav.addClass('scroll-past-jumbotron');
        } else {
            $nav.removeClass('scroll-past-jumbotron');
        }
    }

    $window.scroll(function() {
        handleScroll();
    })

    $('#nav-button').click(function() {
        $nav.toggleClass('nav-button-pressed');
    })
});
