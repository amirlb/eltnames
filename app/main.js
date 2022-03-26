"use strict";

// A word game inspired by Semantle
// Copyright (C) 2022  Amir Livne Bar-on and Yaron Racah

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.


let previous_guesses = [];

function start_game() {
    if (document.getElementById('start-game').classList.contains('disabled'))
        return;
    document.getElementById('start-game').classList.add('disabled');
    previous_guesses = [];
    document.getElementById('guesses').innerText = '';
    ask_computer_to_make_a_guess();
}

async function ask_computer_to_make_a_guess() {
    const new_guess = create_loading_guess_div();
    document.getElementById('guesses').prepend(new_guess);

    try {
        const response = await fetch('https://meduyeket.net/eltnames.cgi', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(previous_guesses)
        });
        const result = await response.json();
        set_guess_div(new_guess, result.guess);
    } catch {
        set_guess_div_to_error(new_guess);
    }
}

function create_loading_guess_div() {
    const guess_div = document.createElement('div');
    guess_div.classList.add('guess');
    guess_div.innerHTML = `
        <svg viewBox="0 0 100 100" class="loading">
            <circle cx="20" cy="50" r="15" fill="black" />
            <circle cx="65" cy="76" r="15" fill="black" />
            <circle cx="65" cy="24" r="15" fill="black" />
        </svg>
        <span class="loading-text">Computer is thinking</span>
    `;
    guess_div.classList.add('single-line');
    return guess_div;
}

function set_guess_div_to_error(guess_div) {
    guess_div.innerText = 'ERROR, click to retry';
    guess_div.style.cursor = 'pointer';
    guess_div.addEventListener('click', function() {
        document.getElementById('guesses').removeChild(guess_div);
        ask_computer_to_make_a_guess();
    });
}

function set_guess_div(guess_div, guess) {
    guess_div.innerHTML = `
        <div class="single-line">
            <span class="guessed-word">${guess}</span>
            <a class="dictionary-link"
               target="_blank"
               href="https://www.merriam-webster.com/dictionary/${guess}"
            >(go to dictionary)</a>
        </div>
        <div class="single-line score-buttons"></div>
    `;
    guess_div.classList.remove('single-line');
    guess_div.setAttribute('guess', guess);

    const buttons_div = guess_div.querySelector('.score-buttons');
    for (let i = 0; i <= 10; i++) {
        const button = document.createElement('div');
        button.classList.add('score-button');
        button.setAttribute('score', i === 10 ? 'correct' : i);
        button.innerText = i === 10 ? '✔️' : i;
        button.addEventListener('click', on_score_guess);
        buttons_div.appendChild(button);
    }
}

function on_score_guess(event) {
    const guess_div = event.target.parentElement.parentElement;

    event.target.classList.add('selected');
    for (const score_button of document.querySelectorAll('.guess:first-child .score-button'))
        score_button.classList.add('fading');

    const guess = guess_div.getAttribute('guess');
    const score = event.target.getAttribute('score');
    previous_guesses.push({guess, score});

    if (score === 'correct') {
        window.setTimeout(function() {
            guess_div.innerHTML = `
                Computer found the correct word
                <span id="correct-word">${guess}</span>
                after ${previous_guesses.length} guesses.
            `;
            guess_div.classList.add('correct');
            document.getElementById('start-game').classList.remove('disabled');
        }, 1000);

        // Notify the server what the correct word was
        fetch('https://meduyeket.net/eltnames.cgi', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(previous_guesses)
        });
    } else {
        window.setTimeout(function() {
            guess_div.innerHTML = `
                <div class="score-button" score="${score}">${score}</div>
                ${guess}
            `;
            ask_computer_to_make_a_guess();
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('start-game').addEventListener('click', start_game);
    document.body.addEventListener('keyup', function(event) {
        if (event.ctrlKey || event.altKey || event.metaKey)
            return;

        if (event.key === 'Enter')
            start_game();

        const guesses = document.getElementsByClassName('guess');
        if (guesses.length === 0)
            return;

        const score = 'vVwW'.includes(event.key) ? 'correct' : event.key;
        for (const score_button of document.querySelectorAll('.guess:first-child .score-button'))
            if (score_button.getAttribute('score') === score)
                on_score_guess({target: score_button});
    });
});
