#! /usr/bin/env python3

# A word game inspired by Semantle
# Copyright (C) 2022  Amir Livne Bar-on and Yaron Racah

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.


import json
import os
import numpy as np
import pymysql


def make_guess(previous_results):
    words = open('eltnames_words.txt').read().split()
    vectors = np.load('eltnames_vectors.npy')
    log_likelihoods = np.zeros(len(words))
    for record in previous_results:
        if record['score'] == 'correct':
            return record['guess']

        try:
            guess_index = words.index(record['guess'])
        except ValueError:
            continue
        scalar_products = (vectors * vectors[guess_index]).sum(axis=1)
        score = float(record['score']) * 0.075
        log_likelihoods -= (scalar_products - score) ** 2
    probs = np.exp((log_likelihoods - np.mean(log_likelihoods)) * 20)
    probs /= np.sum(probs)
    past_guesses = {record['guess'] for record in previous_results}
    while True:
        guess = np.random.choice(words, p=probs)
        if guess not in past_guesses:
            return guess


def get_client_id(cookie):
    if not cookie:
        return ''
    for x in cookie.split('; '):
        if x.startswith('_ga='):
            return x[4:]
    return ''


def record_query(data):
    with open('eltnames_credentials.json') as credentials_file:
        credentials = json.load(credentials_file)
        db = pymysql.connect(**credentials)
        with db.cursor() as cursor:
            query = 'INSERT INTO queries (user_ip_addr, user_lang, user_ga_id, query) VALUES (%s, %s, %s, %s)'
            values = (os.getenv('REMOTE_ADDR'), os.getenv('LANG'), get_client_id(os.getenv('HTTP_COOKIE')), json.dumps(data))
            cursor.execute(query, values)
        db.commit()


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
    record_query(previous_results)
