import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const lessons = [
  // ─── L3 — Mathematics ────────────────────────────────────────────────────
  {
    title: "Number Systems: Binary and Decimal",
    subject: "Mathematics",
    tierVisibility: "l3",
    order: 1,
    content: `NUMBER SYSTEMS
==============

Computers only understand two states: ON and OFF.
We represent these as 1 and 0 — this is called the BINARY system.

DECIMAL (Base 10)
-----------------
The system you use every day.
Digits: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9

Example: 245 means
  2 × 100  =  200
  4 × 10   =   40
  5 × 1    =    5
  Total    =  245

BINARY (Base 2)
---------------
Only two digits: 0 and 1
Each position is a power of 2.

Example: 1011 in binary means
  1 × 8  =  8
  0 × 4  =  0
  1 × 2  =  2
  1 × 1  =  1
  Total  = 11 in decimal

CONVERTING DECIMAL TO BINARY
-----------------------------
Divide by 2 repeatedly, write remainders bottom to top.

Example: Convert 13 to binary
  13 ÷ 2 = 6 remainder 1
   6 ÷ 2 = 3 remainder 0
   3 ÷ 2 = 1 remainder 1
   1 ÷ 2 = 0 remainder 1
  
  Read remainders bottom to top: 1101
  So 13 in decimal = 1101 in binary ✓

PRACTICE
--------
Convert these to binary:
  1. 5
  2. 10
  3. 20

Answers: 101 | 1010 | 10100`,
  },
  {
    title: "Introduction to Algebra: Variables and Expressions",
    subject: "Mathematics",
    tierVisibility: "l3",
    order: 2,
    content: `ALGEBRA BASICS
==============

Algebra uses letters (variables) to represent unknown numbers.
This is exactly how programming works — variables in code come from algebra.

WHAT IS A VARIABLE?
-------------------
A variable is a symbol (usually a letter) that holds a value.

  x = 5       (x holds the value 5)
  y = 3       (y holds the value 3)
  z = x + y   (z = 5 + 3 = 8)

EXPRESSIONS vs EQUATIONS
-------------------------
Expression: a combination of numbers and variables — NO equals sign
  Examples: 2x + 3,  x² + y,  4a - 7

Equation: has an equals sign — states two things are equal
  Examples: 2x + 3 = 11,  x + y = 10

SOLVING A SIMPLE EQUATION
--------------------------
Find x:  2x + 3 = 11

Step 1: Subtract 3 from both sides
  2x + 3 - 3 = 11 - 3
  2x = 8

Step 2: Divide both sides by 2
  2x ÷ 2 = 8 ÷ 2
  x = 4

Check: 2(4) + 3 = 8 + 3 = 11 ✓

WHY THIS MATTERS IN PROGRAMMING
--------------------------------
When you write:
  price = 500
  discount = 50
  total = price - discount

You are doing algebra. total = 500 - 50 = 450.

PRACTICE
--------
Solve for x:
  1. x + 7 = 12
  2. 3x = 18
  3. 2x - 4 = 10`,
  },

  // ─── L4 — Python ─────────────────────────────────────────────────────────
  {
    title: "Python Functions: Writing Reusable Code",
    subject: "Python",
    tierVisibility: "l4",
    order: 1,
    content: `PYTHON FUNCTIONS
================

A function is a block of code you write once and reuse many times.
Think of it like a recipe — you write it once, cook it whenever you need.

DEFINING A FUNCTION
-------------------
Use the "def" keyword:

  def greet(name):
      message = "Hello, " + name + "!"
      return message

  result = greet("Alice")
  print(result)   # Hello, Alice!

PARTS OF A FUNCTION
-------------------
  def greet(name):
  │    │     └── parameter (input)
  │    └──────── function name
  └────────────── keyword

  return message  ← sends a value back to the caller

PARAMETERS vs ARGUMENTS
------------------------
Parameter: the variable in the function definition
  def add(a, b):   ← a and b are parameters

Argument: the actual value you pass when calling
  add(3, 5)        ← 3 and 5 are arguments

MULTIPLE PARAMETERS
-------------------
  def calculate_area(length, width):
      area = length * width
      return area

  room = calculate_area(5, 4)
  print(room)   # 20

DEFAULT PARAMETERS
------------------
Give a parameter a default value so it's optional:

  def greet(name, greeting="Hello"):
      return greeting + ", " + name + "!"

  print(greet("Bob"))           # Hello, Bob!
  print(greet("Bob", "Muraho")) # Muraho, Bob!

PRACTICE
--------
Write a function called "bmi" that:
  - Takes weight (kg) and height (m) as parameters
  - Returns weight / (height * height)
  - Test it with weight=60, height=1.7`,
  },
  {
    title: "Python Lists and Loops",
    subject: "Python",
    tierVisibility: "l4",
    order: 2,
    content: `LISTS AND LOOPS IN PYTHON
=========================

A list stores multiple values in one variable.
A loop repeats code for each item in a list.

CREATING A LIST
---------------
  students = ["Alice", "Bob", "Charlie", "Diana"]
  scores   = [85, 92, 78, 95]
  mixed    = ["Alice", 85, True]   # lists can mix types

ACCESSING ITEMS
---------------
Lists are indexed from 0:
  students[0]   # "Alice"
  students[1]   # "Bob"
  students[-1]  # "Diana" (last item)

COMMON LIST OPERATIONS
----------------------
  students.append("Eve")      # add to end
  students.remove("Bob")      # remove by value
  len(students)               # number of items → 4
  students.sort()             # sort alphabetically

FOR LOOP — iterate over a list
-------------------------------
  for student in students:
      print("Welcome,", student)

  # Output:
  # Welcome, Alice
  # Welcome, Charlie
  # Welcome, Diana
  # Welcome, Eve

FOR LOOP WITH INDEX
-------------------
  for i in range(len(scores)):
      print(i + 1, ".", students[i], "scored", scores[i])

WHILE LOOP
----------
Repeats while a condition is True:

  count = 0
  while count < 3:
      print("Count:", count)
      count = count + 1

  # Output: Count: 0 / Count: 1 / Count: 2

COMBINING LISTS AND LOOPS
--------------------------
  scores = [85, 92, 78, 95, 60]
  total = 0
  for score in scores:
      total = total + score
  average = total / len(scores)
  print("Class average:", average)   # 82.0

PRACTICE
--------
Create a list of 5 subject names.
Use a for loop to print each subject with its position number.
Example output:
  1. Python
  2. Mathematics
  ...`,
  },

  // ─── L5 — Web Development ────────────────────────────────────────────────
  {
    title: "REST APIs: Design and Best Practices",
    subject: "Web Development",
    tierVisibility: "l5",
    order: 1,
    content: `REST API DESIGN
===============

A REST API lets two systems communicate over HTTP.
Your Next.js app already uses REST — every /api/... route is a REST endpoint.

THE 4 CORE HTTP METHODS
-----------------------
  GET     → Read data       (no body, safe to repeat)
  POST    → Create data     (body contains new resource)
  PATCH   → Update partial  (body contains changed fields only)
  DELETE  → Remove data     (usually no body)

RESOURCE-BASED URLs
-------------------
Good REST URLs describe RESOURCES (nouns), not actions (verbs).

  ✗ Bad:   /getUser?id=5
  ✓ Good:  GET /users/5

  ✗ Bad:   /createLesson
  ✓ Good:  POST /lessons

  ✗ Bad:   /updateLessonTitle?id=3
  ✓ Good:  PATCH /lessons/3

HTTP STATUS CODES
-----------------
Always return the right status code:

  200 OK           → successful GET or PATCH
  201 Created      → successful POST
  400 Bad Request  → client sent invalid data
  401 Unauthorized → not logged in
  403 Forbidden    → logged in but not allowed
  404 Not Found    → resource doesn't exist
  500 Server Error → something broke on the server

EXAMPLE: LESSONS API (from this project)
-----------------------------------------
  GET  /api/lessons        → returns all lessons for user's tier
  POST /api/lessons        → admin creates a new lesson (201)

Request body for POST:
  {
    "title": "Binary Numbers",
    "subject": "Mathematics",
    "tierVisibility": "l3",
    "content": "...",
    "order": 1
  }

Response:
  {
    "lesson": {
      "id": "clx...",
      "title": "Binary Numbers",
      ...
    }
  }

VERSIONING
----------
Prefix your API with /api/v1/ so you can release v2 without breaking old clients:
  /api/v1/lessons
  /api/v2/lessons   ← new version with different response shape

PRACTICE
--------
Design the REST endpoints for a "quiz" feature:
  - Get all quizzes for a lesson
  - Submit a quiz answer
  - Get a student's quiz results
Write the method + URL for each.`,
  },

  // ─── L5 — Blockchain Fundamentals ────────────────────────────────────────
  {
    title: "What is a Blockchain?",
    subject: "Blockchain Fundamentals",
    tierVisibility: "l5",
    order: 1,
    content: `BLOCKCHAIN FUNDAMENTALS — Lesson 1
===================================
Module: L5 Software Development

WHAT IS A BLOCKCHAIN?
---------------------
A blockchain is a database that is:
  1. Distributed  — copies exist on thousands of computers (nodes)
  2. Immutable    — once data is written, it cannot be changed
  3. Transparent  — anyone can read the full history
  4. Trustless    — no single person or company controls it

Think of it as a shared notebook that:
  - Everyone has a copy of
  - Everyone can read
  - Nobody can erase or edit past pages
  - New pages are only added when the majority agrees

THE PROBLEM IT SOLVES
---------------------
Traditional databases have a single owner:
  - A bank controls your transaction history
  - A school controls your certificate records
  - A government controls your ID data

If that owner is corrupt, hacked, or goes offline — your data is at risk.

Blockchain removes the single point of failure and the single point of trust.

HOW A BLOCK IS STRUCTURED
--------------------------
Each block contains:

  ┌─────────────────────────────┐
  │  Block #4                   │
  │  Timestamp: 2024-01-15      │
  │  Data: [transactions]       │
  │  Previous Hash: 0x3f8a...   │  ← links to block #3
  │  Hash: 0x9c2b...            │  ← this block's fingerprint
  └─────────────────────────────┘

The HASH is a unique fingerprint of the block's contents.
If you change even one character in the data, the hash changes completely.
This is what makes the chain tamper-proof.

THE CHAIN
---------
Each block stores the hash of the previous block.
This creates a chain:

  Block 1 → Block 2 → Block 3 → Block 4
  (Genesis)

If someone tries to change Block 2:
  - Block 2's hash changes
  - Block 3's "previous hash" no longer matches
  - Block 3's hash changes
  - Block 4's "previous hash" no longer matches
  - The entire chain from Block 2 onwards is now invalid
  - All other nodes on the network reject it

REAL-WORLD ANALOGY
------------------
Imagine a class register where:
  - Every student has a copy
  - Each day's attendance is written in ink (immutable)
  - Each page references the previous page's checksum
  - To change attendance, you'd need to rewrite every student's copy simultaneously

That is essentially how a blockchain works.

KEY TERMS
---------
  Node        — a computer participating in the network
  Block       — a container of data (transactions, records, etc.)
  Hash        — a fixed-length fingerprint of data (SHA-256 is common)
  Chain       — blocks linked by their hashes
  Ledger      — the full history of all blocks
  Consensus   — the process by which nodes agree on the valid chain

NEXT LESSON
-----------
Lesson 2: Cryptographic Hashing — how SHA-256 works and why it's one-way`,
  },
  {
    title: "Cryptographic Hashing and SHA-256",
    subject: "Blockchain Fundamentals",
    tierVisibility: "l5",
    order: 2,
    content: `BLOCKCHAIN FUNDAMENTALS — Lesson 2
===================================
Module: L5 Software Development

CRYPTOGRAPHIC HASHING
---------------------
A hash function takes any input and produces a fixed-length output called a HASH (or digest).

Properties of a good hash function:
  1. Deterministic   — same input always gives same output
  2. Fast to compute — hashing is quick
  3. One-way         — you cannot reverse a hash to get the input
  4. Avalanche effect — tiny input change → completely different hash
  5. Collision-free  — two different inputs should never produce the same hash

SHA-256 EXAMPLES
----------------
Input: "hello"
Hash:  2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824

Input: "Hello"  (capital H only)
Hash:  185f8db32921bd46d35cc2e5b9e29e1b161e5c1fa7425e73043362938b9824

Notice: completely different hash from just one character change.
This is the AVALANCHE EFFECT.

Input: "RUNDA TSS Tech Club"
Hash:  a unique 64-character hex string every time

WHY ONE-WAY MATTERS
--------------------
If you store passwords as hashes:
  - User sets password: "mypassword123"
  - You store: e3b0c44298fc1c149afb... (the hash)
  - If your database is hacked, attacker gets hashes, NOT passwords
  - They cannot reverse the hash to get "mypassword123"

This is why websites say "we cannot recover your password" —
they only stored the hash, not the actual password.

HOW BLOCKCHAIN USES HASHING
----------------------------
When a new block is created:
  1. Take all the block's data (transactions + timestamp + previous hash)
  2. Run it through SHA-256
  3. The result is this block's hash
  4. Store that hash in the NEXT block as "previous hash"

If anyone changes the data in step 1, step 2 produces a different hash,
breaking the link to the next block — the tampering is immediately detected.

MERKLE TREES
------------
Blockchains don't hash all transactions in one go.
They use a MERKLE TREE — a tree of hashes:

  Transaction A → Hash(A) ─┐
                             ├→ Hash(AB) ─┐
  Transaction B → Hash(B) ─┘             ├→ Root Hash (Merkle Root)
                             ┌→ Hash(CD) ─┘
  Transaction C → Hash(C) ─┐│
                             ┘
  Transaction D → Hash(D) ─┘

The Merkle Root is stored in the block header.
This lets you verify a single transaction without downloading the whole block.

PRACTICAL EXERCISE
------------------
Open your browser console (F12) and run:

  // SHA-256 is available in modern browsers via SubtleCrypto
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  sha256("hello").then(console.log);
  sha256("Hello").then(console.log);

Observe the avalanche effect yourself.

NEXT LESSON
-----------
Lesson 3: Consensus Mechanisms — how nodes agree on the valid chain`,
  },
  {
    title: "Consensus Mechanisms: PoW vs PoS",
    subject: "Blockchain Fundamentals",
    tierVisibility: "l5",
    order: 3,
    content: `BLOCKCHAIN FUNDAMENTALS — Lesson 3
===================================
Module: L5 Software Development

THE CONSENSUS PROBLEM
---------------------
In a decentralised network with thousands of nodes, how do they all agree
on which new block to add next?

This is called the CONSENSUS PROBLEM.
The solution is a CONSENSUS MECHANISM.

PROOF OF WORK (PoW)
-------------------
Used by: Bitcoin

The rule: to add a new block, you must solve a hard mathematical puzzle.

The puzzle:
  Find a number (called a NONCE) such that when you hash:
    (block data + nonce)
  the result starts with a certain number of zeros.

  Example target: hash must start with "0000..."

  Try nonce = 0:    hash = 9f3a... (doesn't start with 0000, try again)
  Try nonce = 1:    hash = 7c2b... (no)
  Try nonce = 8423: hash = 00003f... (YES! Valid block)

This process is called MINING.
It requires enormous computing power — that's the "work" in Proof of Work.

Why it works:
  - Solving the puzzle is hard (takes energy and time)
  - Verifying the solution is easy (just hash once and check)
  - To rewrite history, you'd need to redo the work for every block
    AND outpace the entire rest of the network — practically impossible

Downside:
  - Wastes enormous electricity
  - Bitcoin mining uses more power than some countries

PROOF OF STAKE (PoS)
--------------------
Used by: Ethereum (since 2022), Polygon, Cardano

Instead of computing power, validators put up cryptocurrency as STAKE (collateral).

The rule:
  - To propose a new block, you must lock up (stake) some cryptocurrency
  - Validators are chosen randomly, weighted by their stake
  - If you propose a fraudulent block, you LOSE your stake (called SLASHING)

Why it works:
  - Attacking the network means risking your own money
  - Uses 99.95% less energy than Proof of Work
  - Ethereum's switch from PoW to PoS ("The Merge") reduced its energy use by ~99.95%

COMPARISON TABLE
----------------
  Feature          | Proof of Work    | Proof of Stake
  -----------------|------------------|------------------
  Security method  | Computing power  | Economic stake
  Energy use       | Very high        | Very low
  Hardware needed  | Specialised ASICs| Standard computer
  Used by          | Bitcoin          | Ethereum, Polygon
  Attack cost      | Buy 51% hashrate | Buy 51% of coins

RELEVANCE TO THIS PROJECT
--------------------------
When we build the RUNDA certificate system (Phase 3), we will deploy
smart contracts on POLYGON — a Proof of Stake blockchain.

This means:
  - Minting a certificate costs a fraction of a cent (low gas fees)
  - The network is environmentally responsible
  - Certificates are permanent and verifiable by anyone

NEXT LESSON
-----------
Lesson 4: Smart Contracts — self-executing code on the blockchain`,
  },
  {
    title: "Smart Contracts: Code on the Blockchain",
    subject: "Blockchain Fundamentals",
    tierVisibility: "l5",
    order: 4,
    content: `BLOCKCHAIN FUNDAMENTALS — Lesson 4
===================================
Module: L5 Software Development

WHAT IS A SMART CONTRACT?
--------------------------
A smart contract is a program stored on a blockchain that runs automatically
when predefined conditions are met.

Key properties:
  - Stored on-chain — the code is public and permanent
  - Self-executing  — no human needs to trigger it manually
  - Trustless       — no intermediary needed
  - Immutable       — once deployed, the code cannot be changed

REAL-WORLD ANALOGY
------------------
A vending machine is like a smart contract:
  1. You insert money (condition met)
  2. You press a button (trigger)
  3. The machine releases the item (automatic execution)
  4. No cashier needed (trustless)
  5. The machine follows its rules exactly — no negotiation

SOLIDITY — THE LANGUAGE OF SMART CONTRACTS
-------------------------------------------
Ethereum and Polygon smart contracts are written in SOLIDITY.

A simple example — a certificate contract:

  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;

  contract Certificate {
      
      struct Cert {
          string studentName;
          string courseName;
          uint256 issuedAt;
          bool valid;
      }
      
      mapping(uint256 => Cert) public certificates;
      uint256 public nextId = 1;
      address public issuer;
      
      constructor() {
          issuer = msg.sender;  // deployer is the issuer
      }
      
      function issue(string memory name, string memory course) public {
          require(msg.sender == issuer, "Only issuer can mint");
          certificates[nextId] = Cert(name, course, block.timestamp, true);
          nextId++;
      }
      
      function verify(uint256 id) public view returns (Cert memory) {
          return certificates[id];
      }
  }

READING THE CODE
----------------
  mapping(uint256 => Cert)  — like a dictionary: ID → Certificate
  msg.sender                — the address that called this function
  require(condition, error) — if condition is false, revert with error
  block.timestamp           — current time on the blockchain
  public view               — anyone can call this, it doesn't change state

GAS FEES
--------
Every operation on a blockchain costs a small fee called GAS.
Gas is paid in the blockchain's native currency (ETH on Ethereum, MATIC on Polygon).

Why gas exists:
  - Prevents spam (every transaction costs something)
  - Pays the validators who process transactions

On Polygon, gas fees are typically $0.001 — $0.01 per transaction.
This is why we chose Polygon for RUNDA certificates, not Ethereum mainnet.

SOULBOUND TOKENS (SBTs)
-----------------------
A regular NFT can be sold or transferred.
A SOULBOUND TOKEN is an NFT that is permanently tied to one wallet — non-transferable.

This is perfect for certificates:
  - A student earns a certificate
  - It is minted as an SBT to their wallet
  - They cannot sell it (it's a credential, not an asset)
  - It lives on-chain forever — no school can revoke it

This is exactly what Phase 3 of RUNDA will build.

NEXT LESSON
-----------
Lesson 5: Wallets, Addresses, and Keys — how blockchain identity works`,
  },
  {
    title: "Wallets, Addresses, and Private Keys",
    subject: "Blockchain Fundamentals",
    tierVisibility: "l5",
    order: 5,
    content: `BLOCKCHAIN FUNDAMENTALS — Lesson 5
===================================
Module: L5 Software Development

BLOCKCHAIN IDENTITY
-------------------
On a blockchain, your identity is not your name or email.
It is a CRYPTOGRAPHIC KEY PAIR:

  Private Key  — a secret 256-bit number. NEVER share this.
  Public Key   — derived from the private key. Safe to share.
  Address      — derived from the public key. Your "account number".

Example Ethereum address:
  0x742d35Cc6634C0532925a3b8D4C9B8a2e4b8c3f1

HOW KEYS RELATE
---------------
  Private Key → (one-way math) → Public Key → (one-way math) → Address

You can go forward (private → public → address) but NEVER backward.
Knowing someone's address does NOT let you find their private key.

DIGITAL SIGNATURES
------------------
When you send a transaction, you SIGN it with your private key:

  1. You create a transaction: "Send 10 MATIC to 0xABC..."
  2. You sign it with your private key → produces a SIGNATURE
  3. You broadcast: transaction + signature to the network
  4. Nodes verify: does this signature match the sender's public key?
  5. If yes → transaction is valid and added to the blockchain

This proves YOU authorised the transaction without revealing your private key.

WALLETS
-------
A wallet does NOT store your cryptocurrency.
Your crypto lives on the blockchain.

A wallet stores your PRIVATE KEY and lets you:
  - Sign transactions
  - View your balance
  - Interact with smart contracts

Types of wallets:
  Hot wallet   — connected to internet (MetaMask, Trust Wallet)
                 Convenient but less secure
  Cold wallet  — offline hardware device (Ledger, Trezor)
                 More secure, used for large amounts

METAMASK
--------
MetaMask is the most common browser wallet for interacting with
Ethereum-compatible blockchains (including Polygon).

For RUNDA Phase 3:
  - Students will connect MetaMask to receive their certificates
  - The certificate (SBT) is minted to their wallet address
  - They can show their wallet address to any employer or school
  - The employer verifies on-chain: the certificate is real

SEED PHRASE
-----------
When you create a wallet, you get a 12 or 24 word SEED PHRASE:

  Example: "witch collapse practice feed shame open despair creek road again ice least"

This seed phrase can REGENERATE your private key.
If you lose your phone, you restore your wallet with the seed phrase.

CRITICAL RULES:
  ✗ Never share your seed phrase with anyone
  ✗ Never type it into any website
  ✗ Never store it in a cloud document
  ✓ Write it on paper and store it somewhere safe
  ✓ Make two copies in different locations

SUMMARY OF THE MODULE
---------------------
You have now covered:
  Lesson 1: What is a blockchain — distributed, immutable ledger
  Lesson 2: Cryptographic hashing — SHA-256, avalanche effect
  Lesson 3: Consensus — Proof of Work vs Proof of Stake
  Lesson 4: Smart contracts — Solidity, gas fees, soulbound tokens
  Lesson 5: Wallets and keys — private key, public key, address, signatures

NEXT STEPS
----------
In Phase 3 of the RUNDA platform, you will:
  1. Set up a MetaMask wallet on Polygon testnet
  2. Write a Solidity certificate contract
  3. Deploy it using Hardhat
  4. Mint your first on-chain certificate`,
  },
];

async function main() {
  console.log("Seeding lessons...");

  // Clear existing lessons to avoid duplicates on re-run
  await prisma.lesson.deleteMany();

  for (const lesson of lessons) {
    await prisma.lesson.create({ data: lesson });
    console.log(`  ✓ ${lesson.subject} — ${lesson.title}`);
  }

  console.log(`\nDone. ${lessons.length} lessons seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
