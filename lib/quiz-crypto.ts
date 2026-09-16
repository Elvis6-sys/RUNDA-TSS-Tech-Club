/**
 * Quiz Answer Encryption Utilities
 * 
 * Encrypts correct answers before sending to client and decrypts on server
 * to prevent students from inspecting answers via DevTools
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment, or generate a secure one
function getEncryptionKey(): Buffer {
  const key = process.env.QUIZ_ENCRYPTION_KEY;
  if (!key) {
    console.warn("⚠️  QUIZ_ENCRYPTION_KEY not set! Using fallback key (NOT SECURE FOR PRODUCTION)");
    // In production, this should throw an error
    return Buffer.from("fallback-insecure-key-please-set-env-var-in-production!!!");
  }
  // Ensure key is exactly 32 bytes
  return Buffer.from(key.padEnd(KEY_LENGTH, "0").slice(0, KEY_LENGTH));
}

/**
 * Encrypt quiz answer data
 * Returns base64-encoded encrypted data with IV and auth tag
 */
export function encryptAnswer(answer: any): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const plaintext = JSON.stringify(answer);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, "base64")
    ]);
    
    return combined.toString("base64");
  } catch (error) {
    console.error("❌ Encryption error:", error);
    throw new Error("Failed to encrypt answer");
  }
}

/**
 * Decrypt quiz answer data
 * Returns the original answer object or null if decryption fails
 */
export function decryptAnswer(encryptedData: string): any {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, "base64");
    
    // Extract IV, authTag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted.toString("base64"), "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("❌ Decryption error:", error);
    return null;
  }
}

/**
 * Create a secure hash of answer for validation without decryption
 */
export function hashAnswer(answer: any): string {
  const normalized = JSON.stringify(answer, Object.keys(answer).sort());
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Validate student's answer against encrypted correct answer
 * Returns true if answers match
 */
export function validateAnswer(
  studentAnswer: any,
  encryptedCorrectAnswer: string
): boolean {
  const correctAnswer = decryptAnswer(encryptedCorrectAnswer);
  if (!correctAnswer) return false;
  
  // Normalize for comparison
  const studentHash = hashAnswer(studentAnswer);
  const correctHash = hashAnswer(correctAnswer);
  
  return studentHash === correctHash;
}

/**
 * Sanitize quiz block for client - encrypt all correct answers
 */
export function sanitizeQuizBlock(block: any): any {
  if (block.type !== "quiz" || !block.questions) return block;
  
  return {
    ...block,
    questions: block.questions.map((q: any) => {
      const sanitized = { ...q };
      
      // Encrypt all correct answer fields
      if (q.correct !== undefined) {
        sanitized._encrypted_correct = encryptAnswer(q.correct);
        delete sanitized.correct;
      }
      
      if (q.correctPairs !== undefined) {
        sanitized._encrypted_correctPairs = encryptAnswer(q.correctPairs);
        delete sanitized.correctPairs;
      }
      
      if (q.correctOrder !== undefined) {
        sanitized._encrypted_correctOrder = encryptAnswer(q.correctOrder);
        delete sanitized.correctOrder;
      }
      
      if (q.blanks !== undefined) {
        sanitized._encrypted_blanks = encryptAnswer(q.blanks);
        delete sanitized.blanks;
      }
      
      // Remove explanation (only show after grading)
      if (q.explanation !== undefined) {
        sanitized._encrypted_explanation = encryptAnswer(q.explanation);
        delete sanitized.explanation;
      }
      
      return sanitized;
    })
  };
}

/**
 * Restore quiz block on server - decrypt all answers
 */
export function restoreQuizBlock(sanitizedBlock: any): any {
  if (sanitizedBlock.type !== "quiz" || !sanitizedBlock.questions) return sanitizedBlock;
  
  return {
    ...sanitizedBlock,
    questions: sanitizedBlock.questions.map((q: any) => {
      const restored = { ...q };
      
      if (q._encrypted_correct) {
        restored.correct = decryptAnswer(q._encrypted_correct);
        delete restored._encrypted_correct;
      }
      
      if (q._encrypted_correctPairs) {
        restored.correctPairs = decryptAnswer(q._encrypted_correctPairs);
        delete restored._encrypted_correctPairs;
      }
      
      if (q._encrypted_correctOrder) {
        restored.correctOrder = decryptAnswer(q._encrypted_correctOrder);
        delete restored._encrypted_correctOrder;
      }
      
      if (q._encrypted_blanks) {
        restored.blanks = decryptAnswer(q._encrypted_blanks);
        delete restored._encrypted_blanks;
      }
      
      if (q._encrypted_explanation) {
        restored.explanation = decryptAnswer(q._encrypted_explanation);
        delete restored._encrypted_explanation;
      }
      
      return restored;
    })
  };
}
