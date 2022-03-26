"use strict";

let game_is_active = false;
let previous_guesses = [];

const WORDS = new Set([
    'shallowest', 'newts', 'crippled', 'Amadeus',
    'sclerosis', 'dory', 'stink', 'prepares',
    'oration', 'abbess', 'philters', 'detainment',
    'shakedown', 'thriftily', 'abrogate'
]);

function set_button_states() {
    const valid_word = WORDS.has(document.getElementById('chosen-word').value);
    document.getElementById('start-game').setAttribute('disabled', game_is_active || !valid_word);
}

function start_game() {
    game_is_active = true;
    previous_guesses = [];
    document.getElementById('start-game').setAttribute('disabled', true);
    document.getElementById('chosen-word').readOnly = true;
    ask_computer_to_make_a_guess();
}

async function ask_computer_to_make_a_guess() {
    const new_guess = document.createElement('div');
    new_guess.classList.add('guess');
    new_guess.innerHTML = `
        <svg viewBox="0 0 100 100" class="loading">
            <circle cx="20" cy="50" r="15" fill="black" />
            <circle cx="65" cy="76" r="15" fill="black" />
            <circle cx="65" cy="24" r="15" fill="black" />
        </svg>
        <span class="loading-text">Computer is thinking</span>  
    `;
    document.getElementById('guesses').prepend(new_guess);

    try {
        const response = await fetch('https://meduyeket.net/eltnames.cgi', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(previous_guesses)
        });
        const result = await response.json();
        if (result.guess === document.getElementById('chosen-word').value) {
            new_guess.innerHTML = `
                <div class="guessed-word">${result.guess}</div>
                <div>Computer won after ${previous_guesses.length + 1} guesses</div>
            `;
        } else {
            new_guess.innerHTML = `
                <div class="guessed-word">${result.guess}</div>
                <input type="range" min="0" max="10" value="0">
                <div class="send-result"></div>
            `;
            new_guess.querySelector('input').addEventListener('input', function(event) {
                new_guess.querySelector('.send-result').innerText = event.target.value + ' 📨';
            });
            new_guess.querySelector('.send-result').addEventListener('click', function(event) {
                const score = parseInt(event.target.innerText.split(' ')[0]);
                if (!Number.isNaN(score)) {
                    new_guess.querySelector('input').disabled = true;
                    previous_guesses.push({guess: result.guess, score});
                    ask_computer_to_make_a_guess();
                }
            });
        }
    } catch {
        new_guess.innerText = 'ERROR';
        new_guess.addEventListener('click', function() {
            document.getElementById('guesses').removeChild(new_guess);
            ask_computer_to_make_a_guess();
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    for (const word of WORDS) {
        const option = document.createElement('option');
        option.setAttribute('value', word);
        document.getElementById('all-words').appendChild(option);
    }
    set_button_states();
    document.getElementById('chosen-word').addEventListener('input', set_button_states);
    document.getElementById('chosen-word').addEventListener('keyup', function(event) {
        if (event.key === "Enter")
            if (document.getElementById('start-game').getAttribute('disabled') === 'false')
                start_game();
    });
    document.getElementById('start-game').addEventListener('click', start_game);
});
