# Module 21: Cryptography, Hashing, & Data Integrity in JavaScript

> A comprehensive, production-grade guide to cryptographic engineering, OpenSSL runtime internals, `node:crypto`, Web Crypto API, AEAD ciphers, HMAC, digital signatures, and defensive systems design.

---


## 00. Architecture & Mental Models

### Cryptographic Entropy & The Linux/Windows Kernel Sources

In modern systems programming, all cryptography depends on **entropy**—the measure of unpredictability and thermal noise harvested by the operating system kernel.

```text
Hardware Noise (CPU Jitter, Keyboard/Mouse I/O, Disk Timing, RDRAND/RDSEED)
                                    ↓
                     OS Kernel Entropy Pool (/dev/urandom)
                                    ↓
              OpenSSL CSPRNG Engine (ChaCha20 / AES-CTR DRBG)
                                    ↓
            Node.js C++ Binding (src/node_crypto.cc, libuv)
                                    ↓
         JavaScript API: node:crypto / globalThis.crypto.subtle
```

#### Key Cryptographic Properties

1. **Pseudo-Random Number Generator (PRNG) vs Cryptographically Secure PRNG (CSPRNG):**
   - `Math.random()` uses the **xoshiro128+** or **xoroshiro128+** PRNG algorithm. It is designed purely for statistical uniformity and speed in simulations, NOT security. Given only 2 or 3 consecutive output floats, an adversary can completely reconstruct the internal 128-bit seed and predict every future token or session ID!
   - `crypto.randomBytes()` and `crypto.getRandomValues()` query the OS kernel's CSPRNG (`/dev/urandom` on Linux/macOS, `BCryptGenRandom` on Windows). CSPRNGs are guaranteed to be computationally infeasible to invert or predict.

2. **One-Way Hash Function (Cryptographic Digest):**
   A mathematical function $H(M)$ mapping an arbitrary-length message $M$ to a fixed-size bit string ($256$ bits for SHA-256) satisfying three mandatory security properties:
   - **Preimage Resistance (One-Way):** Given a hash $h$, it is computationally impossible to find $M$ such that $H(M) = h$.
   - **Second Preimage Resistance (Weak Collision Resistance):** Given an input $M_1$, it is computationally impossible to find a different input $M_2 \neq M_1$ such that $H(M_1) = H(M_2)$.
   - **Collision Resistance (Strong Collision Resistance):** It is computationally impossible to find ANY two arbitrary messages $M_1 \neq M_2$ such that $H(M_1) = H(M_2)$.

3. **Avalanche Effect:**
   A single-bit modification anywhere in the input message $M$ results in an average of 50% of the output bits flipping randomly.

---

## 01. Web Crypto API vs `node:crypto`

JavaScript environments offer two primary cryptographic interfaces:
1. **`node:crypto` (Node.js & Bun):** A comprehensive, OpenSSL-backed systems module providing synchronous and asynchronous hashing, cipher streams, key derivation, and direct memory buffer operations.
2. **Web Crypto API (`globalThis.crypto.subtle`):** The standardized W3C browser specification implemented across modern browsers, Cloudflare Workers, Deno, and Node.js v15+. Web Crypto is strictly Promise-based and operates on `ArrayBuffer` / `Uint8Array` types.

```javascript
// Comparing Node.js crypto vs Web Crypto API
import crypto from 'node:crypto';

// 1. Node.js synchronous SHA-256
const nodeHash = crypto.createHash('sha256').update('Antigravity').digest('hex');
console.log('Node SHA-256:', nodeHash);

// 2. Web Crypto API (Standards-compliant, asynchronous)
async function webCryptoHash(str) {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.webcrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

webCryptoHash('Antigravity').then(h => console.log('Web Crypto SHA-256:', h));
```

---

## 02. Cryptographic Hashing Algorithms & Streaming Generation

### Algorithm Comparison Matrix

| Algorithm | Digest Size | Security Status | Vulnerabilities / Use Cases |
|---|---|---|---|
| **MD5** | 128 bits (16B) | **BROKEN / INSECURE** | Practical collision attacks (< 1 sec). Strictly legacy checksums only. |
| **SHA-1** | 160 bits (20B) | **BROKEN / DEPRECATED** | SHAttered collision attack proven. Forbidden in TLS and digital signatures. |
| **SHA-256 (SHA-2)** | 256 bits (32B) | **PRODUCTION SECURE** | Industry standard for content integrity, Git commits, Bitcoin, and TLS. |
| **SHA-512 (SHA-2)** | 512 bits (64B) | **PRODUCTION SECURE** | Faster than SHA-256 on 64-bit CPUs; maximum collision margin. |
| **SHA-3 (Keccak)** | 256/512 bits | **HIGH SECURITY** | Sponge construction; immune to length-extension attacks. |
| **BLAKE2b / BLAKE3**| 256/512 bits | **ULTRA-FAST SECURE** | Outperforms SHA-256 and MD5 on modern CPUs with SIMD instructions. |

### Streaming Hash Generation for Large Files

Hashing a 50GB database backup or video upload in memory with a single `hash.update(buffer)` will instantly crash the Node.js process with an `OutOfMemoryError` (`ERR_BUFFER_TOO_LARGE`). The production approach uses streaming pipelines with backpressure:

```javascript
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

async function computeFileSha256(filePath) {
  const hash = crypto.createHash('sha256');
  const fileStream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 }); // 64KB chunks

  // Hash acts as a Writable stream!
  await pipeline(fileStream, hash);

  return hash.digest('hex');
}
```


## 03. Message Authentication Codes (HMAC) & Timing Attack Defenses

### What is HMAC and Why Can't You Just Hash `H(secret + message)`?

A naive message authentication attempt concatenates a secret key and a message: `hash = SHA256(secret + message)`. This construct is critically broken against Merkle–Damgård hash functions (MD5, SHA-1, SHA-256) due to **Length Extension Attacks**. An attacker who observes `hash` and `message` can append arbitrary malicious data to `message` and compute the valid hash for the extended payload without ever knowing the `secret`!

HMAC (Hash-based Message Authentication Code, RFC 2104) mathematically resolves this with nested inner and outer padding:
$$\text{HMAC}(K, M) = H((K' \oplus opad) \parallel H((K' \oplus ipad) \parallel M))$$

```javascript
import crypto from 'node:crypto';

export function computeHmacSha256(secretKey, message) {
  return crypto.createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');
}
```

### Timing Attacks and `crypto.timingSafeEqual`

When verifying incoming signatures (such as Stripe or GitHub webhook headers), comparing strings with standard equality operators (`sigA === sigB`) is a catastrophic vulnerability:

```text
VULNERABLE (Early Return / Short-Circuit String Compare):
"a8b9...f2" === "a8c1...99"
  ^ (Matches)
   ^ (Matches)
    ^ (Mismatch at byte 2! Returns FALSE immediately in 0.0001 ms)

"z1x2...00" === "a8c1...99"
  ^ (Mismatch at byte 0! Returns FALSE immediately in 0.00002 ms)
```

By measuring nanosecond timing differences over thousands of requests, a remote network attacker can brute-force the secret signature byte-by-byte!

#### The Cryptographic Fix: Constant-Time Comparison

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export function verifyWebhookSignature(payload, signatureHeader, secretKey) {
  const expectedSig = crypto.createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');

  const bufExpected = Buffer.from(expectedSig, 'utf8');
  const bufActual = Buffer.from(signatureHeader, 'utf8');

  // Both buffers MUST be of equal byteLength before invoking timingSafeEqual!
  if (bufExpected.length !== bufActual.length) {
    return false;
  }

  // Constant-time hardware execution: never short-circuits on mismatch!
  return crypto.timingSafeEqual(bufExpected, bufActual);
}
```

---

## 04. Cryptographically Secure Randomness & UUIDs

### Generating Secure Random Bytes, Nonces, and Salts

```javascript
import crypto from 'node:crypto';

// 1. Raw 32 bytes of cryptographic entropy (256 bits)
const encryptionKey = crypto.randomBytes(32);
console.log('256-bit Key:', encryptionKey.toString('hex'));

// 2. 12-byte initialization vector (IV) for AES-GCM
const iv = crypto.randomBytes(12);

// 3. RFC4122 v4 UUID generated directly from kernel CSPRNG
const uuid = crypto.randomUUID();
console.log('Cryptographic UUIDv4:', uuid);

// 4. Secure Alphanumeric OTP Generator (avoiding modulo bias!)
function generateSecureOTP(length = 6) {
  const digits = '0123456789';
  const randomBytes = crypto.randomBytes(length);
  let otp = '';
  for (let i = 0; i < length; i++) {
    // 256 is not evenly divisible by 10, so reject values >= 250 to eliminate modulo bias
    let byte = randomBytes[i];
    while (byte >= 250) {
      byte = crypto.randomBytes(1)[0];
    }
    otp += digits[byte % 10];
  }
  return otp;
}
console.log('Secure 6-digit OTP:', generateSecureOTP(6));
```

---

## 05. Symmetric & Asymmetric Encryption

### Symmetric Authenticated Encryption: AES-256-GCM

AES-GCM (Galois/Counter Mode) provides **AEAD (Authenticated Encryption with Associated Data)**. It encrypts the plaintext and simultaneously generates a 16-byte cryptographic **Authentication Tag** guaranteeing both confidentiality and integrity.

```text
Plaintext + 256-bit Key + 96-bit Unique IV
                   ↓
              AES-256-GCM
                   ↓
         Ciphertext + Auth Tag (16B)
```

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export function encryptAES256GCM(plaintext, keyBuffer) {
  // GCM requires a 12-byte (96-bit) IV. NEVER REUSE AN IV WITH THE SAME KEY!
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag(); // 16-byte integrity tag

  // Package IV + AuthTag + Ciphertext together
  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    ciphertext: ciphertext.toString('hex')
  };
}

export function decryptAES256GCM(encryptedPacket, keyBuffer) {
  const iv = Buffer.from(encryptedPacket.iv, 'hex');
  const authTag = Buffer.from(encryptedPacket.authTag, 'hex');
  const ciphertext = Buffer.from(encryptedPacket.ciphertext, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag); // Set expected tag before decryption

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final() // Throws error if ciphertext or tag was tampered with!
  ]);

  return decrypted.toString('utf8');
}
```

---

## 06. Password Hashing & Key Derivation Functions (KDF)

### Why SHA-256 or MD5 is Fatal for Passwords

Cryptographic hashes like SHA-256 are engineered for **maximum execution speed** (processing gigabytes per second). A modern GPU cluster can compute over **100,000,000,000 SHA-256 hashes per second**, cracking standard passwords in minutes.

Password hashing functions MUST be **deliberately slow and computationally expensive**:
1. **Salting:** Prevents precomputed Rainbow Table lookups.
2. **Work Factors:** Configurable CPU and memory iterations.
3. **Memory Hardness:** Defends against ASICs and GPUs by requiring large dedicated RAM blocks (Scrypt, Argon2id).

```javascript
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16); // 128-bit random salt
  // Scrypt with cost parameters: N=16384 (CPU cost), r=8 (block size), p=1 (parallelization)
  const keyLength = 64;
  const derivedKey = await scryptAsync(password, salt, keyLength, { N: 16384, r: 8, p: 1 });

  return {
    salt: salt.toString('hex'),
    hash: derivedKey.toString('hex')
  };
}

export async function verifyPassword(password, storedSaltHex, storedHashHex) {
  const salt = Buffer.from(storedSaltHex, 'hex');
  const expectedHash = Buffer.from(storedHashHex, 'hex');

  const derivedKey = await scryptAsync(password, salt, expectedHash.length, { N: 16384, r: 8, p: 1 });

  return crypto.timingSafeEqual(derivedKey, expectedHash);
}
```

---

## 07. Cryptographic Vulnerabilities & Anti-Patterns

### Top 5 Architectural Vulnerabilities

1. **Catastrophic Nonce/IV Reuse in AES-GCM:** Reusing the same $(Key, IV)$ pair across two distinct messages completely breaks the authentication tag and allows adversaries to forge arbitrary ciphertext!
2. **ECB Mode (Electronic Codebook):** Encrypts identical 16-byte plaintext blocks into identical ciphertext blocks (the infamous ECB Penguin leak). Never use ECB in production.
3. **Padding Oracle Vulnerabilities (AES-CBC):** Intercepting CBC mode decryptions that leak PKCS#7 padding validation errors allows complete decryption of messages without the key.
4. **Predictable PRNG for Security:** Using `Math.random()` for reset password tokens, API keys, or session tokens.
5. **Length Extension Attack on Naive Hashes:** Hashing `H(key + message)` instead of using standardized HMAC.


## 08. Complete Question & Answer Catalog (1–45)

### Q1: Why is `Math.random()` completely unsuitable for cryptographic operations or security tokens?

**Conceptual Explanation:**

`Math.random()` is implemented using non-cryptographic PRNG algorithms (such as xoroshiro128+ or xoshiro256+) that maintain a deterministic internal state. They are designed exclusively for speed and statistical uniformity in simulations or games. Because the internal state is only 128 or 256 bits, observing as few as 2 to 5 consecutive floating-point outputs allows an adversary to reconstruct the seed and predict all past and future values, trivializing token hijacking.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

// INSECURE: Predictable PRNG!
const insecureToken = Math.random().toString(36).substring(2);

// SECURE: Harvests hardware entropy from OS kernel CSPRNG
const secureToken = crypto.randomBytes(32).toString('hex');
console.log('Secure 256-bit Token:', secureToken);
```

---

### Q2: What is `crypto.timingSafeEqual()` and what security vulnerability does it defend against?

**Conceptual Explanation:**

`crypto.timingSafeEqual(bufA, bufB)` performs a constant-time comparison of two Buffers or TypedArrays. In standard equality operators (`===`), the comparison loop short-circuits (early returns) on the very first mismatched byte. An adversary sending forged webhook signatures can measure sub-microsecond timing differences across the network to deduce the correct signature byte-by-byte. `timingSafeEqual` always compares every byte regardless of mismatches, eliminating the timing side-channel.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

function verifySignature(expectedSig, userSig) {
  const bufExpected = Buffer.from(expectedSig);
  const bufUser = Buffer.from(userSig);

  // Buffers MUST have identical byte lengths before calling timingSafeEqual
  if (bufExpected.length !== bufUser.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufExpected, bufUser);
}

const secretHash = crypto.createHash('sha256').update('data').digest('hex');
console.log('Valid:', verifySignature(secretHash, secretHash)); // true
```

---

### Q3: Why must you check `bufA.length === bufB.length` before calling `crypto.timingSafeEqual()`?

**Conceptual Explanation:**

If two buffers passed to `crypto.timingSafeEqual(bufA, bufB)` do not have the exact same `byteLength`, the method immediately throws a `RangeError: Input buffers must have the same byte length`. If unhandled, this can crash the server process or allow an attacker to probe valid signature lengths via unhandled exception responses.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const b1 = Buffer.from("abc");
const b2 = Buffer.from("abcd");

try {
  crypto.timingSafeEqual(b1, b2); // Throws RangeError!
} catch (err) {
  console.log('Caught expected error:', err.name); // RangeError
}
```

---

### Q4: What is a Length Extension Attack and why does HMAC defend against it?

**Conceptual Explanation:**

In Merkle–Damgård hash functions (MD5, SHA-1, SHA-256), a hash output represents the internal state after processing the last block. If an application calculates message authenticity as $H(\text{secret} \parallel \text{message})$, an attacker observing the hash and message can append their own data to the message and resume the hash calculation from the known intermediate state without ever knowing the secret key. HMAC uses a nested hash structure $H(K \oplus opad \parallel H(K \oplus ipad \parallel M))$ that prevents extending the inner hash.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const secret = "SUPER_SECRET_KEY";
const message = "action=transfer&amount=100";

// HMAC is mathematically immune to length extension:
const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
console.log('Secure HMAC-SHA256:', hmac);
```

---

### Q5: How does streaming hash generation with `crypto.createHash()` prevent Out-Of-Memory crashes?

**Conceptual Explanation:**

When hashing files or network uploads larger than available RAM (e.g. 10GB ISO files), loading the entire payload into a single Buffer triggers an Out-Of-Memory crash. `crypto.createHash()` implements a Node.js `Transform` stream that processes data in tiny, constant-sized chunks (e.g. 64KB) through internal C++ OpenSSL accumulators, maintaining a constant RAM usage of only a few kilobytes.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { Readable } from 'node:stream';

const hash = crypto.createHash('sha256');

// Simulate chunked streaming data
const stream = Readable.from(["Chunk 1 ", "Chunk 2 ", "Final Chunk"]);
stream.on('data', chunk => hash.update(chunk));
stream.on('end', () => {
  console.log('Streaming Digest:', hash.digest('hex'));
});
```

---

### Q6: What is the difference between AES-CBC and AES-GCM?

**Conceptual Explanation:**

AES-CBC (Cipher Block Chaining) only provides confidentiality (encryption). It requires explicit PKCS#7 padding and is vulnerable to Padding Oracle Attacks and bit-flipping tampering unless coupled with an HMAC. AES-GCM (Galois/Counter Mode) is an AEAD (Authenticated Encryption with Associated Data) mode that provides BOTH encryption and cryptographic integrity verification via a 16-byte authentication tag, eliminating the need for padding.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

// GCM is modern industry standard AEAD
console.log('Supports AES-256-GCM:', crypto.getCiphers().includes('aes-256-gcm'));
console.log('Supports AES-256-CBC:', crypto.getCiphers().includes('aes-256-cbc'));
```

---

### Q7: Why is Nonce/IV reuse catastrophic in AES-GCM authenticated encryption?

**Conceptual Explanation:**

In AES-GCM, the initialization vector (IV) and key generate a keystream via counter mode. If the exact same $(Key, IV)$ pair is reused to encrypt two different plaintexts, XORing the two ciphertexts cancels out the keystream ($C_1 \oplus C_2 = P_1 \oplus P_2$), revealing plaintext relations. Furthermore, the Galois hash key $H$ can be recovered, allowing an attacker to forge valid authentication tags for arbitrary forged messages.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const key = crypto.randomBytes(32);

// ALWAYS generate a fresh, cryptographically unique IV for EVERY encryption!
function createFreshIV() {
  return crypto.randomBytes(12); // Standard 96-bit IV for GCM
}
console.log('Unique IV 1:', createFreshIV().toString('hex'));
console.log('Unique IV 2:', createFreshIV().toString('hex'));
```

---

### Q8: What is the role of the Authentication Tag in `crypto.createDecipheriv()` for AES-GCM?

**Conceptual Explanation:**

The Authentication Tag (typically 16 bytes) is generated by the cipher during encryption via `cipher.getAuthTag()`. Before decrypting, the consumer MUST set this tag using `decipher.setAuthTag(tag)`. When `decipher.final()` is called, OpenSSL validates that the tag matches the ciphertext and Associated Data. If even a single bit of the ciphertext or tag was altered, `final()` throws an `Error: Unsupported state or unable to authenticate data`.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);

// Encrypt
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ciphertext = Buffer.concat([cipher.update("Secret Data", 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();

// Decrypt with tampered tag
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
tag[0] ^= 0xFF; // Tamper with authentication tag!
decipher.setAuthTag(tag);

try {
  decipher.update(ciphertext);
  decipher.final(); // Throws authentication failure!
} catch (e) {
  console.log('Authentication failed as expected:', e.message);
}
```

---

### Q9: Why is SHA-256 considered completely insecure for storing user passwords?

**Conceptual Explanation:**

SHA-256 is designed to be as fast as possible for high-throughput data integrity. A modern consumer GPU can compute tens of billions of SHA-256 hashes per second. Attackers can brute-force standard passwords or test dictionary wordlists in seconds. Password storage requires slow, memory-hard Key Derivation Functions (Argon2id, Scrypt, PBKDF2) that enforce CPU and RAM costs to make hardware ASIC/GPU cracking economically infeasible.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

// FAST (Bad for passwords, good for files):
const sha = crypto.createHash('sha256').update('password123').digest('hex');

// SLOW & MEMORY-HARD (Good for passwords):
crypto.scrypt('password123', 'random_salt', 64, { N: 16384 }, (err, derivedKey) => {
  console.log('Scrypt key generated:', derivedKey.toString('hex').slice(0, 16) + '...');
});
```

---

### Q10: Explain the parameters of `crypto.scrypt()`: `N`, `r`, `p`, and `maxmem`.

**Conceptual Explanation:**

- `N`: CPU/memory cost parameter (must be a power of 2, e.g. 16,384 or 32,768). Controls total iterations.
- `r`: Block size parameter (typically 8), tuning sequential memory read size and memory bandwidth.
- `p`: Parallelization parameter (typically 1), controlling thread count.
- `maxmem`: Memory safety limit in bytes (default 32MB). If $128 \times N \times r \times p > \text{maxmem}$, `scrypt` throws an error to prevent memory exhaustion.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const password = "UserMasterKey2026!";
const salt = crypto.randomBytes(16);

crypto.scrypt(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) => {
  if (err) throw err;
  console.log('Scrypt derived 256-bit key length:', key.length); // 32
});
```

---

### Q11: How does `crypto.randomUUID()` differ from the npm `uuid` package?

**Conceptual Explanation:**

`crypto.randomUUID()` is a native C++ V8 binding introduced in Node.js v15.6.0 and standardized in modern Web Crypto. It generates RFC4122 version 4 UUIDs directly from the OS kernel CSPRNG without allocating intermediate JavaScript arrays, executing approximately 4x to 10x faster than third-party pure-JavaScript npm packages.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const id = crypto.randomUUID();
console.log('Native UUIDv4:', id);
console.log('Matches UUID pattern:', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
```

---

### Q12: What is Modulo Bias when generating random numbers from random bytes, and how do you eliminate it?

**Conceptual Explanation:**

If you take a random byte (0–255) and compute `byte % 10` to get a digit (0–9), numbers 0 through 5 have 26 possible byte representations (e.g. 0, 10, 20... 250), while numbers 6 through 9 have only 25 representations ($256 \pmod{10} = 6$). This introduces statistical bias. To eliminate modulo bias, discard (re-roll) all bytes greater than or equal to the largest multiple of the divisor (e.g. discard $\ge 250$).

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

function unbiasedRandomInt(min, max) {
  const range = max - min + 1;
  const maxAcceptable = 256 - (256 % range);
  let byte;
  do {
    byte = crypto.randomBytes(1)[0];
  } while (byte >= maxAcceptable); // Re-roll biased values

  return min + (byte % range);
}

console.log('Unbiased random digit (0-9):', unbiasedRandomInt(0, 9));
```

---

### Q13: What is `crypto.generateKeyPair()` and how does it generate asymmetric keys asynchronously?

**Conceptual Explanation:**

`crypto.generateKeyPair(type, options, callback)` offloads heavy asymmetric prime factorization or elliptic curve scalar point multiplication to the libuv background threadpool, avoiding blocking the main JavaScript event loop during RSA or Ed25519 key generation.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

crypto.generateKeyPair('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
}, (err, publicKey, privateKey) => {
  if (err) throw err;
  console.log('Generated Ed25519 Key Pair successfully');
});
```

---

### Q14: What is digital signature signing and verification using `crypto.sign()` and `crypto.verify()`?

**Conceptual Explanation:**

Digital signatures provide non-repudiation and authenticity. A sender hashes a message and encrypts the hash with their **private key** via `crypto.sign()`. Any receiver possessing the sender's **public key** can verify the signature using `crypto.verify()`. If the message was modified or signed with a different private key, verification returns `false`.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const data = Buffer.from("Transfer $500 to Bob", "utf-8");

// Sign with Private Key
const signature = crypto.sign(null, data, privateKey);

// Verify with Public Key
const isValid = crypto.verify(null, data, publicKey, signature);
console.log('Signature is valid:', isValid); // true
```

---

### Q15: What is PBKDF2 and how does it compare to Scrypt?

**Conceptual Explanation:**

PBKDF2 (Password-Based Key Derivation Function 2, RFC 2898) applies a pseudo-random function (like HMAC-SHA256) repeatedly in a loop (e.g. 600,000 iterations). While PBKDF2 is CPU-intensive, it requires negligible memory, making it vulnerable to massively parallel GPU and ASIC hardware attacks. Scrypt is memory-hard, requiring significant RAM per derivation, providing far stronger defense against hardware crackers.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const password = "UserSecret123";
const salt = crypto.randomBytes(16);

crypto.pbkdf2(password, salt, 600000, 32, 'sha256', (err, derivedKey) => {
  if (err) throw err;
  console.log('PBKDF2-SHA256 Key:', derivedKey.toString('hex').slice(0, 16) + '...');
});
```

---

### Q16: What is Associated Data (AAD) in AEAD ciphers like AES-GCM?

**Conceptual Explanation:**

Additional Authenticated Data (AAD) is data that must be authenticated for integrity but is NOT encrypted (remains plaintext in the protocol header, such as IP addresses, packet sequence numbers, or timestamps). Passed via `cipher.setAAD(aadBuffer)`. If an attacker modifies the AAD in transit, authentication fails during decryption.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);
const aad = Buffer.from("packet_id=1092;client_ip=192.168.1.1", "utf-8");

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
cipher.setAAD(aad); // Authenticate header without encrypting it
const ciphertext = Buffer.concat([cipher.update("Payload", 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();

// Decryption verifies both ciphertext AND AAD:
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAAD(aad);
decipher.setAuthTag(tag);
const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
console.log('Decrypted with valid AAD:', plaintext.toString('utf8'));
```

---

### Q17: What is the difference between `crypto.randomBytes()` and `crypto.pseudoRandomBytes()`?

**Conceptual Explanation:**

`crypto.pseudoRandomBytes()` is a legacy Node.js method that historically permitted falling back to non-blocking pseudo-random sources if OS entropy was low. It has been completely deprecated; in modern Node.js, `crypto.pseudoRandomBytes()` is an exact alias for `crypto.randomBytes()`, which always queries the OS CSPRNG.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

console.log(crypto.pseudoRandomBytes === crypto.randomBytes); // true in modern Node.js
```

---

### Q18: What is Diffie-Hellman Key Exchange (ECDH) and how do two parties derive a shared secret?

**Conceptual Explanation:**

ECDH (Elliptic-Curve Diffie–Hellman) allows two parties (Alice and Bob), each possessing a private/public keypair, to compute the exact same shared secret over an insecure public channel. Neither transmits their private key; Alice combines Bob's public key with her private key, while Bob combines Alice's public key with his private key, arriving at identical shared memory.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const alice = crypto.createECDH('prime256v1');
alice.generateKeys();

const bob = crypto.createECDH('prime256v1');
bob.generateKeys();

// Alice computes secret using Bob's public key
const aliceSecret = alice.computeSecret(bob.getPublicKey());
// Bob computes secret using Alice's public key
const bobSecret = bob.computeSecret(alice.getPublicKey());

console.log('Shared secrets match:', aliceSecret.equals(bobSecret)); // true
```

---

### Q19: How does `crypto.hkdf()` (HMAC-based Key Derivation Function) work?

**Conceptual Explanation:**

HKDF (RFC 5869) derives cryptographically strong pseudorandom keys from high-entropy or raw shared secrets (such as ECDH shared secrets). It operates in two phases: **Extract** (extracts a fixed-length pseudorandom key using a salt) and **Expand** (expands the key to the desired output length using an application-specific context `info` string).

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const ikm = crypto.randomBytes(32); // Input Keying Material (e.g. from ECDH)
const salt = crypto.randomBytes(16);
const info = 'app-encryption-key-v1';

crypto.hkdf('sha256', ikm, salt, info, 32, (err, derivedKey) => {
  if (err) throw err;
  console.log('HKDF Derived Key (32B):', derivedKey.toString('hex').slice(0, 16) + '...');
});
```

---

### Q20: What is Web Crypto `SubtleCrypto.digest()` and how does it compare to `crypto.createHash()`?

**Conceptual Explanation:**

`SubtleCrypto.digest(algorithm, data)` is the standardized browser Web Crypto method. It takes a typed array or ArrayBuffer and returns a Promise resolving to an `ArrayBuffer` containing the binary hash digest. Unlike Node's `createHash`, `SubtleCrypto.digest()` does not support incremental stream updating.

**Runnable Code Example:**

```javascript
async function subtleSha256(message) {
  const enc = new TextEncoder();
  const digestBuffer = await globalThis.crypto.subtle.digest('SHA-256', enc.encode(message));
  return Array.from(new Uint8Array(digestBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

subtleSha256("Antigravity").then(h => console.log('SubtleCrypto Hash:', h));
```

---

### Q21: What is an initialization vector (IV) and what happens if an IV is reused in AES-CBC?

**Conceptual Explanation:**

In CBC mode, the IV is XORed with the first plaintext block before encryption. If an IV is reused with the same key, an adversary can determine whether the first block of two different messages is identical ($C_0^A = C_0^B \iff P_0^A = P_0^B$). In CBC, IVs must be unpredictable (generated via CSPRNG) to prevent Chosen-Plaintext Attacks (like the BEAST attack on TLS 1.0).

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

// CBC requires a 16-byte IV (matches AES block size)
const cbcIV = crypto.randomBytes(16);
console.log('CBC 16-byte IV:', cbcIV.length); // 16
```

---

### Q22: What is the difference between `crypto.createCipher()` and `crypto.createCipheriv()`?

**Conceptual Explanation:**

`crypto.createCipher(algo, password)` is a legacy, insecure API that derived keys and IVs using the obsolete OpenSSL `EVP_BytesToKey` algorithm with MD5 and zero salt. It has been removed/deprecated. Modern code MUST use `crypto.createCipheriv(algo, key, iv)`, which takes an explicit, cryptographically derived key and a unique random IV.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

// MODERN SECURE USAGE:
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
console.log('Cipher initialized securely');
```

---

### Q23: What is BLAKE3 and why is it replacing SHA-256 in high-throughput applications?

**Conceptual Explanation:**

BLAKE3 is an ultra-fast cryptographic hash function based on Bao and BLAKE2. It utilizes an internal Merkle tree structure that allows it to process chunks of data in parallel using CPU SIMD vector lanes (AVX-512, NEON) and multi-core parallelism. BLAKE3 is typically 6x to 12x faster than SHA-256 while providing equal or greater 128-bit security margins.

**Runnable Code Example:**

```javascript
// BLAKE3 architectural property: parallel tree hashing
console.log('BLAKE3 achieves >10 GB/s on modern multi-core AVX-512 CPUs');
```

---

### Q24: How do you generate an RSA key pair and encrypt data using RSA-OAEP?

**Conceptual Explanation:**

RSA-OAEP (Optimal Asymmetric Encryption Padding) is the secure standard for asymmetric RSA encryption. It uses hashing (e.g. SHA-256) and MGF1 masking to eliminate mathematical lattice attacks present in legacy PKCS#1 v1.5 padding.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

const secretMessage = Buffer.from("Credit Card Data", "utf-8");
const encrypted = crypto.publicEncrypt({
  key: publicKey,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha256'
}, secretMessage);

const decrypted = crypto.privateDecrypt({
  key: privateKey,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha256'
}, encrypted);

console.log('Decrypted RSA:', decrypted.toString('utf-8'));
```

---

### Q25: What is the difference between asymmetric encryption and asymmetric signing?

**Conceptual Explanation:**

In asymmetric encryption, the sender encrypts with the receiver's **public key**, and only the receiver can decrypt using their **private key** (ensuring confidentiality). In asymmetric signing, the sender signs a digest using their **private key**, and anyone can verify the signature using the sender's **public key** (ensuring authenticity and non-repudiation).

**Runnable Code Example:**

```javascript
console.log('Encryption = Public Key Encrypt -> Private Key Decrypt');
console.log('Signing    = Private Key Sign    -> Public Key Verify');
```

---

### Q26: What is Constant-Time execution in cryptographic programming?

**Conceptual Explanation:**

Constant-time code takes the exact same number of CPU cycles to execute regardless of the input data (such as secret keys or signature bytes). Branching on secret data (`if (secret[i] == guess[i])`) or memory lookups with secret indices creates cache timing variations that side-channel attackers can exploit over the network.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

// Constant time comparison
const ok = crypto.timingSafeEqual(Buffer.from("sec1"), Buffer.from("sec1"));
console.log('Constant-time execution verified:', ok);
```

---

### Q27: What is an Ed25519 signature and why is it preferred over RSA and ECDSA?

**Conceptual Explanation:**

Ed25519 uses the Edwards-curve Digital Signature Algorithm (EdDSA) over Curve25519. Advantages: 1) Tiny keys (32 bytes public, 32 bytes private, 64 bytes signature), 2) Immune to timing attacks and cache attacks by design, 3) Does NOT require a random nonce during signing (eliminating the catastrophic nonce-reuse signature leakage that plagued PlayStation 3 ECDSA), and 4) Extremely fast verification.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const sig = crypto.sign(null, Buffer.from("payload"), privateKey);
console.log('Ed25519 Signature length (bytes):', sig.length); // 64 bytes
```

---

### Q28: What is the PlayStation 3 ECDSA nonce reuse vulnerability?

**Conceptual Explanation:**

In ECDSA (standard elliptic curve signatures), signing requires a secret random nonce $k$. If the same $k$ is used to sign two different messages, basic algebra on the two signatures allows an attacker to compute the private key directly ($d = (s_1 m_2 - s_2 m_1) / (s_2 r - s_1 r)$). Sony's PS3 OS used a hardcoded constant $k$ instead of a random number, allowing hackers to recover Sony's master private key. Ed25519 avoids this by deterministically deriving $k = H(\text{privateKey} \parallel M)$.

**Runnable Code Example:**

```javascript
console.log('Deterministic signatures (Ed25519) eliminate ECDSA random nonce failure modes');
```

---

### Q29: What is Salt in password hashing and why must it be unique per user?

**Conceptual Explanation:**

A salt is a random bit sequence (typically 16 bytes from CSPRNG) concatenated with a password before hashing. If passwords are not salted, identical passwords produce identical hashes, and attackers can use precomputed Rainbow Tables to instantly reverse millions of hashes. A unique salt forces an attacker to compute a dedicated dictionary attack for every individual user account.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const salt1 = crypto.randomBytes(16).toString('hex');
const salt2 = crypto.randomBytes(16).toString('hex');
console.log('Unique Salt 1:', salt1);
console.log('Unique Salt 2:', salt2);
```

---

### Q30: How does `crypto.createHmac()` differ from `crypto.createHash()`?

**Conceptual Explanation:**

`createHash(algo)` computes a raw unkeyed cryptographic digest of data. `createHmac(algo, key)` computes a keyed Message Authentication Code using a shared secret key, verifying both data integrity and author authenticity while resisting length-extension attacks.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const hash = crypto.createHash('sha256').update("message").digest('hex');
const hmac = crypto.createHmac('sha256', "secret_key").update("message").digest('hex');

console.log('Hash (unkeyed):', hash.slice(0, 16));
console.log('HMAC (keyed):  ', hmac.slice(0, 16));
```

---

### Q31: How do you securely hash and verify passwords using `crypto.scryptSync()`?

**Conceptual Explanation:**

Combine a unique 16-byte CSPRNG salt with the password. Format the stored string with salt and hash parameters (e.g. `salt:hash`). During login, parse the stored salt, hash the incoming password with the same salt, and compare using `crypto.timingSafeEqual()`.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

function hashPass(pass) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pass, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPass(pass, stored) {
  const [salt, hash] = stored.split(':');
  const testHash = crypto.scryptSync(pass, salt, 64);
  return crypto.timingSafeEqual(testHash, Buffer.from(hash, 'hex'));
}

const record = hashPass("SecretAdmin123");
console.log('Password valid:', verifyPass("SecretAdmin123", record)); // true
console.log('Wrong password:', verifyPass("WrongPass", record));       // false
```

---

### Q32: What is `crypto.constants` and what flags does it expose?

**Conceptual Explanation:**

`crypto.constants` exposes internal OpenSSL constants, including RSA padding flags (`RSA_PKCS1_OAEP_PADDING`, `RSA_PKCS1_PADDING`), SSL/TLS engine options, and cipher engine modes.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

console.log('OAEP Padding constant:', crypto.constants.RSA_PKCS1_OAEP_PADDING);
console.log('PSS Padding constant: ', crypto.constants.RSA_PKCS1_PSS_PADDING);
```

---

### Q33: What is Subresource Integrity (SRI) and how is it calculated?

**Conceptual Explanation:**

SRI is a browser security feature enabling web pages to verify that external CDN resources (scripts, stylesheets) have not been tampered with or injected with malware. The `<script>` tag specifies `integrity="sha384-<base64-hash>"`. The browser hashes the fetched script and aborts execution if it does not match.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

function calculateSRI(fileContent) {
  const hash = crypto.createHash('sha384').update(fileContent).digest('base64');
  return `sha384-${hash}`;
}

const mockScript = "console.log('Hello CDN');";
console.log('SRI Attribute:', calculateSRI(mockScript));
```

---

### Q34: How does `crypto.Certificate` verify and extract SPKAC (Signed Public Key and Challenge) data?

**Conceptual Explanation:**

`crypto.Certificate` is an internal utility for handling Netscape SPKAC data structures historically used for browser SSL client certificates, offering `verifySpkac()`, `exportPublicKey()`, and `exportChallenge()`.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

console.log('Certificate exports:', Object.keys(crypto.Certificate));
```

---

### Q35: What is Key Derivation Function (KDF) stretching?

**Conceptual Explanation:**

Key stretching is the deliberate repetition of mathematical hashing loops thousands of times to transform a low-entropy user password (which can be memorized) into a cryptographically strong, high-entropy master encryption key that resists brute-force dictionary attacks.

**Runnable Code Example:**

```javascript
console.log('KDF stretching trades 100ms of CPU login time to multiply attacker cracking costs by 1,000,000x');
```

---

### Q36: What is Rainbow Table attack and how does Salting defeat it?

**Conceptual Explanation:**

A Rainbow Table is a precomputed database of plaintext passwords and their corresponding hash digests, utilizing reduction functions to compress trillions of password hashes into a few gigabytes of disk space. Salting appends a unique random string to each password, rendering precomputed tables useless because the attacker would have to compute a new multi-terabyte table for every distinct salt.

**Runnable Code Example:**

```javascript
console.log('Salting forces attackers to discard global precomputed tables and attack each account individually');
```

---

### Q37: How do you verify a GitHub webhook signature using `x-hub-signature-256`?

**Conceptual Explanation:**

GitHub transmits HMAC-SHA256 signatures in the `x-hub-signature-256` header prefixed with `sha256=`. The server computes the HMAC of the raw request payload using the configured webhook secret and compares it using `crypto.timingSafeEqual()`.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

function verifyGitHubWebhook(rawPayload, headerSignature, secret) {
  if (!headerSignature.startsWith('sha256=')) return false;
  const signatureHex = headerSignature.slice(7);

  const computedHex = crypto.createHmac('sha256', secret)
    .update(rawPayload)
    .digest('hex');

  const bufExpected = Buffer.from(computedHex, 'hex');
  const bufReceived = Buffer.from(signatureHex, 'hex');

  if (bufExpected.length !== bufReceived.length) return false;
  return crypto.timingSafeEqual(bufExpected, bufReceived);
}

const secret = "gh_secret_999";
const payload = JSON.stringify({ action: "push", ref: "main" });
const validHeader = "sha256=" + crypto.createHmac('sha256', secret).update(payload).digest('hex');

console.log('GitHub webhook verified:', verifyGitHubWebhook(payload, validHeader, secret)); // true
```

---

### Q38: What is a Replay Attack in webhook architectures and how do timestamps prevent it?

**Conceptual Explanation:**

In a replay attack, an eavesdropper intercepts a valid signed webhook request (e.g. `charge.success`) and resends the exact same raw HTTP request hours or days later. Even though the HMAC signature is valid, the server would execute a duplicate action. Defense: include a timestamp header (e.g. Stripe's `t=1600000000`), include the timestamp in the signed HMAC payload, and reject requests where `|Date.now() - timestamp| > 300` seconds.

**Runnable Code Example:**

```javascript
function isTimestampFresh(timestampSeconds, maxDriftSec = 300) {
  const currentSec = Math.floor(Date.now() / 1000);
  return Math.abs(currentSec - timestampSeconds) <= maxDriftSec;
}

console.log('Current timestamp is fresh:', isTimestampFresh(Math.floor(Date.now() / 1000))); // true
console.log('Old timestamp (1 hour ago):', isTimestampFresh(Math.floor(Date.now() / 1000) - 3600)); // false
```

---

### Q39: What is `KeyObject` in `node:crypto` and how does it prevent key material leakage?

**Conceptual Explanation:**

`KeyObject` is an opaque C++ reference representing a cryptographic key (symmetric secret, public, or private key). Introduced in Node v11, it keeps raw private key bytes in protected OpenSSL memory rather than in the V8 garbage-collected heap, preventing keys from leaking into heap dumps or error traces.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const keyObj = crypto.createSecretKey(crypto.randomBytes(32));
console.log('Key type:', keyObj.type); // 'secret'
console.log('Key symmetric size in bytes:', keyObj.symmetricKeySize); // 32
```

---

### Q40: How does `crypto.createPrivateKey()` parse PKCS#8 and PKCS#1 PEM keys?

**Conceptual Explanation:**

`crypto.createPrivateKey(keyInput)` parses PEM-encoded strings or DER buffers containing RSA, EC, or Ed25519 private keys, validating ASN.1 structures and returning a managed `KeyObject`.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const { privateKey } = crypto.generateKeyPairSync('ed25519');
const exportedPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const imported = crypto.createPrivateKey(exportedPem);

console.log('Imported KeyObject asymmetricKeyType:', imported.asymmetricKeyType); // 'ed25519'
```

---

### Q41: What is the difference between PKCS#1 and PKCS#8 private key formats?

**Conceptual Explanation:**

PKCS#1 (`-----BEGIN RSA PRIVATE KEY-----`) is an older RSA-specific format that only supports RSA keys. PKCS#8 (`-----BEGIN PRIVATE KEY-----`) is a universal, algorithm-agnostic standard that encapsulates any asymmetric key (RSA, ECDSA, Ed25519) along with an ASN.1 AlgorithmIdentifier object and optional encrypted wrapping.

**Runnable Code Example:**

```javascript
console.log('PKCS#1 = RSA-only legacy header');
console.log('PKCS#8 = Modern universal asymmetric standard');
```

---

### Q42: What is the difference between SPKI and PKCS#1 public key formats?

**Conceptual Explanation:**

SubjectPublicKeyInfo (SPKI, `-----BEGIN PUBLIC KEY-----`) is the X.509 standard format for all public keys, storing algorithm metadata and raw public key bits. PKCS#1 (`-----BEGIN RSA PUBLIC KEY-----`) is the legacy RSA-only format.

**Runnable Code Example:**

```javascript
console.log('SPKI = Universal standard for public keys (X.509)');
```

---

### Q43: How do you securely wipe a cryptographic key from Node.js memory after use?

**Conceptual Explanation:**

V8 garbage collection does not overwrite heap memory upon reclamation. If raw keys reside in a `Buffer`, invoke `buf.fill(0)` immediately after encryption/decryption completes to overwrite the memory address with zeroes.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const tempKey = crypto.randomBytes(32);
try {
  // Use key...
} finally {
  tempKey.fill(0); // Zero out RAM
  console.log('Key memory wiped:', tempKey.every(b => b === 0)); // true
}
```

---

### Q44: What is an Authenticated Encryption with Associated Data (AEAD) cipher and why is it superior to Encrypt-then-MAC?

**Conceptual Explanation:**

In Encrypt-then-MAC, developers must independently encrypt plaintext and compute an HMAC over the ciphertext, which frequently results in subtle implementation bugs (e.g. omitting the IV from the HMAC, timing attack mismatches). AEAD ciphers like AES-GCM and ChaCha20-Poly1305 natively integrate confidentiality and authenticity into a single unified cryptographic operation mathematically proven to prevent tampering.

**Runnable Code Example:**

```javascript
console.log('AEAD eliminates developer errors in manual cipher + MAC combinations');
```

---

### Q45: What is ChaCha20-Poly1305 and when is it preferred over AES-256-GCM?

**Conceptual Explanation:**

ChaCha20-Poly1305 is an AEAD cipher that combines the ChaCha20 stream cipher with the Poly1305 MAC. It is preferred on mobile devices, IoT, and CPUs lacking hardware AES-NI acceleration instructions, where ChaCha20 is 3x to 4x faster and resistant to CPU cache timing attacks.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

console.log('Supports ChaCha20-Poly1305:', crypto.getCiphers().includes('chacha20-poly1305'));
```

---



## 09. Complete Question & Answer Catalog (46–90)

### Q46: Compare Argon2id, Scrypt, Bcrypt, and PBKDF2 for password storage in 2026.

**Conceptual Explanation:**

Argon2id is the state-of-the-art password hashing standard (winner of the Password Hashing Competition), offering combined resistance against both side-channel cache attacks and GPU/ASIC hardware brute-forcing. Scrypt is memory-hard and native to `node:crypto`. Bcrypt is widely deployed but limited to 72 bytes of password input and lacks configurable memory hardness. PBKDF2 is CPU-hard but not memory-hard, making it vulnerable to ASICs. Hierarchy: Argon2id > Scrypt > Bcrypt > PBKDF2.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

// Native Scrypt is available out of the box in Node:
const salt = crypto.randomBytes(16);
crypto.scrypt("UserPass!", salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
  console.log('Native memory-hard Scrypt key ready');
});
```

---

### Q47: What is the critical JWT 'alg: none' vulnerability and how is it prevented?

**Conceptual Explanation:**

The 'none' algorithm vulnerability occurs when a JWT verification library accepts a token where the header specifies `{"alg": "none"}`. If the library fails to enforce an expected algorithm, it treats the token as an unauthenticated plaintext token and skips signature verification, allowing any client to forge arbitrary admin claims. Prevention: strictly whitelist allowed algorithms (e.g. `algorithms: ['RS256']`) and reject any token lacking signatures.

**Runnable Code Example:**

```javascript
function verifyJwtAlg(headerAlg, expectedAlg) {
  if (headerAlg.toLowerCase() === 'none' || headerAlg !== expectedAlg) {
    throw new Error(`Forbidden algorithm: ${headerAlg}`);
  }
  return true;
}

try {
  verifyJwtAlg('none', 'HS256');
} catch (e) {
  console.log('Caught JWT vulnerability attempt:', e.message);
}
```

---

### Q48: How do you import raw cryptographic keys into Web Crypto API using `subtle.importKey()`?

**Conceptual Explanation:**

`crypto.subtle.importKey(format, keyData, algorithm, extractable, keyUsages)` imports binary keys into browser/edge runtimes. Format can be `'raw'`, `'pkcs8'`, `'spki'`, or `'jwk'`. The returned `CryptoKey` object is opaque and cannot be inspected directly if `extractable` is set to `false`, protecting it against XSS exfiltration.

**Runnable Code Example:**

```javascript
async function importHmacKey(rawSecretString) {
  const enc = new TextEncoder();
  return await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(rawSecretString),
    { name: 'HMAC', hash: 'SHA-256' },
    false, // extractable = false (XSS defense!)
    ['sign', 'verify']
  );
}

importHmacKey("my-secret").then(k => console.log('Imported CryptoKey type:', k.type));
```

---

### Q49: How do you encrypt and decrypt data in Web Crypto API using AES-GCM?

**Conceptual Explanation:**

Use `crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintextBuffer)` and `crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertextBuffer)`. In Web Crypto, the 16-byte authentication tag is automatically appended to the end of the ciphertext ArrayBuffer during encryption and validated automatically during decryption.

**Runnable Code Example:**

```javascript
async function webCryptoAesGcm() {
  const key = await globalThis.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode("Browser Confidential Data");

  const ciphertext = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

  console.log('Decrypted Web Crypto:', new TextDecoder().decode(decrypted));
}
webCryptoAesGcm();
```

---

### Q50: How do you sign and verify an HMAC message in Web Crypto API?

**Conceptual Explanation:**

Use `crypto.subtle.sign('HMAC', key, dataBuffer)` to compute the signature, and `crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer)` to verify it. Verification executes in constant time internally within the browser engine.

**Runnable Code Example:**

```javascript
async function webCryptoHmac() {
  const key = await globalThis.crypto.subtle.generateKey(
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const data = new TextEncoder().encode("Payload to sign");
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, data);
  const isValid = await globalThis.crypto.subtle.verify('HMAC', key, signature, data);
  console.log('Web Crypto HMAC Valid:', isValid); // true
}
webCryptoHmac();
```

---

### Q51: How do you derive an AES encryption key from a password using Web Crypto PBKDF2?

**Conceptual Explanation:**

First import the password string as a base `raw` key with algorithm `'PBKDF2'`. Then call `crypto.subtle.deriveKey()` specifying the salt, iteration count (e.g. 600,000), target cipher (`AES-GCM`), and key length (256).

**Runnable Code Example:**

```javascript
async function deriveKeyWebCrypto(passwordStr, saltBytes) {
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passwordStr),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return await globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
console.log('Web Crypto PBKDF2 derivation pipeline ready');
```

---

### Q52: What is a Merkle Tree and how do you construct a binary hash tree in JavaScript?

**Conceptual Explanation:**

A Merkle Tree is a binary tree where every leaf node contains the cryptographic hash of a data block, and every parent node contains the cryptographic hash of its two child nodes concatenated ($H(L \parallel R)$). The root node (Merkle Root) summarizes the integrity of the entire dataset.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function buildMerkleRoot(leaves) {
  let layer = leaves.map(l => sha256(l));
  while (layer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = i + 1 < layer.length ? layer[i + 1] : left; // Duplicate last if odd
      nextLayer.push(sha256(left + right));
    }
    layer = nextLayer;
  }
  return layer[0];
}

const root = buildMerkleRoot(["Tx1", "Tx2", "Tx3", "Tx4"]);
console.log('Merkle Root:', root.slice(0, 16) + '...');
```

---

### Q53: How does Content-Addressable Storage (CAS) work in Git and IPFS using cryptographic hashes?

**Conceptual Explanation:**

In Content-Addressable Storage, files are addressed and retrieved by the cryptographic hash of their contents rather than by file path or name. If two identical files exist with different names, they produce the exact same SHA-256 or SHA-1 hash, achieving automatic deduplication and cryptographic verification.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

function computeGitBlobHash(content) {
  // Git prepends header "blob <size> " before hashing
  const header = `blob ${Buffer.byteLength(content)}\0`;
  return crypto.createHash('sha1').update(header + content).digest('hex');
}

console.log('Git Blob Hash for "hello\n":', computeGitBlobHash("hello\n")); // b6fc4c620b67d95f953a5c1c1230aaab5db5a1b0
```

---

### Q54: Compare Secp256k1 vs Prime256v1 (P-256) vs Curve25519 elliptic curves.

**Conceptual Explanation:**

Secp256k1 is a Koblitz curve used primarily in Bitcoin and Ethereum for ECDSA signatures. Prime256v1 (NIST P-256) is standard in TLS and WebAuthn. Curve25519 (Ed25519 for signing, X25519 for key exchange) was designed by Daniel J. Bernstein to be immune to side-channel cache attacks and is the modern standard for SSH and Signal.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

console.log('Supported EC curves in Node:', crypto.getCurves().slice(0, 5));
```

---

### Q55: What is Forward Secrecy (Perfect Forward Secrecy, PFS) in TLS and SSH?

**Conceptual Explanation:**

PFS guarantees that even if a server's long-term private master key is compromised in the future, past recorded encrypted communications CANNOT be decrypted. PFS achieves this by using Ephemeral Diffie–Hellman (ECDHE) to generate unique, temporary session keys for every connection, discarding the keys immediately after the session terminates.

**Runnable Code Example:**

```javascript
console.log('PFS uses ephemeral session keys discarded immediately after termination');
```

---

### Q56: What is Mutual TLS (mTLS) and how is it configured in Node.js?

**Conceptual Explanation:**

In standard TLS, only the server proves its identity to the client via an SSL certificate. In mTLS, BOTH the client and server present X.509 certificates to each other. The server validates the client's certificate against a trusted Certificate Authority (CA) before establishing the connection.

**Runnable Code Example:**

```javascript
import https from 'node:https';

// Conceptual mTLS server configuration:
const mtlsOptions = {
  requestCert: true,      // Request certificate from connecting client
  rejectUnauthorized: true // Reject connection if client cert is not signed by trusted CA
};
console.log('mTLS requires requestCert and rejectUnauthorized: true');
```

---

### Q57: How should you securely store and verify API keys in a database?

**Conceptual Explanation:**

NEVER store plaintext API keys in a database! Follow the GitHub/Stripe pattern: generate a key formatted as `<prefix>_<public_identifier>_<secret_entropy>` (e.g. `sk_live_abc123_XYZ999`). Store the SHA-256 hash of the secret portion in the database. When an API request arrives, hash the secret portion and perform a lookup/constant-time verification against the stored hash.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

function generateApiKey() {
  const prefix = "ak_live_";
  const publicId = crypto.randomBytes(4).toString('hex');
  const secretEntropy = crypto.randomBytes(24).toString('hex');
  const fullKey = `${prefix}${publicId}_${secretEntropy}`;
  const dbHash = crypto.createHash('sha256').update(secretEntropy).digest('hex');
  return { fullKey, publicId, dbHash };
}

const key = generateApiKey();
console.log('User receives:', key.fullKey);
console.log('DB stores publicId and hash:', key.publicId, key.dbHash.slice(0, 16) + '...');
```

---

### Q58: How do you securely store and verify password reset tokens?

**Conceptual Explanation:**

Similar to API keys, never store plaintext password reset tokens in the database. If the database is compromised via SQL injection, the attacker can use the tokens to take over accounts. Send the plaintext token to the user's email, but store `SHA256(token)` with an expiration timestamp in the database.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const dbHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
  return { emailLinkToken: rawToken, dbHash, expiresAt };
}

const reset = createPasswordResetToken();
console.log('Email receives token:', reset.emailLinkToken);
console.log('DB stores hash:', reset.dbHash);
```

---

### Q59: What is a Dummy Password Hash and how does it prevent User Enumeration via Timing Attacks?

**Conceptual Explanation:**

When a user logs in with an email that does NOT exist in the database, if the backend returns immediately (`User not found`), the response arrives in 2ms. If the email exists, computing the Scrypt/Argon2 password hash takes 100ms. Attackers measure this timing difference to enumerate valid user emails. Defense: if the user is not found, compute a dummy password hash on a hardcoded fake hash to equalize response times.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const DUMMY_SALT = crypto.randomBytes(16);
const DUMMY_HASH = crypto.scryptSync("dummy_password", DUMMY_SALT, 64);

function simulateLogin(userExists, inputPassword) {
  if (!userExists) {
    // Run dummy calculation to eliminate timing difference!
    crypto.scryptSync(inputPassword, DUMMY_SALT, 64);
    return false;
  }
  return true;
}
console.log('Timing equalized login ready');
```

---

### Q60: How do you implement Zero-Downtime Secret Key Rotation?

**Conceptual Explanation:**

Maintain an array of keys: a primary active key for encryption, and a list of previous valid keys for decryption. When verifying signatures or decrypting, try the primary key first. If validation fails, attempt decryption against the previous keys. When encrypting new data, always use the newest primary key.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

class KeyRing {
  constructor(activeKey, oldKeys = []) {
    this.activeKey = activeKey;
    this.allKeys = [activeKey, ...oldKeys];
  }

  sign(data) {
    return crypto.createHmac('sha256', this.activeKey).update(data).digest('hex');
  }

  verify(data, signature) {
    const sigBuf = Buffer.from(signature, 'hex');
    return this.allKeys.some(key => {
      const expected = crypto.createHmac('sha256', key).update(data).digest();
      return sigBuf.length === expected.length && crypto.timingSafeEqual(sigBuf, expected);
    });
  }
}

const ring = new KeyRing(crypto.randomBytes(32), [crypto.randomBytes(32)]);
const token = ring.sign("session_123");
console.log('Verified with KeyRing:', ring.verify("session_123", token)); // true
```

---

### Q61: What is Encrypted Session Cookie Sealing with AES-256-GCM?

**Conceptual Explanation:**

Instead of storing user sessions in an in-memory Redis database, encrypted session cookies store serialized JSON encrypted via AES-256-GCM directly inside the browser's HTTP-only cookie. The server decrypts and verifies the auth tag on each request with zero database lookups.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

function sealSession(sessionData, masterKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const jsonStr = JSON.stringify(sessionData);
  const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: iv:tag:ciphertext in base64
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}

function unsealSession(sealedCookie, masterKey) {
  const [ivB64, tagB64, encB64] = sealedCookie.split('.');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(encB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

const key = crypto.randomBytes(32);
const cookie = sealSession({ userId: 42, role: "admin" }, key);
console.log('Sealed Cookie:', cookie.slice(0, 30) + '...');
console.log('Unsealed Session:', unsealSession(cookie, key));
```

---

### Q62: Why can't you verify the authentication tag of an AES-GCM stream until the entire stream has finished?

**Conceptual Explanation:**

The GCM authentication tag is computed over the entire ciphertext using the GHASH polynomial accumulator. The tag is only finalized at the very end of the stream. If a server processes or executes decrypted plaintext as it arrives chunk-by-chunk before validating the final tag, an attacker can stream malicious payloads that execute before the authentication failure is detected.

**Runnable Code Example:**

```javascript
console.log('Streaming AEAD requires buffering plaintext or chunked AEAD framing to avoid premature execution');
```

---

### Q63: How does Chunked AEAD encryption solve streaming encryption for multi-gigabyte files?

**Conceptual Explanation:**

Chunked AEAD divides a file into fixed-size chunks (e.g. 64KB). Each 64KB chunk is encrypted with AES-GCM using an incrementing nonce counter, producing its own 16-byte authentication tag per chunk. The recipient decrypts and verifies each chunk independently in a streaming pipeline with constant memory usage.

**Runnable Code Example:**

```javascript
console.log('Chunked AEAD authenticates 64KB blocks independently for safe streaming');
```

---

### Q64: What is Post-Quantum Cryptography (PQC) and what are Kyber and Dilithium?

**Conceptual Explanation:**

Shor's algorithm running on a sufficiently large quantum computer can solve integer factorization (breaking RSA) and discrete logarithms (breaking ECDSA and ECDH) in polynomial time. Post-Quantum Cryptography relies on lattice-based mathematics. NIST standardized ML-KEM (CRYSTALS-Kyber) for post-quantum key exchange and ML-DSA (CRYSTALS-Dilithium) for post-quantum digital signatures.

**Runnable Code Example:**

```javascript
console.log('NIST PQC standards: ML-KEM (Kyber) and ML-DSA (Dilithium)');
```

---

### Q65: How do you generate a Cryptographically Secure Pseudo-Random Float in $[0, 1)$ without modulo bias?

**Conceptual Explanation:**

Generate 6 or 7 bytes of cryptographic entropy from `crypto.randomBytes()`. Mask to 53 bits (the maximum precision of an IEEE 754 double mantissa) and divide by $2^{53}$ ($9,007,199,254,740,992$).

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

function secureRandomFloat() {
  const buf = crypto.randomBytes(7);
  // Extract 53 random bits
  const high = buf.readUInt32BE(0) >>> 5; // 27 bits
  const low = buf.readUInt32BE(3) & 0x3FFFFFF; // 26 bits
  const bits53 = (high * 0x4000000) + low;
  return bits53 / 9007199254740992;
}

console.log('CSPRNG Float in [0, 1):', secureRandomFloat());
```

---

### Q66: What is Certificate Pinning and what are its operational tradeoffs?

**Conceptual Explanation:**

Certificate Pinning hardcodes the expected public key hash (SPKI fingerprint) of the server into the client application. It prevents Man-in-the-Middle attacks even if a public Certificate Authority is compromised. Tradeoff: if the pinned certificate expires or must be rotated due to an emergency compromise, client applications break unless backup pins are pre-provisioned.

**Runnable Code Example:**

```javascript
console.log('Pin the SubjectPublicKeyInfo (SPKI) rather than the leaf certificate for smooth rotation');
```

---

### Q67: What is `crypto.diffieHellman()` vs `crypto.createECDH()`?

**Conceptual Explanation:**

`crypto.diffieHellman()` implements classic finite-field Diffie–Hellman (MODP groups). It requires large 2048 or 4096-bit primes, which are slow to compute. `crypto.createECDH()` implements Elliptic Curve Diffie–Hellman, which provides equivalent 128-bit security with only 256-bit keys, executing orders of magnitude faster.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

console.log('createECDH prime256v1 provides equivalent security to 3072-bit classic DH with 10x speed');
```

---

### Q68: What is Shamir's Secret Sharing (SSS) algorithm?

**Conceptual Explanation:**

Shamir's Secret Sharing divides a master secret into $N$ unique shares such that any $K$ shares ($K \le N$, the threshold) can reconstruct the secret, but any $K - 1$ shares reveal zero information about the secret. It uses polynomial interpolation over finite fields $GF(2^8)$.

**Runnable Code Example:**

```javascript
console.log('Shamir Secret Sharing: (K, N) threshold polynomial scheme');
```

---

### Q69: How do you derive multiple keys from a master secret using `crypto.hkdf()`?

**Conceptual Explanation:**

Use HKDF with identical master key material and salt, but distinct application context `info` strings (e.g. `'app-encryption-key'` vs `'app-authentication-key'`). HKDF guarantees that the derived sub-keys are cryptographically independent.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const master = crypto.randomBytes(32);
const salt = crypto.randomBytes(16);

function deriveSubkey(context) {
  return crypto.hkdfSync('sha256', master, salt, context, 32);
}

const encKey = deriveSubkey('encryption-v1');
const authKey = deriveSubkey('authentication-v1');

console.log('Keys are independent:', !encKey.equals(authKey)); // true
```

---

### Q70: What is the difference between AES key lengths: AES-128, AES-192, and AES-256?

**Conceptual Explanation:**

The number refers to key size in bits: AES-128 (16 bytes, 10 rounds), AES-192 (24 bytes, 12 rounds), and AES-256 (32 bytes, 14 rounds). AES-128 is theoretically secure against all classical computers, but AES-256 is recommended for long-term security because Grover's quantum algorithm halves symmetric key security ($2^{128}$ quantum operations vs $2^{64}$).

**Runnable Code Example:**

```javascript
console.log('AES-256 provides 128-bit quantum security margin against Grover search');
```

---

### Q71: What is X25519 and how does it relate to Ed25519?

**Conceptual Explanation:**

Curve25519 can be used in two forms: Montgomery form for Diffie-Hellman key exchange (called **X25519**), and Twisted Edwards form for digital signatures (called **Ed25519**). Both share the same underlying elliptic curve equation.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
console.log('X25519 key pair generated');
```

---

### Q72: What is Blind Signature and why is it used in privacy-preserving e-cash?

**Conceptual Explanation:**

A blind signature allows a client to obtain a valid digital signature on a message from an authority without revealing the content of the message to the authority (like signing a document inside a carbon-paper envelope). Used in Chaumian e-cash and cryptographic voting systems.

**Runnable Code Example:**

```javascript
console.log('Blind signatures enable cryptographic proof of authenticity with zero knowledge of content');
```

---

### Q73: How does `crypto.createHash('sha256').copy()` enable branching hash computations?

**Conceptual Explanation:**

The `.copy()` method creates a clone of the current hash object, preserving its intermediate state. It allows an application to hash a common shared prefix once, clone the state, and branch into hashing distinct suffixes without recalculating the prefix from scratch.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const sharedPrefixHash = crypto.createHash('sha256').update("COMMON_HEADER_BYTES_");
const branchA = sharedPrefixHash.copy().update("PAYLOAD_A").digest('hex');
const branchB = sharedPrefixHash.copy().update("PAYLOAD_B").digest('hex');

console.log('Branch A:', branchA.slice(0, 16));
console.log('Branch B:', branchB.slice(0, 16));
```

---

### Q74: What is PKCS#7 padding and why does AES block cipher encryption require it?

**Conceptual Explanation:**

Block ciphers (like AES-CBC) operate on fixed 16-byte blocks. If plaintext is not a multiple of 16 bytes, padding bytes are added to fill the final block. PKCS#7 sets each padding byte to the number of padded bytes (e.g. if 3 bytes are missing, append `0x03, 0x03, 0x03`). If the plaintext is already an exact multiple of 16, a full 16-byte dummy block (`0x10` repeated 16 times) is appended.

**Runnable Code Example:**

```javascript
console.log('PKCS#7 padding appends N bytes each holding value N');
```

---

### Q75: What is a Padding Oracle Attack?

**Conceptual Explanation:**

If a server decrypts AES-CBC ciphertext and returns different error messages or response times when padding is invalid versus when padding is valid, an attacker can send modified ciphertext blocks and decrypt the entire message byte-by-byte in $256 \times \text{blocks}$ attempts without knowing the encryption key.

**Runnable Code Example:**

```javascript
console.log('Defense against padding oracle: Use AEAD (AES-GCM) or never leak padding errors');
```

---

### Q76: What is the Electronic Codebook (ECB) mode and why is it forbidden in production?

**Conceptual Explanation:**

ECB mode encrypts each 16-byte block independently with the same key without chaining. Identical plaintext blocks produce identical ciphertext blocks. In bitmap images, encrypting an image with ECB mode leaves the silhouette and outlines clearly visible (the famous ECB Penguin).

**Runnable Code Example:**

```javascript
console.log('ECB leaks patterns because identical inputs yield identical outputs');
```

---

### Q77: What is the difference between MAC and Digital Signature?

**Conceptual Explanation:**

A MAC (like HMAC) is **symmetric**: the sender and receiver share the same secret key. Anyone who can verify the MAC can also forge it. A Digital Signature (like Ed25519) is **asymmetric**: only the private key holder can sign, but anyone with the public key can verify, providing non-repudiation.

**Runnable Code Example:**

```javascript
console.log('MAC = Symmetric (Shared Key). Signature = Asymmetric (Public/Private Key).');
```

---

### Q78: How does `crypto.randomFillSync()` operate on existing TypedArrays?

**Conceptual Explanation:**

`crypto.randomFillSync(typedArray, [offset], [size])` fills an existing `Uint8Array` or `Buffer` in place with cryptographically secure random bytes from the OS CSPRNG, avoiding allocating a new buffer object.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const target = new Uint8Array(8);
crypto.randomFillSync(target);
console.log('Filled in-place:', [...target]);
```

---

### Q79: How do you generate cryptographically secure alphanumeric strings without external libraries?

**Conceptual Explanation:**

Sample random bytes from `crypto.randomBytes()`, map them against a safe character set (e.g. `[a-zA-Z0-9]`), and reject bytes outside the largest evenly divisible threshold to eliminate modulo bias.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

function secureId(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const maxValid = 256 - (256 % chars.length);
  let result = '';
  while (result.length < length) {
    const bytes = crypto.randomBytes(length - result.length);
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] < maxValid) {
        result += chars[bytes[i] % chars.length];
        if (result.length === length) break;
      }
    }
  }
  return result;
}

console.log('Secure Alphanumeric ID:', secureId(24));
```

---

### Q80: What is Zero-Knowledge Proof (ZKP) and what does it prove?

**Conceptual Explanation:**

A Zero-Knowledge Proof allows a prover to prove mathematically to a verifier that a statement is true (e.g. 'I know the private key for this address' or 'My age is over 21') without revealing any information other than the statement's validity.

**Runnable Code Example:**

```javascript
console.log('ZKP proves truth without revealing secret inputs (zk-SNARKs / zk-STARKs)');
```

---

### Q81: How do you detect if a cryptographic hash algorithm is vulnerable to collision attacks?

**Conceptual Explanation:**

A hash algorithm is vulnerable if researchers have discovered mathematical techniques to find two distinct inputs $M_1 \neq M_2$ such that $H(M_1) = H(M_2)$ in significantly fewer operations than the Birthday Bound ($2^{N/2}$). MD5 ($2^{128}$) was broken in 2004 ($2^{39}$ steps). SHA-1 ($2^{160}$) was broken in 2017 with SHAttered ($2^{63}$ operations).

**Runnable Code Example:**

```javascript
console.log('MD5 and SHA-1 have proven practical collision attacks; use SHA-256 or BLAKE3');
```

---

### Q82: What is OpenSSL FIPS mode in Node.js?

**Conceptual Explanation:**

FIPS 140-2 is a U.S. government standard specifying cryptographic module security requirements. Node.js can be compiled or executed with `--enable-fips` to enforce the OpenSSL FIPS provider, disallowing non-approved algorithms (like MD5, DES) and enforcing approved key lengths.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

console.log('FIPS mode active:', crypto.fips);
```

---

### Q83: What is the Double Ratchet Algorithm used in Signal and WhatsApp?

**Conceptual Explanation:**

The Double Ratchet combines symmetric KDF ratcheting (deriving new message keys on every message) with asymmetric Diffie–Hellman ratcheting (updating the shared secret on every reply turn). It guarantees **Break-in Recovery**: if an attacker compromises a device's current memory, they cannot read future messages once the user exchanges another reply.

**Runnable Code Example:**

```javascript
console.log('Double Ratchet provides forward secrecy AND break-in recovery');
```

---

### Q84: How do you hash a multi-part form data upload incrementally in Node.js?

**Conceptual Explanation:**

Pipe the incoming file stream into both `crypto.createHash('sha256')` and `fs.createWriteStream()` simultaneously using stream splitting (`passThrough` or multiple pipe listeners), computing the hash concurrently while writing to disk without double-reading.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';
import { PassThrough } from 'node:stream';

const pass = new PassThrough();
const hash = crypto.createHash('sha256');
pass.pipe(hash);
pass.write("Chunk 1");
pass.end();
hash.on('finish', () => console.log('Multi-stream hash computed'));
```

---

### Q85: What is the difference between `crypto.createSign()` and `crypto.sign()`?

**Conceptual Explanation:**

`crypto.createSign(algo)` is a streaming/chunked object: you call `.update()` multiple times and then `.sign(privateKey)`. `crypto.sign(algo, dataBuffer, privateKey)` is a one-shot convenience function that signs a complete buffer in a single call.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

const { privateKey } = crypto.generateKeyPairSync('ed25519');
const data = Buffer.from("Fast Data");
const sig = crypto.sign(null, data, privateKey);
console.log('One-shot signature verified');
```

---

### Q86: What is an Acoustic or Power Side-Channel Attack in cryptography?

**Conceptual Explanation:**

Physical side-channel attacks observe electrical power consumption (Differential Power Analysis) or high-frequency capacitor coil whine (acoustic cryptanalysis) emitted by a CPU while executing cryptographic operations to extract RSA and AES private keys.

**Runnable Code Example:**

```javascript
console.log('Constant-time and constant-power algorithms protect against physical side-channels');
```

---

### Q87: What is the Senior Engineering Architectural Decision Matrix for Cryptographic Primitives in 2026?

**Conceptual Explanation:**

Production standard selections:
- **Content Integrity:** SHA-256 or BLAKE3
- **Message Authentication:** HMAC-SHA256
- **Symmetric Encryption:** AES-256-GCM or ChaCha20-Poly1305
- **Password Hashing:** Argon2id or Scrypt
- **Digital Signatures:** Ed25519
- **Key Exchange:** X25519 (ECDHE)
- **Random Identifiers:** `crypto.randomUUID()`

**Runnable Code Example:**

```javascript
const cryptoTaxonomy2026 = {
  hashing: "SHA-256 / BLAKE3",
  mac: "HMAC-SHA256",
  aead: "AES-256-GCM",
  passwords: "Argon2id / Scrypt",
  signatures: "Ed25519",
  keyExchange: "X25519",
  tokens: "crypto.randomBytes / crypto.randomUUID"
};
console.table(cryptoTaxonomy2026);
```

---

### Q88: How does `crypto.webcrypto.subtle` bridge Node.js and Browser codebases for isomorphic cryptography?

**Conceptual Explanation:**

Because Node.js implements `globalThis.crypto.subtle`, developers can write isomorphic TypeScript libraries that execute identically in Chromium browsers, Cloudflare Workers, Deno, and Node.js without conditional branching or external polyfills.

**Runnable Code Example:**

```javascript
async function isomorphicDigest(msg) {
  const buf = new TextEncoder().encode(msg);
  const hash = await globalThis.crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

isomorphicDigest("Universal JS").then(h => console.log('Isomorphic Hash:', h.slice(0, 16)));
```

---

### Q89: What is the proper way to sanitize memory when handling biometric or private encryption keys?

**Conceptual Explanation:**

Allocate the key in a `Buffer` or `Uint8Array`. Enclose its usage inside a `try / finally` block. In the `finally` block, call `buffer.fill(0)` and discard all variable references so that the raw key material is destroyed immediately rather than lingering in memory.

**Runnable Code Example:**

```javascript
import crypto from 'node:crypto';

function executeWithZeroedKey(task) {
  const ephemeralKey = crypto.randomBytes(32);
  try {
    return task(ephemeralKey);
  } finally {
    ephemeralKey.fill(0);
  }
}
console.log('Sanitization wrapper ready');
```

---

### Q90: Why should cryptographic keys never be hardcoded in Git repositories or Docker images?

**Conceptual Explanation:**

Git commits preserve permanent historical records. Even if a subsequent commit removes the hardcoded secret, the key remains visible in git history (`git log -p`) and git reflogs. Hardcoded secrets are easily extracted using automated scanner bots on GitHub (like TruffleHog or GitGuardian) within seconds of pushing.

**Runnable Code Example:**

```javascript
console.log('Always inject secrets via environment variables or secret vaults (Vault, KMS)');
```

---



## 10. Output Prediction Puzzles (1–15)

### Puzzle 1: timingSafeEqual Length RangeError

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const a = Buffer.from("token_a");
const b = Buffer.from("token_ab");

try {
  const result = crypto.timingSafeEqual(a, b);
  console.log('Result:', result);
} catch (err) {
  console.log(err.name);
}
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
RangeError
```

**Step-by-Step Execution Trace:**
1. Buffer 'a' has byteLength 7 ("token_a").
2. Buffer 'b' has byteLength 8 ("token_ab").
3. crypto.timingSafeEqual requires both input buffers to have identical byteLength.
4. Because lengths differ, it immediately throws RangeError: Input buffers must have the same byte length.
5. Catch block logs err.name -> 'RangeError'.

</details>

---

### Puzzle 2: Digest Already Called Exception

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const hash = crypto.createHash('sha256');
hash.update("Hello");
console.log(hash.digest('hex').slice(0, 4));

try {
  hash.update("World");
} catch (e) {
  console.log(e.name);
}
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
185f
Error
```

**Step-by-Step Execution Trace:**
1. hash.update("Hello") updates the internal state.
2. hash.digest('hex') finalizes the hash and frees the C++ OpenSSL context. First 4 chars of SHA-256("Hello") is '185f'.
3. Attempting to call hash.update() or hash.digest() again throws an Error ('Digest already called').
4. Catch block logs e.name -> 'Error'.

</details>

---

### Puzzle 3: AES-GCM Authentication Tag Tamper Detection

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ciphertext = Buffer.concat([cipher.update("SuperSecret", 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();

// Tamper with ciphertext by flipping 1 bit
ciphertext[0] ^= 0x01;

const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(tag);

try {
  decipher.update(ciphertext);
  decipher.final();
} catch (err) {
  console.log('AuthStatus: Failed');
}
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
AuthStatus: Failed
```

**Step-by-Step Execution Trace:**
1. Plaintext is encrypted with AES-256-GCM, producing ciphertext and a 16-byte GHASH authentication tag.
2. Flipping 1 bit of ciphertext alters the data.
3. decipher.setAuthTag(tag) registers the expected authentication tag.
4. decipher.final() performs GHASH authentication over the ciphertext.
5. The computed tag does not match the expected tag, causing OpenSSL to throw an error and aborting plaintext output.
6. Catch block logs 'AuthStatus: Failed'.

</details>

---

### Puzzle 4: HMAC Deterministic Output Verification

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const key = "master_key";
const hmac1 = crypto.createHmac('sha256', key).update("Payload").digest('hex');
const hmac2 = crypto.createHmac('sha256', key).update("Payload").digest('hex');

console.log(hmac1 === hmac2, hmac1.length);
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
true 64
```

**Step-by-Step Execution Trace:**
1. HMAC is a deterministic mathematical function: identical keys and identical inputs always produce identical outputs.
2. hmac1 === hmac2 evaluates to true.
3. SHA-256 produces 256 bits = 32 bytes.
4. Formatted as hexadecimal (2 hex chars per byte), string length is 32 * 2 = 64 characters.
5. Output logged: true 64.

</details>

---

### Puzzle 5: Scrypt Password Verification Match

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const salt = Buffer.from("fixed_test_salt_123");
const hash1 = crypto.scryptSync("MyPassword", salt, 32);
const hash2 = crypto.scryptSync("MyPassword", salt, 32);
const hashWrong = crypto.scryptSync("WrongPassword", salt, 32);

console.log(crypto.timingSafeEqual(hash1, hash2));
console.log(crypto.timingSafeEqual(hash1, hashWrong));
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
true
false
```

**Step-by-Step Execution Trace:**
1. crypto.scryptSync("MyPassword", salt, 32) deterministically derives 32 bytes using Scrypt algorithm.
2. hash1 and hash2 derived with identical inputs have matching bytes. crypto.timingSafeEqual(hash1, hash2) returns true.
3. hashWrong derived from a different password produces completely different bits due to the avalanche effect.
4. crypto.timingSafeEqual(hash1, hashWrong) returns false.

</details>

---

### Puzzle 6: RSA-OAEP Randomized Ciphertexts

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const msg = Buffer.from("ConstantText");

const c1 = crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, msg);
const c2 = crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, msg);

console.log(c1.equals(c2));
const d1 = crypto.privateDecrypt({ key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, c1);
console.log(d1.toString('utf8'));
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
false
ConstantText
```

**Step-by-Step Execution Trace:**
1. RSA-OAEP uses randomized padding (Optimal Asymmetric Encryption Padding) incorporating a random seed for every encryption.
2. Encrypting the exact same plaintext twice produces two completely different ciphertexts (c1.equals(c2) is false). This prevents ciphertext equality detection attacks.
3. Both ciphertexts decrypt back to the exact same plaintext ("ConstantText").

</details>

---

### Puzzle 7: Ed25519 Signature Byte Length

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const data = Buffer.from("Sign this exact string");

const sig = crypto.sign(null, data, privateKey);
console.log(sig.length);
console.log(crypto.verify(null, data, publicKey, sig));
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
64
true
```

**Step-by-Step Execution Trace:**
1. Ed25519 signatures are strictly fixed at 64 bytes (512 bits) in length.
2. sig.length prints 64.
3. crypto.verify validates the signature with the public key, logging true.

</details>

---

### Puzzle 8: KeyObject Property Inspection

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const key = crypto.createSecretKey(Buffer.alloc(32));
console.log(key.type);
console.log(key.symmetricKeySize);
console.log(key.asymmetricKeyType);
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
secret
32
undefined
```

**Step-by-Step Execution Trace:**
1. crypto.createSecretKey creates a symmetric KeyObject.
2. key.type is 'secret'.
3. key.symmetricKeySize is 32 (bytes).
4. key.asymmetricKeyType is undefined because it is a symmetric key, not an asymmetric key.

</details>

---

### Puzzle 9: Web Crypto Subtle Digest Output Type

**Predict the exact console output:**

```javascript
const enc = new TextEncoder();
const data = enc.encode("Hello");
const hashBuf = await globalThis.crypto.subtle.digest('SHA-256', data);

console.log(hashBuf instanceof ArrayBuffer);
console.log(hashBuf.byteLength);
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
true
32
```

**Step-by-Step Execution Trace:**
1. globalThis.crypto.subtle.digest() returns a Promise resolving to an ArrayBuffer.
2. hashBuf instanceof ArrayBuffer is true.
3. SHA-256 produces 256 bits = 32 bytes.
4. hashBuf.byteLength is 32.

</details>

---

### Puzzle 10: Git Blob Header Computation for 'test\n'

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const content = "test\n";
const header = `blob ${content.length}\0`;
const hash = crypto.createHash('sha1').update(header + content).digest('hex');

console.log(hash.slice(0, 7));
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
9daeafb
```

**Step-by-Step Execution Trace:**
1. Git calculates blob hashes as SHA-1("blob <size>\0<content>").
2. "test\n" has length 5. Header is "blob 5\0".
3. SHA-1("blob 5\0test\n") is 9daeafb9864cf43055ae93beb0abb6c7d144b349.
4. The first 7 characters (canonical Git short commit/blob hash) are "9daeafb".

</details>

---

### Puzzle 11: HKDF Key Independence

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const ikm = Buffer.from("master_shared_input_key_32bytes!!");
const salt = Buffer.alloc(16);

const k1 = crypto.hkdfSync('sha256', ikm, salt, 'context_A', 32);
const k2 = crypto.hkdfSync('sha256', ikm, salt, 'context_B', 32);

console.log(k1.length, k2.length, k1.equals(k2));
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
32 32 false
```

**Step-by-Step Execution Trace:**
1. HKDF expands key material using an application context info string.
2. Both k1 and k2 have length 32 bytes.
3. Because 'context_A' !== 'context_B', HKDF produces two mathematically independent pseudorandom keys.
4. k1.equals(k2) is false.

</details>

---

### Puzzle 12: Hash Update Chaining Return Value

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const hash = crypto.createHash('sha256');
const ret = hash.update("A").update("B");

console.log(ret === hash);
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
true
```

**Step-by-Step Execution Trace:**
1. hash.update() returns the Hash instance itself to allow method chaining.
2. ret === hash evaluates to true.

</details>

---

### Puzzle 13: Secure OTP Modulo Bias Defense

**Predict the exact console output:**

```javascript
function isBiased(byte, range) {
  const maxValid = 256 - (256 % range);
  return byte >= maxValid;
}

console.log(isBiased(249, 10));
console.log(isBiased(250, 10));
console.log(isBiased(255, 10));
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
false
true
true
```

**Step-by-Step Execution Trace:**
1. For range = 10, 256 % 10 = 6. maxValid = 256 - 6 = 250.
2. 249 is < 250 -> isBiased is false (safe).
3. 250 is >= 250 -> isBiased is true (must reject to eliminate bias).
4. 255 is >= 250 -> isBiased is true (must reject).

</details>

---

### Puzzle 14: Random UUID Structure Verification

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const id = crypto.randomUUID();
const parts = id.split('-');

console.log(parts.length);
console.log(parts[2].startsWith('4')); // Version 4
console.log(['8', '9', 'a', 'b'].includes(parts[3][0].toLowerCase())); // Variant 10xx
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
5
true
true
```

**Step-by-Step Execution Trace:**
1. Standard UUID format is 8-4-4-4-12 (5 hyphen-separated segments).
2. Segment 2 starts with '4' indicating RFC4122 Version 4 (random).
3. Segment 3 begins with 8, 9, a, or b (variant bits 10xx).
4. All conditions evaluate to 5, true, true.

</details>

---

### Puzzle 15: One-Way Avalanching Bit Differences

**Predict the exact console output:**

```javascript
import crypto from 'node:crypto';

const h1 = crypto.createHash('sha256').update("DataA").digest();
const h2 = crypto.createHash('sha256').update("DataB").digest();

let differingBytes = 0;
for (let i = 0; i < 32; i++) {
  if (h1[i] !== h2[i]) differingBytes++;
}

console.log(differingBytes > 25);
```

<details>
<summary>Click to Reveal Output & Trace</summary>

**Expected Console Output:**
```text
true
```

**Step-by-Step Execution Trace:**
1. Inputs "DataA" and "DataB" differ by only a single character.
2. Due to the cryptographic avalanche effect in SHA-256, changing 1 bit scrambles the entire 32-byte digest randomly.
3. Out of 32 bytes, almost all bytes (~31-32) differ.
4. differingBytes > 25 evaluates to true.

</details>

---



## 11. Complete Production Projects

This section provides 4 comprehensive, production-grade projects demonstrating real-world cryptographic architectures and defensive engineering in JavaScript and Node.js. Each project contains complete source code, architectural documentation, and runnable test suites with assertion checks.

---

### Project 1: Enterprise Webhook Signer & Verifier with Timing-Safe Defense & Replay Protection

#### Architecture & Wire Protocol

A robust webhook signature verification architecture modeled after Stripe and GitHub. Defends against both remote timing side-channels and network replay attacks.

```text
Incoming HTTP Request Header:
Stripe-Signature: t=1711920000,v1=5257a869e7ece225950ee3eab4507772017...

1. Parse Header into: Timestamp (t) and HMAC Signature (v1)
2. Replay Attack Check: Verify |currentTime - t| <= 300 seconds
3. Signature Reconstruction: signaturePayload = "${t}.${rawBody}"
4. Constant-Time Verification: crypto.timingSafeEqual(computedHmac, v1)
```

#### Production Implementation & Test Assertions

```javascript
import assert from 'node:assert';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export class WebhookSecurity {
  /**
   * Signs a payload with a timestamp and secret key using HMAC-SHA256.
   */
  static sign(payload, secretKey, timestamp = Math.floor(Date.now() / 1000)) {
    const signaturePayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', secretKey)
      .update(signaturePayload)
      .digest('hex');
    return `t=${timestamp},v1=${hmac}`;
  }

  /**
   * Verifies an incoming webhook against signature mismatch, format errors, and timestamp drift.
   */
  static verify(payload, headerSignature, secretKey, maxDriftSeconds = 300) {
    if (!headerSignature) return { valid: false, reason: "Missing signature header" };

    const parts = {};
    for (const item of headerSignature.split(',')) {
      const [k, v] = item.split('=');
      if (k && v) parts[k.trim()] = v.trim();
    }

    if (!parts.t || !parts.v1) {
      return { valid: false, reason: "Malformed signature format" };
    }

    const timestamp = parseInt(parts.t, 10);
    if (isNaN(timestamp)) {
      return { valid: false, reason: "Invalid timestamp" };
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > maxDriftSeconds) {
      return { valid: false, reason: "Timestamp outside tolerance window (Replay Attack defense)" };
    }

    const signaturePayload = `${timestamp}.${payload}`;
    const expectedHmac = crypto.createHmac('sha256', secretKey)
      .update(signaturePayload)
      .digest('hex');

    const bufExpected = Buffer.from(expectedHmac, 'hex');
    const bufActual = Buffer.from(parts.v1, 'hex');

    if (bufExpected.length !== bufActual.length) {
      return { valid: false, reason: "Signature length mismatch" };
    }

    const matches = crypto.timingSafeEqual(bufExpected, bufActual);
    if (!matches) {
      return { valid: false, reason: "Signature mismatch" };
    }

    return { valid: true };
  }
}

// Verification Tests
const secret = "whsec_test_secret_key_999";
const payload = JSON.stringify({ event: "payment.succeeded", amount: 5000 });
const header = WebhookSecurity.sign(payload, secret);
const result = WebhookSecurity.verify(payload, header, secret);
assert.strictEqual(result.valid, true);

// Tampered payload fails
const tamperedResult = WebhookSecurity.verify(payload + "tampered", header, secret);
assert.strictEqual(tamperedResult.valid, false);

// Expired timestamp fails replay check
const oldHeader = WebhookSecurity.sign(payload, secret, Math.floor(Date.now() / 1000) - 400);
const expiredResult = WebhookSecurity.verify(payload, oldHeader, secret);
assert.strictEqual(expiredResult.valid, false);
console.log('Project 1 verified successfully!');
```

---

### Project 2: End-to-End Authenticated Encryption Engine (AES-256-GCM)

#### Architecture & Binary Packet Layout

Encapsulates authenticated symmetric encryption into a self-contained, packed binary format.

```text
+----------------------+--------------------------+------------------------------------+
| 12-Byte IV           | 16-Byte Auth Tag         | N-Byte Ciphertext                  |
| crypto.randomBytes   | cipher.getAuthTag()      | cipher.update() + cipher.final()   |
+----------------------+--------------------------+------------------------------------+
0                      12                         28                                   28 + N
```

#### Production Implementation & Test Assertions

```javascript
import assert from 'node:assert';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export class AuthenticatedCipher {
  static encrypt(plaintext, keyBuffer, aadString = "") {
    if (keyBuffer.length !== 32) throw new Error("Key must be 32 bytes (256 bits)");

    const iv = crypto.randomBytes(12); // 96-bit IV
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

    if (aadString) {
      cipher.setAAD(Buffer.from(aadString, 'utf8'));
    }

    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, ciphertext]);
  }

  static decrypt(packetBuffer, keyBuffer, aadString = "") {
    if (keyBuffer.length !== 32) throw new Error("Key must be 32 bytes (256 bits)");
    if (packetBuffer.length < 28) throw new Error("Packet too short (minimum 28 bytes)");

    const iv = packetBuffer.subarray(0, 12);
    const authTag = packetBuffer.subarray(12, 28);
    const ciphertext = packetBuffer.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);

    if (aadString) {
      decipher.setAAD(Buffer.from(aadString, 'utf8'));
    }

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  }
}

// Verification Tests
const masterKey = crypto.randomBytes(32);
const secretPlaintext = "Sensitive Credit Card Data: 4111-2222-3333-4444";
const aad = "user_id=1024";

const packet = AuthenticatedCipher.encrypt(secretPlaintext, masterKey, aad);
const decrypted = AuthenticatedCipher.decrypt(packet, masterKey, aad);
assert.strictEqual(decrypted, secretPlaintext);

// Tampered ciphertext throws
const tamperedPacket = Buffer.from(packet);
tamperedPacket[30] ^= 0x01;
assert.throws(() => {
  AuthenticatedCipher.decrypt(tamperedPacket, masterKey, aad);
});
console.log('Project 2 verified successfully!');
```

---

### Project 3: Production Password Vault with Scrypt & Automatic Cost Rehashing

#### Architecture

A modular password authentication vault supporting memory-hard Scrypt derivation and seamless cost upgrading when security standards advance.

```text
Stored Database Format:
$scrypt$N=16384$<saltHex>$<hashHex>

During Login:
1. Parse record: extract cost parameter N, salt, and stored hash
2. Derive candidate hash using matching cost N and salt
3. Constant-time compare candidate hash against stored hash
4. If valid AND cost < CURRENT_SYSTEM_COST (e.g. 16384):
   Flag needsRehash = true -> transparently upgrade user hash!
```

#### Production Implementation & Test Assertions

```javascript
import assert from 'node:assert';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export class PasswordVault {
  static CURRENT_COST = 16384; // N parameter

  static async hash(password, cost = PasswordVault.CURRENT_COST) {
    const salt = crypto.randomBytes(16);
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, { N: cost, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`$scrypt$N=${cost}$${salt.toString('hex')}$${derivedKey.toString('hex')}`);
      });
    });
  }

  static async verifyAndCheckRehash(password, storedRecord) {
    const parts = storedRecord.split('$');
    if (parts.length !== 5 || parts[1] !== 'scrypt') {
      throw new Error("Invalid password record format");
    }

    const costMatch = parts[2].match(/^N=(\d+)$/);
    if (!costMatch) throw new Error("Invalid cost parameter");
    const cost = parseInt(costMatch[1], 10);

    const salt = Buffer.from(parts[3], 'hex');
    const expectedHash = Buffer.from(parts[4], 'hex');

    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, expectedHash.length, { N: cost, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return reject(err);
        const isValid = crypto.timingSafeEqual(derivedKey, expectedHash);
        const needsRehash = cost < PasswordVault.CURRENT_COST;
        resolve({ isValid, needsRehash });
      });
    });
  }
}

// Verification Tests
(async () => {
  const hash = await PasswordVault.hash("SecurePassWord2026!", 16384);
  const verifyRes = await PasswordVault.verifyAndCheckRehash("SecurePassWord2026!", hash);
  assert.strictEqual(verifyRes.isValid, true);
  assert.strictEqual(verifyRes.needsRehash, false);

  const wrongRes = await PasswordVault.verifyAndCheckRehash("WrongPassword", hash);
  assert.strictEqual(wrongRes.isValid, false);

  // Test rehash detection for older cost
  const oldHash = await PasswordVault.hash("SecurePassWord2026!", 8192);
  const oldVerify = await PasswordVault.verifyAndCheckRehash("SecurePassWord2026!", oldHash);
  assert.strictEqual(oldVerify.isValid, true);
  assert.strictEqual(oldVerify.needsRehash, true);
  console.log('Project 3 verified successfully!');
})();
```

---

### Project 4: Asymmetric Token Signing & Verification Engine with Ed25519

#### Architecture

High-speed asymmetric token signer utilizing modern Ed25519 digital signatures (Edwards-curve Digital Signature Algorithm). Provides URL-safe Base64URL claims with tamperproof cryptographic signatures.

```text
Token Generation:
JSON Claims + iat -> UTF-8 Buffer -> Ed25519 Private Key Sign -> Signature Buffer
Output: { payloadBase64, signatureBase64 }

Token Verification:
Decoded Claims Buffer + Signature Buffer + Ed25519 Public Key -> crypto.verify()
```

#### Production Implementation & Test Assertions

```javascript
import assert from 'node:assert';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export class AsymmetricTokenEngine {
  static generateKeys() {
    return crypto.generateKeyPairSync('ed25519');
  }

  static signToken(claims, privateKey) {
    const payload = JSON.stringify({
      ...claims,
      iat: Math.floor(Date.now() / 1000)
    });
    const payloadBuf = Buffer.from(payload, 'utf8');
    const signature = crypto.sign(null, payloadBuf, privateKey);

    return {
      payloadBase64: payloadBuf.toString('base64url'),
      signatureBase64: signature.toString('base64url')
    };
  }

  static verifyToken(payloadBase64, signatureBase64, publicKey) {
    const payloadBuf = Buffer.from(payloadBase64, 'base64url');
    const signatureBuf = Buffer.from(signatureBase64, 'base64url');

    const isValid = crypto.verify(null, payloadBuf, publicKey, signatureBuf);
    if (!isValid) return { valid: false };

    const claims = JSON.parse(payloadBuf.toString('utf8'));
    return { valid: true, claims };
  }
}

// Verification Tests
const { publicKey, privateKey } = AsymmetricTokenEngine.generateKeys();
const token = AsymmetricTokenEngine.signToken({ user: "alice", role: "admin" }, privateKey);
const tokenRes = AsymmetricTokenEngine.verifyToken(token.payloadBase64, token.signatureBase64, publicKey);

assert.strictEqual(tokenRes.valid, true);
assert.strictEqual(tokenRes.claims.user, "alice");
assert.strictEqual(tokenRes.claims.role, "admin");

// Tampered signature fails
const tamperedSig = token.signatureBase64.slice(0, -2) + "==";
const badTokenRes = AsymmetricTokenEngine.verifyToken(token.payloadBase64, tamperedSig, publicKey);
assert.strictEqual(badTokenRes.valid, false);
console.log('Project 4 verified successfully!');
```

---


## 12. Production Best Practices: DOs and DON'Ts

| # | Practice | Verdict | Rationale & Architectural Rule |
|---|---|---|---|
| 1 | `crypto.randomBytes()` / `crypto.randomUUID()` | **DO** | Generates true cryptographic entropy from OS kernel CSPRNG (/dev/urandom). |
| 2 | `Math.random()` for tokens / keys | **DON'T** | PRNG is non-cryptographic (xoshiro128+); easily reversed to predict future tokens. |
| 3 | `crypto.timingSafeEqual()` | **DO** | Constant-time execution prevents remote side-channel timing attacks on signatures. |
| 4 | `=== ===` string comparison for signatures | **DON'T** | Short-circuits on the first differing byte, allowing remote byte-by-byte brute forcing. |
| 5 | AES-256-GCM authenticated encryption | **DO** | Modern AEAD cipher guaranteeing confidentiality AND tamper-detection via auth tag. |
| 6 | AES-ECB mode | **DON'T** | Encrypts identical plaintext blocks into identical ciphertext blocks (ECB penguin leak). |
| 7 | Fresh random 12-byte IV per GCM encryption | **DO** | Ensures counter uniqueness. |
| 8 | Nonce/IV reuse in AES-GCM | **DON'T** | Catastrophic: cancels keystream and allows attackers to forge arbitrary messages. |
| 9 | Scrypt or Argon2id for passwords | **DO** | Memory-hard algorithms that defend against GPU and ASIC cracking farms. |
| 10 | SHA-256 or MD5 for passwords | **DON'T** | Fatal: GPUs calculate over 100 billion SHA-256 hashes per second. |
| 11 | Unique random 16-byte salt per user | **DO** | Renders precomputed Rainbow Tables useless against password databases. |
| 12 | Streaming hashes for large files | **DO** | Processes data chunk-by-chunk with constant memory footprint, preventing OOM. |
| 13 | Loading multi-gigabyte file into buffer for hashing | **DON'T** | Crashes the Node process with `ERR_BUFFER_TOO_LARGE` or OOM. |
| 14 | `buf.fill(0)` after secret handling | **DO** | Sanitizes memory addresses immediately, preventing keys from lingering in RAM dumps. |
| 15 | Ed25519 for digital signatures | **DO** | Deterministic, side-channel immune, compact 64-byte signatures, fast verification. |
| 16 | Hardcoding secret keys in code/git | **DON'T** | Permanent history in Git; easily scraped by automated scanner bots within seconds. |
| 17 | Timestamp drift verification in webhooks | **DO** | Rejects messages outside $\pm 300$ seconds, neutralizing replay attacks. |
| 18 | Check `bufExpected.length === bufActual.length` | **DO** | Prevents unhandled `RangeError` before calling `crypto.timingSafeEqual()`. |
| 19 | Dummy password hashing on user-not-found | **DO** | Equalizes login response times, preventing user email enumeration via timing. |
| 20 | Dual-key rotation support | **DO** | Allows seamless cryptographic secret rotation without application downtime. |

---

## 13. Real-World Production Case Study: Diagnosing & Mitigating a Critical Timing Attack and Nonce Reuse in a Payment Gateway

### The Production Incident

A financial checkout service processing \$12,000,000 in monthly transactions utilized a custom Node.js microservice to handle webhook callbacks from upstream card processing banks.

Security researchers submitted a critical zero-day bounty demonstrating that by measuring HTTP response latency over 50,000 automated webhook POST requests, they were able to extract valid HMAC authentication signatures without possessing the shared secret key.

Furthermore, internal code auditing uncovered that encrypted credit card tokens stored in the PostgreSQL database were vulnerable to total plaintext recovery due to an initialization vector bug.

### Vulnerability Analysis

#### 1. Remote Sub-Microsecond Timing Attack
The incoming webhook verification was implemented with standard JavaScript string comparison:

```javascript
// VULNERABLE PRODUCTION CODE:
app.post('/webhooks/bank', (req, res) => {
  const signature = req.headers['x-bank-signature'];
  const expectedSignature = crypto.createHmac('sha256', SECRET_KEY)
    .update(req.rawBody)
    .digest('hex');

  // VULNERABILITY: Short-circuiting string comparison!
  if (signature !== expectedSignature) {
    return res.status(401).send("Unauthorized");
  }
  // Process payment...
});
```

Because V8's string equality comparison aborts on the first mismatched byte, guessing `00...` when the actual first byte is `a8` returns in $0.00004\text{ ms}$. Guessing `a8...` takes $0.00012\text{ ms}$ because it progresses to byte 1. The researchers automated statistical median filtering over network jitter to reconstruct all 64 hexadecimal characters!

#### 2. Catastrophic Static IV Reuse in AES-256-GCM
In the card vaulting module, developers initialized the cipher with a static IV:

```javascript
// VULNERABLE PRODUCTION CODE:
const STATIC_IV = Buffer.alloc(12, 0); // All zeroes!

function encryptCard(cardData, masterKey) {
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, STATIC_IV);
  return Buffer.concat([cipher.update(cardData), cipher.final()]);
}
```

Because every credit card was encrypted with the EXACT SAME $(Key, IV)$ pair, XORing two encrypted records canceled the AES keystream ($C_A \oplus C_B = P_A \oplus P_B$), allowing card data to be decrypted using basic frequency analysis!

### The Production Remediation

The engineering team deployed an emergency patch:

1. **Replaced string comparison with Constant-Time Verification:**
```javascript
function verifySecurely(signatureHeader, rawBody, secret) {
  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const bufExpected = Buffer.from(expectedHex, 'utf8');
  const bufActual = Buffer.from(signatureHeader || '', 'utf8');

  if (bufExpected.length !== bufActual.length) return false;
  return crypto.timingSafeEqual(bufExpected, bufActual);
}
```

2. **Enforced Unique CSPRNG IVs with Contiguous Packaging:**
```javascript
function encryptCardSecurely(cardData, masterKey) {
  const iv = crypto.randomBytes(12); // Unique 96-bit IV per card
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const ciphertext = Buffer.concat([cipher.update(cardData, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]); // Pack IV + Tag + Data
}
```

3. **Database Rekeying:** All historical card records were re-encrypted with fresh unique IVs and stored with authentication tags.

### Verification & Metrics

- Response latency variance dropped from $\pm 85\mu\text{s}$ to statistically undetectable noise.
- Automated penetration tests confirmed zero signature predictability across 10,000,000 probes.
- Continuous CI security linting added to ban `=== ` on cryptographic signatures and forbid static Buffer allocations for IVs.

---

## 14. 75 Practice Drills Across 5 Tiers

### Tier 1: Foundations (Drills 1–15)
1. Generate 32 bytes of cryptographically secure random bytes using `crypto.randomBytes(32)`.
2. Generate an RFC4122 version 4 UUID using `crypto.randomUUID()`.
3. Compute the SHA-256 hash of a string `"Hello World"` and print the 64-character hexadecimal digest.
4. Compute the SHA-512 hash of the same string and verify its digest length is 128 characters.
5. Create an HMAC-SHA256 signature of a payload with a secret key.
6. Verify that hashing the same string twice produces identical output.
7. Observe the avalanche effect: change 1 character in an input string and observe that over 50% of hash bytes change.
8. Use `crypto.timingSafeEqual()` to compare two identical Buffers.
9. Verify that calling `timingSafeEqual()` on buffers of different lengths throws a `RangeError`.
10. Check if an algorithm is supported in the current Node.js runtime using `crypto.getHashes()`.
11. Inspect the list of supported ciphers in Node.js using `crypto.getCiphers()`.
12. Use `crypto.createSecretKey()` to wrap a 256-bit symmetric key into a `KeyObject`.
13. Generate a 6-digit numeric OTP using CSPRNG bytes while eliminating modulo bias.
14. Use Web Crypto API `crypto.subtle.digest()` in modern JavaScript to compute a SHA-256 hash.
15. Format a 32-byte cryptographic hash as a Base64 string.

### Tier 2: Intermediate Cryptography (Drills 16–30)
16. Implement streaming SHA-256 hash calculation over three chunk arrivals.
17. Pipe a readable stream into `crypto.createHash('sha256')` and wait for the final digest.
18. Generate a unique 12-byte initialization vector (IV) for AES-GCM.
19. Encrypt a UTF-8 string with AES-256-GCM and extract the 16-byte authentication tag.
20. Decrypt an AES-256-GCM ciphertext using the key, IV, and authentication tag.
21. Tamper with 1 byte of AES-GCM ciphertext and verify that decryption throws an authentication error.
22. Tamper with the authentication tag and verify that decryption fails immediately.
23. Encrypt data with AES-256-GCM using Additional Authenticated Data (AAD).
24. Verify that altering the AAD string causes AES-GCM decryption to throw an error.
25. Derive a 32-byte encryption key from a password and salt using `crypto.scryptSync()`.
26. Hash a password using `crypto.scrypt()` asynchronously with a 16-byte salt.
27. Verify a user password by deriving a candidate hash with Scrypt and comparing via `timingSafeEqual`.
28. Derive a key using PBKDF2 with 600,000 iterations and HMAC-SHA256.
29. Use HKDF to extract and expand a 32-byte key from raw entropy and an application context string.
30. Parse a standard GitHub `sha256=<hex>` webhook signature header.

### Tier 3: Advanced Protocols & Integrity (Drills 31–45)
31. Build a Stripe-style webhook signature generator: `t=<timestamp>,v1=<hmac>`.
32. Build a webhook verifier that validates signatures in constant time and rejects timestamps older than 5 minutes.
33. Calculate a Subresource Integrity (SRI) string (`sha384-<base64>`) for a CDN script.
34. Compute the Git blob hash for a given file content string using `blob <size>\0<content>`.
35. Build a binary Merkle Tree from an array of 8 transaction strings and compute the Merkle Root.
36. Generate an RSA 2048-bit key pair asynchronously using `crypto.generateKeyPair()`.
37. Encrypt a confidential string using the RSA public key with RSA-OAEP padding.
38. Decrypt the RSA-OAEP ciphertext using the corresponding RSA private key.
39. Generate an Ed25519 key pair for digital signatures.
40. Sign a binary buffer using the Ed25519 private key.
41. Verify an Ed25519 digital signature using the Ed25519 public key.
42. Perform an Elliptic Curve Diffie-Hellman (ECDH) key exchange using the `prime256v1` curve.
43. Verify that both Alice and Bob arrive at the exact same shared secret byte sequence.
44. Derive two independent cryptographic keys (encryption + auth) from an ECDH secret using HKDF.
45. Implement sealed session cookies by encrypting JSON state with AES-256-GCM into a Base64 string.

### Tier 4: Senior Production & Hardening (Drills 46–60)
46. Implement zero-downtime key rotation: verify signatures against a primary key and secondary fallback keys.
47. Implement API key generation: prefix, public ID, and secure SHA-256 hashed storage.
48. Build a dummy password hash execution path to eliminate timing differences during invalid user logins.
49. Securely wipe a private key Buffer by overwriting all bytes with zeroes via `buf.fill(0)`.
50. Construct a streaming file encryption pipeline: read chunk, encrypt with AES-GCM, and write to disk.
51. Implement a chunked AEAD file format with 64KB blocks and independent authentication tags.
52. Build a password vault class that stores Scrypt parameters ($N, r, p$) and flags when rehashing is needed.
53. Import a raw HMAC key into Web Crypto API with `extractable: false` to defend against XSS.
54. Export an asymmetric public key to SPKI PEM format using `keyObject.export()`.
55. Export an asymmetric private key to PKCS#8 PEM format.
56. Verify that an expired signed token fails validation.
57. Build a URL-safe Base64URL encoder and decoder for cryptographic tokens.
58. Generate a CSPRNG floating-point number in $[0, 1)$ without modulo bias.
59. Detect and reject insecure JWT headers specifying `{"alg": "none"}`.
60. Build an in-memory key cache using `WeakMap` keyed by tenant context objects.

### Tier 5: Expert Cryptographic Architect (Drills 61–75)
61. Build an end-to-end encrypted messaging proof-of-concept using X25519 key exchange and AES-256-GCM.
62. Implement a complete password reset workflow: plaintext token in email link, SHA-256 hash in DB with 15-min TTL.
63. Simulate a timing attack experiment: benchmark early-return string comparison vs `timingSafeEqual`.
64. Implement a Merkle proof verification algorithm: verify that a leaf belongs to a Merkle Root with $O(\log N)$ hashes.
65. Parse and inspect X.509 certificate subject, validity dates, and public key fingerprint in Node.js.
66. Build an isomorphic cryptographic utility that uses `node:crypto` on the server and `crypto.subtle` in the browser.
67. Configure a Mutual TLS (mTLS) client request with client certificate and private key.
68. Implement a blind signature mathematical simulation.
69. Benchmark Scrypt hashing latency across $N = 16384, 32768, 65536$ to calibrate server CPU budget.
70. Build a rate-limiting defense against password brute forcing with exponential backoff and IP jail.
71. Build an encrypted local key-value store where keys are HMAC-hashed and values are AES-GCM encrypted.
72. Implement ChaCha20-Poly1305 encryption and compare throughput against AES-256-GCM.
73. Generate and verify a cryptographic receipt containing timestamp, user ID, transaction ID, and Ed25519 signature.
74. Verify that cloning an active hash instance with `.copy()` produces identical subsequent digests on split branches.
75. Design a complete zero-trust multi-region cryptographic architecture specification with key envelope encryption.

---

## 15. Final Summary & Senior Cryptographic Readiness Checklist

Cryptographic engineering is the foundational bedrock of software security. In production environments, cryptographic failures rarely stem from mathematical flaws in algorithms like AES or SHA-256; rather, they arise from **implementation errors**—using predictable PRNGs, reusing nonces, leaking timing side-channels, skipping authentication tags, or hashing passwords with fast algorithms.

### Production Security Checklist

- [ ] **Entropy Discipline:** Never use `Math.random()` for tokens, passwords, keys, or nonces. Exclusively use `crypto.randomBytes()` or `crypto.randomUUID()`.
- [ ] **Timing-Safe Verifications:** Always compare signatures, hashes, and authentication tokens using `crypto.timingSafeEqual()`. Never use `===` or `!==`.
- [ ] **Length Guard for TimingSafeEqual:** Always verify `bufExpected.length === bufActual.length` before invoking `timingSafeEqual()` to prevent unhandled `RangeError` crashes.
- [ ] **Modern Symmetric Encryption:** Default to **AES-256-GCM** or **ChaCha20-Poly1305**. Never use ECB mode. Never use CBC without an HMAC.
- [ ] **Strict Nonce/IV Uniqueness:** Generate a fresh 12-byte CSPRNG IV for every single AES-GCM encryption. Never reuse an IV with the same key.
- [ ] **Authentication Tag Validation:** Always register and validate the 16-byte authentication tag (`decipher.setAuthTag()`). Never execute plaintext before tag validation succeeds.
- [ ] **Password Storage Rigor:** Never use SHA-256, SHA-512, or MD5 for passwords. Always use **Argon2id** or **Scrypt** with unique 16-byte salts and memory-hard cost parameters.
- [ ] **Replay Protection:** Always incorporate timestamps into webhook signatures and reject requests outside a 5-minute tolerance window.
- [ ] **Memory Hygiene:** Overwrite sensitive key material in RAM using `buf.fill(0)` immediately after use.
- [ ] **No Secrets in Code/Git:** Inject all cryptographic keys via environment variables or secret management vaults (Vault, AWS KMS, GCP KMS).
