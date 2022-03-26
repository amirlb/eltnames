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
        const word_elt = document.createElement('div');
        word_elt.innerText = `📖 ${result.guess}`;
        word_elt.classList.add('guessed-word');
        word_elt.addEventListener('click', function() {
            window.open(`https://www.merriam-webster.com/dictionary/${result.guess}`, '_blank');
        });
        new_guess.innerText = '';
        new_guess.appendChild(word_elt);
        new_guess.setAttribute('guess', result.guess);
        create_result_buttons(new_guess);
        new_guess.classList.add('active');
    } catch {
        new_guess.innerText = 'ERROR, click to retry';
        new_guess.style.cursor = 'pointer';
        new_guess.addEventListener('click', function() {
            document.getElementById('guesses').removeChild(new_guess);
            ask_computer_to_make_a_guess();
        });
    }
}

function create_result_buttons(guess_elt) {
    for (let i = 0; i <= 10; i++) {
        const button = document.createElement('div');
        button.classList.add('score-button');
        button.setAttribute('score', i === 10 ? 'correct' : i);
        button.innerText = i === 10 ? '✔️' : i;
        button.addEventListener('click', send_result);
        guess_elt.appendChild(button);
    }
}

function send_result(event) {
    const guess_elt = event.target.parentElement;

    if (!guess_elt.classList.contains('active'))
        return;
    guess_elt.classList.remove('active');

    event.target.classList.add('selected');

    const score = event.target.getAttribute('score');
    previous_guesses.push({guess: guess_elt.getAttribute('guess'), score});

    if (score === 'correct') {
        window.setTimeout(function() {
            const win_statement = document.createElement('div');
            win_statement.innerText = `
                Computer found the correct word after ${previous_guesses.length} guesses.
            `;
            guesses.prepend(win_statement);
            win_statement.style.marginBottom = 'calc(5 * var(--unit))';
            document.getElementById('start-game').classList.remove('disabled');
        }, 1000);
    } else {
        window.setTimeout(ask_computer_to_make_a_guess, 500);
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

        const guess_elt = guesses[0];
        if (!guess_elt.classList.contains('active'))
            return;

        const score = 'vVwW'.includes(event.key) ? 'correct' : event.key;
        for (let elt = guess_elt.firstElementChild; elt; elt = elt.nextElementSibling)
            if (elt.getAttribute('score') === score)
                send_result({target: elt});
    });
});
