import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedProblem {
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  tags: string[];
  statement: string;
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string; isHidden?: boolean }[];
  timeLimitMs?: number;
}

const problems: SeedProblem[] = [
  {
    slug: 'hello-world',
    title: 'Hello, World!',
    difficulty: 'EASY',
    tags: ['intro', 'io'],
    statement: `Print the string \`Hello, World!\` (without quotes) to standard output.

This is a warm-up problem — verify your editor + execution work end to end.

**Example output:**
\`\`\`
Hello, World!
\`\`\``,
    starterCode: {
      python: `# Print "Hello, World!" below
`,
      javascript: `// Print "Hello, World!" below
`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    // Print here
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        // Print here
    }
}
`,
    },
    testCases: [{ input: '', expectedOutput: 'Hello, World!' }],
  },

  {
    slug: 'sum-two-numbers',
    title: 'Sum of Two Numbers',
    difficulty: 'EASY',
    tags: ['math', 'io'],
    statement: `Read two integers from standard input (one per line) and print their sum.

**Input format:**
Line 1: integer a  
Line 2: integer b

**Output format:** Single integer — the sum

**Example:**
\`\`\`
Input:
3
5

Output:
8
\`\`\``,
    starterCode: {
      python: `a = int(input())
b = int(input())
# print the sum
`,
      javascript: `const lines = require('fs').readFileSync(0, 'utf-8').trim().split('\\n');
const a = parseInt(lines[0]);
const b = parseInt(lines[1]);
// console.log the sum
`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    int a, b;
    cin >> a >> b;
    // print the sum
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        // print the sum
    }
}
`,
    },
    testCases: [
      { input: '3\n5', expectedOutput: '8' },
      { input: '0\n0', expectedOutput: '0' },
      { input: '-7\n12', expectedOutput: '5' },
      { input: '1000000\n2000000', expectedOutput: '3000000', isHidden: true },
    ],
  },

  {
    slug: 'fizzbuzz',
    title: 'FizzBuzz',
    difficulty: 'EASY',
    tags: ['loops', 'conditionals'],
    statement: `Given an integer \`n\`, print numbers from 1 to n with these rules:
- Multiples of 3 → print \`Fizz\`
- Multiples of 5 → print \`Buzz\`
- Multiples of both 3 and 5 → print \`FizzBuzz\`
- Otherwise → print the number

Each value on its own line.

**Input:** single integer n (1 ≤ n ≤ 100)

**Example:**
\`\`\`
Input: 5
Output:
1
2
Fizz
4
Buzz
\`\`\``,
    starterCode: {
      python: `n = int(input())
# your solution here
`,
      javascript: `const n = parseInt(require('fs').readFileSync(0, 'utf-8').trim());
// your solution here
`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    int n; cin >> n;
    // your solution here
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        // your solution here
    }
}
`,
    },
    testCases: [
      { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz' },
      {
        input: '15',
        expectedOutput:
          '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
      },
      { input: '1', expectedOutput: '1' },
      { input: '3', expectedOutput: '1\n2\nFizz', isHidden: true },
    ],
  },

  {
    slug: 'reverse-string',
    title: 'Reverse a String',
    difficulty: 'EASY',
    tags: ['strings'],
    statement: `Read a single line of input and print it reversed.

**Example:**
\`\`\`
Input:  hello
Output: olleh
\`\`\``,
    starterCode: {
      python: `s = input()
# print reversed
`,
      javascript: `const s = require('fs').readFileSync(0, 'utf-8').trim();
// console.log reversed
`,
      cpp: `#include <iostream>
#include <algorithm>
#include <string>
using namespace std;
int main() {
    string s; cin >> s;
    // reverse and print
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        String s = new Scanner(System.in).nextLine();
        // print reversed
    }
}
`,
    },
    testCases: [
      { input: 'hello', expectedOutput: 'olleh' },
      { input: 'a', expectedOutput: 'a' },
      { input: 'scholr', expectedOutput: 'rlohcs' },
      { input: 'racecar', expectedOutput: 'racecar', isHidden: true },
    ],
  },

  {
    slug: 'palindrome-check',
    title: 'Palindrome Check',
    difficulty: 'EASY',
    tags: ['strings'],
    statement: `Given a string, print \`yes\` if it reads the same forwards and backwards, else \`no\`.

Treat the input as case-sensitive. Don't strip spaces.

**Example:**
\`\`\`
Input:  racecar
Output: yes
\`\`\``,
    starterCode: {
      python: `s = input()
# print yes or no
`,
      javascript: `const s = require('fs').readFileSync(0, 'utf-8').trim();
// console.log "yes" or "no"
`,
      cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s; cin >> s;
    // print yes or no
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        String s = new Scanner(System.in).nextLine();
        // print yes or no
    }
}
`,
    },
    testCases: [
      { input: 'racecar', expectedOutput: 'yes' },
      { input: 'hello', expectedOutput: 'no' },
      { input: 'a', expectedOutput: 'yes' },
      { input: 'level', expectedOutput: 'yes', isHidden: true },
      { input: 'abba', expectedOutput: 'yes', isHidden: true },
    ],
  },

  {
    slug: 'fibonacci',
    title: 'Nth Fibonacci',
    difficulty: 'MEDIUM',
    tags: ['math', 'dp'],
    statement: `Given a non-negative integer n (0 ≤ n ≤ 50), print the nth Fibonacci number.

Definition:
- F(0) = 0
- F(1) = 1
- F(n) = F(n-1) + F(n-2) for n ≥ 2

**Example:**
\`\`\`
Input:  10
Output: 55
\`\`\``,
    starterCode: {
      python: `n = int(input())
# print F(n)
`,
      javascript: `const n = parseInt(require('fs').readFileSync(0, 'utf-8').trim());
// console.log F(n)
`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    int n; cin >> n;
    // print F(n) — use long long for safety
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        // print F(n) — use long for safety
    }
}
`,
    },
    testCases: [
      { input: '0', expectedOutput: '0' },
      { input: '1', expectedOutput: '1' },
      { input: '10', expectedOutput: '55' },
      { input: '20', expectedOutput: '6765' },
      { input: '50', expectedOutput: '12586269025', isHidden: true },
    ],
  },

  {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'MEDIUM',
    tags: ['array', 'hash-table'],
    statement: `Given an array of integers and a target, find the **indices** of two numbers in the array that add up to the target.

Output the two indices (0-indexed), space-separated, smaller first. You may assume exactly one valid pair exists.

**Input format:**
Line 1: space-separated integers (the array)  
Line 2: integer target

**Example:**
\`\`\`
Input:
2 7 11 15
9
Output:
0 1
\`\`\``,
    starterCode: {
      python: `nums = list(map(int, input().split()))
target = int(input())
# print the two indices, smaller first, space-separated
`,
      javascript: `const lines = require('fs').readFileSync(0, 'utf-8').trim().split('\\n');
const nums = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);
// console.log the two indices
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
int main() {
    // read array on line 1, target on line 2
    // print two indices smaller first
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int target = Integer.parseInt(sc.nextLine());
        // print two indices smaller first
    }
}
`,
    },
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '0 1' },
      { input: '3 2 4\n6', expectedOutput: '1 2' },
      { input: '3 3\n6', expectedOutput: '0 1' },
      { input: '-1 -2 -3 -4 -5\n-8', expectedOutput: '2 4', isHidden: true },
    ],
  },

  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'MEDIUM',
    tags: ['stack', 'strings'],
    statement: `Given a string containing only the characters \`(\`, \`)\`, \`[\`, \`]\`, \`{\`, \`}\`, determine if it is a valid balanced bracket string.

Print \`yes\` if valid, else \`no\`.

A valid string:
- Has matching brackets in correct order
- Empty string is valid

**Examples:**
\`\`\`
"()" → yes
"()[]{}" → yes
"(]" → no
"([)]" → no
\`\`\``,
    starterCode: {
      python: `s = input()
# print yes or no
`,
      javascript: `const s = require('fs').readFileSync(0, 'utf-8').trim();
// console.log yes or no
`,
      cpp: `#include <iostream>
#include <stack>
#include <string>
using namespace std;
int main() {
    string s; getline(cin, s);
    // print yes or no
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        String s = new Scanner(System.in).nextLine();
        // print yes or no
    }
}
`,
    },
    testCases: [
      { input: '()', expectedOutput: 'yes' },
      { input: '()[]{}', expectedOutput: 'yes' },
      { input: '(]', expectedOutput: 'no' },
      { input: '([)]', expectedOutput: 'no' },
      { input: '{[]}', expectedOutput: 'yes' },
      { input: '(((', expectedOutput: 'no', isHidden: true },
      { input: '', expectedOutput: 'yes', isHidden: true },
    ],
  },
];

async function main() {
  console.log(`Seeding ${problems.length} coding problems…`);
  for (const p of problems) {
    await prisma.codingProblem.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags,
        statement: p.statement,
        starterCode: p.starterCode,
        testCases: p.testCases,
        timeLimitMs: p.timeLimitMs ?? 2000,
        memoryLimitMb: 128,
      },
      update: {
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags,
        statement: p.statement,
        starterCode: p.starterCode,
        testCases: p.testCases,
        timeLimitMs: p.timeLimitMs ?? 2000,
      },
    });
    console.log(`  ✓ ${p.slug}`);
  }
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
