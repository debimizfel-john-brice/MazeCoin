/// <reference path="/home/deborah/.local/share/jquery-3.7.0.js"/>

$(() => {
    $(window).on("scroll", function () {
        $(".background").css("background-position-y", `${window.scrollY * 0.4}px`);
    });

    let intervals = [];

    $(".nav-option").on("click", function () {
        if ($(this).hasClass("disabled") || $(this).hasClass("active")) {
            return;
        }

        $(".nav-option.active").removeClass("active");
        $(this).addClass("active");

        $(".page.active").removeClass("active");
        $($(this).data("page")).addClass("active");

        for (let interval of intervals) {
            clearInterval(interval);
        }
        intervals = [];

        if (this.id === "nav_live_reports") {
            go_to_live_reports(intervals);
        }

        $("#search-input").attr("disabled", this.id !== "nav_coins");

    });
});

function get_json(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url,
            success: resolve,
            error: error => reject(error.statusText)
        });
    });
}