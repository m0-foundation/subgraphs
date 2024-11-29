import { describe, test } from 'matchstick-as/assembly/index';
import { log } from '@graphprotocol/graph-ts';

describe('Foo', () => {
    test('Bar', () => {
        log.info('Hello: {}', ["world!"]);
    });
});
