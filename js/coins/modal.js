/// <reference path="/home/deborah/.local/share/jquery-3.7.0.js"/>

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

    dialog.find("input[type=checkbox]").on("click", () => {
        dialog.find("#confirm").attr("disabled", $("input[type=checkbox]:not(:checked)").length === 0);
    });

    dialog.find("#cancel, #close").on("click", e => cancel_too_many_coins(e.currentTarget, last_selected_button));
}

function fill_modal_content(dialog, name, selected_coins) {
    //  TODO!! cambiar radio a checkbox
    let checkboxes = '';
    for (const key in selected_coins) {
        checkboxes += `<div class="checkbox-coin"> <input data-button-id=${selected_coins[key]} type="checkbox" name="remove_coin" checked/> <label for="">${key}</label></div>`
    }
    dialog.html(`
    <article>
        <a href="#close" aria-label="Close" class="close" data-target="selected-coins-modal" id="close"></a>
        <div class="selected-coins">
        <hgroup>
            <h5>You must select up to 5 coins only.</h5>
            <p>You have selected <strong>${name}</strong>, which of these would you like it to keep?</p>
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
    const button_ids = $("input[type='checkbox'][name='remove_coin']:not(:checked)")
        .map((_, e) => $(e).data("button-id"));

    for (const id of button_ids) {
        $("#" + id).trigger("click");
    }
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