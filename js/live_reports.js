/// <reference path="/home/deborah/.local/share/jquery-3.7.0.js"/>

function go_to_live_reports(intervals) {
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
    const prices = await get_chart_prices(Object.keys(coins));
    for (id in coins) {
        coins[id].data.push(prices[id]);
    }

    chart.data.labels.push(format_time(new Date()));
    chart.update();

    for (id in coins) {
        if (coins[id].data.length > 10) {
            coins[id].data.shift();
        }
    }

    if (chart.data.labels.length > 10) {
        chart.data.labels.shift();
    }

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
