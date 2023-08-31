/// <reference path="/home/deborah/.local/share/jquery-3.7.0.js"/>

$(() => {

    $("#search-input").on("input", async function () {
        await get_coins($(this).val());
    });

    $("#search-input").on("keypress", function (event) {
        if (event.key == "Enter") {
            $(this).trigger("blur");
        }
    });

    async function get_coins(search = "") {
        $(".coins").attr("aria-busy", true).html("");
        try {
            const url = search === "" ? "https://api.coingecko.com/api/v3/coins/markets?order=market_cap_desc&vs_currency=usd" : `https://api.coingecko.com/api/v3/search?query=${search}`;
            const data = await get_json(url);
            display_coins(data.coins === undefined ? data : data.coins);
        } catch (error) {
            show_error(".coins", error);
        }
        $(".coins").attr("aria-busy", false);

    }
    get_coins();

    function display_coins(coins) {
        let body = '';
        if (coins.length === 0) {
            body = "No results found";
        }
        for (const coin of coins.slice(0, 100)) {
            body += coin_html(coin);
        }

        $(".coins").html(body);
    }

    function coin_html(coin) {
        return `
        <article id="coin_${coin.id}">
            <main>
            <div class="add-icon pointer" id="button_${coin.id}" onclick="toggle_coin(this)"></div>
            <hgroup>
                <h3>${coin.symbol}</h3>
                <h4 class="ellipsis" title="${coin.name}">${coin.name}</h4>
            </hgroup>
            </main>
            <footer>
            <details ontoggle="get_prices(this, '${coin.id}')">
                <summary>Prices</summary>
                <div class="prices"></div>
            </details>
            </footer>
        </article>`;
    }

    function show_error(selector, error) {
        $(selector).html(
            `<hgroup>
                <h3>Sorry, an error occurred.</h3>
                <h4>Error: ${error.message}.</h4>
            </hgroup>`
        );
    }
});

async function get_prices(details, id) {
    if ($(details).attr("open") === undefined) {
        return;
    }

    const timestamp = $(details).data("timestamp");
    if (timestamp !== undefined && (new Date() - new Date(timestamp)) < 2 * 60 * 1000) {
        return;
    }
    $(details).data("timestamp", new Date().toString());

    const prices = $(details).children(".prices");
    prices.attr("aria-busy", true).html("");

    const data = await get_json(`https://api.coingecko.com/api/v3/coins/${id}`);

    display_prices(prices, data);
    prices.attr("aria-busy", false);
}

function display_prices(prices, coin) {
    const price_data = coin.market_data.current_price;
    prices.html(`
    <div>
        <div class="currency eur">${price_data.eur}</div>
        <div class="currency ils">${price_data.ils}</div>
        <div class="currency usd">${price_data.usd}</div>
    </div>
    <img src = "${coin.image.small}"/>
`);
}

function toggle_coin(button) {
    $(button).toggleClass("selected");
    $(button).addClass("data-target='modal-example' onClick='toggleModal(event)'");

    const selected_button_ids = $(".coins .add-icon.selected").map((_, e) => e.id);
    if (selected_button_ids.length <= 5 && selected_button_ids.length > 0) {
        $("#nav_live_reports").removeClass("disabled");
    } else if (selected_button_ids.length >= 6) {
        too_many_coins(button, selected_button_ids);
    } else {
        $("#nav_live_reports").addClass("disabled");
    }
}

async function get_prices(details, id) {
    if ($(details).attr("open") === undefined) {
        return;
    }

    const timestamp = $(details).data("timestamp");
    if (timestamp !== undefined && (new Date() - new Date(timestamp)) < 2 * 60 * 1000) {
        return;
    }
    $(details).data("timestamp", new Date().toString());

    const prices = $(details).children(".prices");
    prices.attr("aria-busy", true).html("");

    const data = await get_json(`https://api.coingecko.com/api/v3/coins/${id}`);

    display_prices(prices, data);
    prices.attr("aria-busy", false);
}

function display_prices(prices, coin) {
    const price_data = coin.market_data.current_price;
    prices.html(`
    <div>
        <div class="currency eur">${price_data.eur}</div>
        <div class="currency ils">${price_data.ils}</div>
        <div class="currency usd">${price_data.usd}</div>
    </div>
    <img src = "${coin.image.small}"/>
`);
}
