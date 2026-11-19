import { describe, expect, test } from 'vitest';
import {
  extractDropShadows,
  findBlurredShadows,
  findHexOutsideVarFallback,
  isLengthToken,
  isZeroLength,
  splitTopLevel,
  tokenize,
} from '../../tools/stylelint/css-value-utils.js';

describe('splitTopLevel and tokenize', () => {
  test('splits by top-level commas only', () => {
    expect(splitTopLevel('1px 1px red, var(--a, 2px 2px blue)', ',')).toEqual([
      '1px 1px red',
      'var(--a, 2px 2px blue)',
    ]);
  });

  test('tokenizes by top-level whitespace keeping functions whole', () => {
    expect(tokenize('inset  2px calc(1px + 2px)\n var(--sm-x, 0 0)')).toEqual([
      'inset',
      '2px',
      'calc(1px + 2px)',
      'var(--sm-x, 0 0)',
    ]);
  });

  test('keeps quoted strings intact', () => {
    expect(splitTopLevel("'a, b', c", ',')).toEqual(["'a, b'", 'c']);
  });
});

describe('length tokens', () => {
  test.each(['0', '0px', '2px', '-1px', '.5rem', '1.25em', '+3px'])('"%s" is a length token', (token) => {
    expect(isLengthToken(token)).toBe(true);
  });

  test.each(['red', 'inset', 'var(--x)', '#000', 'px'])('"%s" is not a length token', (token) => {
    expect(isLengthToken(token)).toBe(false);
  });

  test('detects zero lengths with or without unit', () => {
    expect(isZeroLength('0')).toBe(true);
    expect(isZeroLength('0px')).toBe(true);
    expect(isZeroLength('-0.0em')).toBe(true);
    expect(isZeroLength('0.1px')).toBe(false);
  });
});

describe('findBlurredShadows', () => {
  test.each([
    'none',
    '2px 2px 0 0 currentcolor',
    '2px 2px currentcolor',
    '0 0 0 0 transparent',
    'inset 4px 4px 0 var(--sm-border-color)',
    'var(--sm-shadow-md)',
    'var(--sm-x, 2px 2px 0 red)',
    '2px 2px 0 0 currentcolor, inset 1px 1px 0 red',
  ])('"%s" has no blurred layers', (value) => {
    expect(findBlurredShadows(value)).toEqual([]);
  });

  test.each([
    ['2px 2px 4px currentcolor', 1],
    ['inset 1px 1px 2px red', 1],
    ['2px 2px 0 0 currentcolor, 1px 1px 3px currentcolor', 1],
    ['1px 1px 1px red, 2px 2px 2px blue', 2],
    ['var(--sm-x, 2px 2px 4px currentcolor)', 1],
    ['2px 2px calc(1px + 1px) red', 1],
  ])('"%s" has %i blurred layer(s)', (value, expected) => {
    expect(findBlurredShadows(value)).toHaveLength(expected);
  });
});

describe('extractDropShadows', () => {
  test('extracts the arguments of every drop-shadow()', () => {
    expect(extractDropShadows('blur(0) drop-shadow(2px 2px 4px red) DROP-SHADOW(1px 1px 0 blue)')).toEqual([
      '2px 2px 4px red',
      '1px 1px 0 blue',
    ]);
  });

  test('looks inside var() fallbacks', () => {
    expect(extractDropShadows('var(--sm-filter, drop-shadow(1px 1px 3px red))')).toEqual(['1px 1px 3px red']);
  });

  test('returns an empty list without drop-shadow()', () => {
    expect(extractDropShadows('grayscale(1)')).toEqual([]);
  });
});

describe('findHexOutsideVarFallback', () => {
  test.each(['#fff', '#ffff', '#a1b2c3', '#a1b2c3d4'])('finds the literal %s', (hex) => {
    expect(findHexOutsideVarFallback(`1px solid ${hex}`)).toEqual([hex]);
  });

  test('ignores hex colors inside a var() fallback', () => {
    expect(findHexOutsideVarFallback('var(--sm-x, #fff)')).toEqual([]);
    expect(findHexOutsideVarFallback('var(--sm-x, var(--sm-y, #000))')).toEqual([]);
  });

  test('still reports hex colors outside the fallback in the same value', () => {
    expect(findHexOutsideVarFallback('color-mix(in srgb, var(--sm-x, #fff), #000)')).toEqual(['#000']);
  });

  test('ignores fragment identifiers in url() and quoted strings', () => {
    expect(findHexOutsideVarFallback('url(#abc) "#def"')).toEqual([]);
  });

  test('does not report invalid hex lengths', () => {
    expect(findHexOutsideVarFallback('#12345')).toEqual([]);
  });
});
