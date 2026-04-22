// ═══════════════════════════════════════════════════════════════
// SHOOTEMATICS — Question Generator
// ═══════════════════════════════════════════════════════════════

const QuestionGenerator = (() => {
  function isPrime(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6)
      if (n % i === 0 || n % (i + 2) === 0) return false;
    return true;
  }

  function getFactors(n) {
    const f = [];
    for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i);
    return f;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickUnique(count, generator, validator) {
    const set = new Set();
    let attempts = 0;
    while (set.size < count && attempts < 500) {
      const v = generator();
      if (validator(v)) set.add(v);
      attempts++;
    }
    return [...set];
  }

  function multipleQ(numBlocks, diff) {
    const bases = diff < 2 ? [2,3,4,5] : [3,5,6,7,8,9,11,12];
    const base = bases[randInt(0, bases.length-1)];
    const correct = base * randInt(2, diff < 2 ? 10 : 20);
    const wrongs = pickUnique(numBlocks - 1,
      () => randInt(correct - 30, correct + 30),
      v => v > 0 && v !== correct && v % base !== 0
    );
    return {
      text: `SHOOT A MULTIPLE OF ${base}`,
      correct, wrongs,
    };
  }

  function factorQ(numBlocks, diff) {
    const numbers = diff < 2 ? [12,16,18,20,24] : [24,30,36,42,48,56,60,72];
    const num = numbers[randInt(0, numbers.length-1)];
    const factors = getFactors(num).filter(f => f > 1 && f < num);
    const correct = factors[randInt(0, factors.length-1)];
    const wrongs = pickUnique(numBlocks - 1,
      () => randInt(2, num),
      v => num % v !== 0
    );
    return {
      text: `SHOOT A FACTOR OF ${num}`,
      correct, wrongs,
    };
  }

  function primeQ(numBlocks) {
    const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
    const correct = primes[randInt(0, primes.length-1)];
    const wrongs = pickUnique(numBlocks - 1,
      () => randInt(4, 50),
      v => !isPrime(v)
    );
    return {
      text: `SHOOT THE PRIME NUMBER`,
      correct, wrongs,
    };
  }

  function squareQ(numBlocks) {
    const squares = [4,9,16,25,36,49,64,81,100,121,144];
    const correct = squares[randInt(0, squares.length-1)];
    const wrongs = pickUnique(numBlocks - 1,
      () => randInt(2, 150),
      v => !squares.includes(v)
    );
    return {
      text: `SHOOT THE PERFECT SQUARE`,
      correct, wrongs,
    };
  }

  function arithmeticQ(numBlocks, diff) {
    const maxN = diff < 3 ? 12 : 20;
    const a = randInt(2, maxN), b = randInt(2, maxN);
    const correct = a * b;
    const wrongs = pickUnique(numBlocks - 1,
      () => correct + randInt(-15, 15),
      v => v > 0 && v !== correct
    );
    return {
      text: `WHAT IS ${a} × ${b}?`,
      correct, wrongs,
    };
  }

  function evenOddQ(numBlocks) {
    const wantEven = Math.random() > 0.5;
    const correct = wantEven ? randInt(1, 25) * 2 : randInt(1, 25) * 2 - 1;
    const wrongs = pickUnique(numBlocks - 1,
      () => randInt(1, 50),
      v => v !== correct && (wantEven ? v % 2 !== 0 : v % 2 === 0)
    );
    return {
      text: wantEven ? `SHOOT THE EVEN NUMBER` : `SHOOT THE ODD NUMBER`,
      correct, wrongs,
    };
  }

  function divisibleByBothQ(numBlocks) {
    const pairs = [[3,4],[3,5],[4,5],[3,7],[2,7]];
    const [a,b] = pairs[randInt(0, pairs.length-1)];
    const lcm = (a*b) / gcd(a,b);
    const correct = lcm * randInt(1, 4);
    const wrongs = pickUnique(numBlocks - 1,
      () => randInt(2, correct + 40),
      v => v > 0 && v !== correct && (v % a !== 0 || v % b !== 0)
    );
    return {
      text: `DIVISIBLE BY BOTH ${a} AND ${b}`,
      correct, wrongs,
    };
  }

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

  return {
    generate(round, numBlocks) {
      const diff = Math.min(Math.floor((round - 1) / 3), 4);
      const types = [
        [evenOddQ, multipleQ],
        [multipleQ, factorQ, evenOddQ],
        [factorQ, primeQ, multipleQ],
        [primeQ, squareQ, factorQ, arithmeticQ],
        [primeQ, squareQ, arithmeticQ, divisibleByBothQ],
      ][diff];
      const fn = types[randInt(0, types.length - 1)];
      const q = fn(numBlocks, diff);
      // Build block values
      const values = shuffle([q.correct, ...q.wrongs.slice(0, numBlocks - 1)]);
      return {
        text: q.text,
        blocks: values.map(v => ({ value: v, isCorrect: v === q.correct })),
      };
    }
  };
})();
