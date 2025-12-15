/**
 * Firestore REST API helper for server-side operations
 * Used in API routes where client SDK doesn't work
 * 
 * Note: For production, consider using Firebase Admin SDK for better security and features
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
}

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Convert JavaScript value to Firestore format
 */
function convertToFirestoreValue(value: any): any {
  if (value === null || value === undefined) {
    return { nullValue: null };
  } else if (typeof value === 'string') {
    return { stringValue: value };
  } else if (typeof value === 'number') {
    // Check if it's an integer or float
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    } else {
      return { doubleValue: value };
    }
  } else if (typeof value === 'boolean') {
    return { booleanValue: value };
  } else if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  } else if (typeof value === 'object') {
    // Handle nested objects (like billing.status)
    if (Array.isArray(value)) {
      return { arrayValue: { values: value.map(convertToFirestoreValue) } };
    } else {
      const mapValue: Record<string, any> = {};
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        mapValue[nestedKey] = convertToFirestoreValue(nestedValue);
      }
      return { mapValue: { fields: mapValue } };
    }
  }
  return { stringValue: String(value) };
}

/**
 * Update a document in Firestore using REST API
 * Note: This requires Firestore REST API access. 
 * For production, consider using Firebase Admin SDK for better security.
 */
export async function updateDocument(
  collection: string,
  documentId: string,
  data: Record<string, any>
): Promise<void> {
  if (!PROJECT_ID) {
    throw new Error('Firebase project ID not configured');
  }

  // Convert data to Firestore format
  const fields: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Handle nested field paths like 'billing.status'
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = fields;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = { mapValue: { fields: {} } };
        }
        current = current[parts[i]].mapValue.fields;
      }
      current[parts[parts.length - 1]] = convertToFirestoreValue(value);
    } else {
      fields[key] = convertToFirestoreValue(value);
    }
  }

  // Build update mask - handle nested fields like 'billing.status'
  const updateMask: string[] = [];
  for (const key of Object.keys(data)) {
    updateMask.push(key);
  }

  const url = `${FIRESTORE_URL}/${collection}/${documentId}?updateMask.fieldPaths=${updateMask.map(encodeURIComponent).join('&updateMask.fieldPaths=')}`;
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firestore REST API error:', errorText);
      throw new Error(`Firestore update failed: ${response.status} ${errorText}`);
    }
  } catch (error: any) {
    console.error('Error updating Firestore document:', error);
    throw error;
  }
}
