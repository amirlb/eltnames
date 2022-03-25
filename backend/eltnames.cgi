#! /usr/bin/env python3

import random
import json
import os


def make_guess(previous_results):
    WORDS = [
        'shallowest', 'newts', 'crippled', 'Amadeus',
        'sclerosis', 'dory', 'stink', 'prepares',
        'oration', 'abbess', 'philters', 'detainment',
        'shakedown', 'thriftily', 'abrogate',
    ]

    return random.choice(WORDS)


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
