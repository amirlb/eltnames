#! /usr/bin/env python3

import json
import os
import numpy as np


def make_guess(previous_results):
    words = open('eltnames_words.txt').read().split()
    vectors = np.load('eltnames_vectors.npy')
    log_likelihoods = np.zeros(len(words))
    for record in previous_results:
        try:
            guess_index = words.index(record['guess'])
        except ValueError:
            continue
        scalar_products = (vectors * vectors[guess_index]).sum(axis=1)
        score = float(record['score']) * 0.1 - 0.2
        log_likelihoods -= (scalar_products - score) ** 2
    probs = np.exp((log_likelihoods - np.mean(log_likelihoods)) * 20)
    probs /= np.sum(probs)
    past_guesses = {record['guess'] for record in previous_results}
    while True:
        guess = np.random.choice(words, p=probs)
        if guess not in past_guesses:
            return guess


if os.getenv('REQUEST_METHOD').lower() == 'options':
    print('Access-Control-Allow-Origin: *')
    print('Access-Control-Allow-Headers: *')
    print('Access-Control-Allow-Methods: POST, OPTIONS')
    print()
else:
    previous_results = json.loads(input())
    guess = make_guess(previous_results)
    print('Access-Control-Allow-Origin: *')
    print('Content-Type: application/json')
    print()
    print(json.dumps({'guess': guess}))
