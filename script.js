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

        for (interval of intervals) {
            clearInterval(interval);
        }
        intervals = [];

        if (this.id === "live_reports") {
            go_to_live_reports()
        }
    });

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
            <div class="add-icon pointer" id="button_${coin.id}" onclick="add_coin(this)"></div>
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

    function go_to_live_reports() {

        const coin_ids = $(".coins .add-icon.selected").toArray().map(e => e.id.slice(7));
        const ctx = $("<canvas/>");
        $("#coins_graph").html("").append(ctx);

        const colors = ['#ff9f40', '#ffcd56', '#c9cbcf', '#ff6384', '#36A2EB'];

        const coins = {};
        for (let i = 0; i < coin_ids.length; ++i) {
            let id = coin_ids[i];
            let color = colors[i % colors.length];
            coins[id] = {
                label: coin_name_from_button(`button_${id}`),
                data: [],
                borderColor: color,
                backgroundColor: color,
            };
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: Object.values(coins)
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'To USD'
                    }
                }
            }
        });

        intervals.push(
            setInterval(async () => {
                await update_graph(chart, coins);
            }, 1000)
        );
    }

    async function update_graph(chart, coins) {
        console.log("click");
        const prices = await get_chart_prices(Object.keys(coins));
        for (id in coins) {
            coins[id].data.push(prices[id]);
        }
        chart.data.labels.push(format_time(new Date()));
        chart.update();
    }

    function format_time(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    async function get_chart_prices(ids) {
        ids_string = "";
        for (id of ids) {
            ids_string += `,${id}`;
        }
        const prices = await get_json(`https://api.coingecko.com/api/v3/simple/price?ids=${ids_string.slice(1)}&vs_currencies=usd`);
        for (id in prices) {
            prices[id] = prices[id].usd;
        }
        return prices;
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

function add_coin(button) {
    $(button).toggleClass("selected");
    $(button).addClass("data-target='modal-example' onClick='toggleModal(event)'");

    const selected_button_ids = $(".coins .add-icon.selected").map((_, e) => e.id);
    if (selected_button_ids.length === 5) {
        $("#live_reports").removeClass("disabled");
    } else if (selected_button_ids.length >= 6) {
        too_many_coins(button, selected_button_ids);
    } else {
        $("#live_reports").addClass("disabled");
    }
}

function too_many_coins(last_selected_button, selected_button_ids) {
    const selected_coins = {};

    for (const selected_button_id of selected_button_ids) {
        if (selected_button_id !== last_selected_button.id) {
            selected_coins[coin_name_from_button(selected_button_id)] = selected_button_id;
        }
    }
    dialog = $("#selected-coins-modal");
    fill_modal_content(dialog, coin_name_from_button(last_selected_button.id), selected_coins);
    open_modal(dialog);

    dialog.find("input[type=radio]").on("click", () => dialog.find("#confirm").attr("disabled", false));

    dialog.find("#cancel, #close").on("click", e => cancel_too_many_coins(e.currentTarget, last_selected_button));
}

function fill_modal_content(dialog, name, selected_coins) {

    let checkboxes = '';
    for (const key in selected_coins) {
        checkboxes += `<div class="checkbox-coin"> <input data-button-id=${selected_coins[key]} type="radio" name="remove_coin"/> <label for="">${key}</label></div>`
    }
    dialog.html(`
    <article>
        <a href="#close" aria-label="Close" class="close" data-target="selected-coins-modal" id="close"></a>
        <div class="selected-coins">
        <hgroup>
            <h5>You must select 5 coins only.</h5>
            <p>You have selected <strong>${name}</strong>, which of these would you like it to replace?</p>
        </hgroup>
        ${checkboxes}
        </div>
        <footer>
            <a href="#cancel" role="button" class="secondary" data-target="selected-coins-modal" id="cancel">Cancel</a>
            <a href="#confirm" role="button" data-target="selected-coins-modal" id="confirm"
            onclick="confirm_too_many_coins(this)" disabled>
            Confirm
            </a>
        </footer>
    </article>`);
}

function coin_name_from_button(button_id) {
    return $("#" + button_id).siblings("hgroup").children("h4").text();
}

function open_modal(dialog) {
    $("html").addClass("modal-is-opening");
    dialog.attr("open", true);
    setTimeout(() => {
        $("html").removeClass("modal-is-opening").addClass("modal-is-open");
    }, 800);
}

function confirm_too_many_coins(confirm_button) {
    close_modal(confirm_button);
    const button_id = $("input[type='radio'][name='remove_coin']:checked").data("button-id");
    $("#" + button_id).removeClass("selected");
}

function cancel_too_many_coins(cancel_button, last_selected_button) {
    $(last_selected_button).removeClass("selected");
    close_modal(cancel_button);
}

function close_modal(button) {
    $("html").addClass("modal-is-closing");
    setTimeout(() => {
        $(button).parents("dialog").attr("open", null);
        $("html").removeClass("modal-is-closing modal-is-open");
    }, 800);
}

function get_json(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url,
            success: resolve,
            error: error => reject(error.statusText)
        });
    });
}