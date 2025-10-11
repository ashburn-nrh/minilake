import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from './config';

/**
 * Helper function to ensure user is authenticated and get current user
 */
const ensureAuthenticated = async () => {
  // Wait for auth state to be ready
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    if (auth.currentUser) {
      console.log('User authenticated:', auth.currentUser.uid);
      return auth.currentUser;
    }
    
    // Wait a bit for auth state to load
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }
  
  throw new Error('User must be authenticated to upload files. Please sign in and try again.');
};

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  avatar?: string;
  lastActivity: string;
  createdAt: string;
  userId: string;
  ownerIds?: string[]; // Array of user IDs who are owners of this customer
}

export interface Engagement {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'won' | 'lost';
  lastUpdated: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

/**
 * Find user by phone number
 */
export const findUserByPhoneNumber = async (phoneNumber: string): Promise<string | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].id; // Return the user ID
    }
    return null;
  } catch (error) {
    console.error('Error finding user by phone number:', error);
    return null;
  }
};

export const createCustomer = async (
  userId: string,
  customerData: Omit<Customer, 'id' | 'createdAt' | 'lastActivity' | 'userId'>
) => {
  try {
    const customersRef = collection(db, 'customers');
    
    // Find user by phone number to assign as additional owner
    let ownerIds = [userId]; // Always include the creator
    
    if (customerData.phone) {
      const phoneOwnerUserId = await findUserByPhoneNumber(customerData.phone);
      if (phoneOwnerUserId && phoneOwnerUserId !== userId) {
        ownerIds.push(phoneOwnerUserId);
      }
    }
    
    const docRef = await addDoc(customersRef, {
      ...customerData,
      userId,
      ownerIds, // Include both creator and phone number owner
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

export const updateCustomer = async (
  customerId: string,
  customerData: Partial<Customer>
) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    
    // If phone number is being updated, check if we need to add a new owner
    let updatedData = { ...customerData };
    
    if (customerData.phone) {
      const customer = await getCustomer(customerId);
      if (customer) {
        const phoneOwnerUserId = await findUserByPhoneNumber(customerData.phone);
        
        if (phoneOwnerUserId && !customer.ownerIds?.includes(phoneOwnerUserId)) {
          // Add the phone number owner to the ownerIds array
          const currentOwnerIds = customer.ownerIds || [customer.userId];
          updatedData.ownerIds = [...currentOwnerIds, phoneOwnerUserId];
        }
      }
    }
    
    await updateDoc(customerRef, {
      ...updatedData,
      lastActivity: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

export const deleteCustomer = async (customerId: string) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    await deleteDoc(customerRef);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

export const getCustomer = async (customerId: string): Promise<Customer | null> => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);
    
    if (customerDoc.exists()) {
      return { id: customerDoc.id, ...customerDoc.data() } as Customer;
    }
    return null;
  } catch (error) {
    console.error('Error getting customer:', error);
    throw error;
  }
};

export const subscribeToCustomers = (
  userId: string,
  callback: (customers: Customer[]) => void
): (() => void) => {
  // Since Firestore doesn't support OR queries directly, we need to get all customers
  // and filter on the client side, or use two separate queries
  // For better performance with large datasets, we'll use array-contains for ownerIds
  const q1 = query(
    collection(db, 'customers'),
    where('userId', '==', userId)
  );
  
  const q2 = query(
    collection(db, 'customers'),
    where('ownerIds', 'array-contains', userId)
  );

  let customers1: Customer[] = [];
  let customers2: Customer[] = [];
  let unsubscribe1: (() => void) | null = null;
  let unsubscribe2: (() => void) | null = null;

  const mergeAndCallback = () => {
    // Merge results and remove duplicates
    const allCustomers = [...customers1, ...customers2];
    const uniqueCustomers = allCustomers.filter((customer, index, self) => 
      index === self.findIndex(c => c.id === customer.id)
    );
    
    // Sort by lastActivity in descending order (most recent first)
    uniqueCustomers.sort((a, b) => {
      const dateA = new Date(a.lastActivity).getTime();
      const dateB = new Date(b.lastActivity).getTime();
      return dateB - dateA;
    });
    
    callback(uniqueCustomers);
  };

  unsubscribe1 = onSnapshot(
    q1,
    (snapshot) => {
      customers1 = [];
      snapshot.forEach((doc) => {
        customers1.push({ id: doc.id, ...doc.data() } as Customer);
      });
      mergeAndCallback();
    },
    (error) => {
      console.error('Error subscribing to customers (query 1):', error);
      customers1 = [];
      mergeAndCallback();
    }
  );

  unsubscribe2 = onSnapshot(
    q2,
    (snapshot) => {
      customers2 = [];
      snapshot.forEach((doc) => {
        customers2.push({ id: doc.id, ...doc.data() } as Customer);
      });
      mergeAndCallback();
    },
    (error) => {
      console.error('Error subscribing to customers (query 2):', error);
      customers2 = [];
      mergeAndCallback();
    }
  );

  // Return a function that unsubscribes from both queries
  return () => {
    if (unsubscribe1) unsubscribe1();
    if (unsubscribe2) unsubscribe2();
  };
};

export const addEngagement = async (
  customerId: string,
  engagementData: Omit<Engagement, 'id' | 'createdAt' | 'lastUpdated'>
) => {
  try {
    const engagementsRef = collection(db, 'customers', customerId, 'engagements');
    const docRef = await addDoc(engagementsRef, {
      ...engagementData,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });
    
    // Update customer's lastActivity
    await updateCustomer(customerId, {});
    
    // Send push notifications to all owners
    try {
      const customer = await getCustomer(customerId);
      if (customer && customer.ownerIds && customer.ownerIds.length > 0) {
        const { notifyEngagementCreated } = await import('../notifications/pushNotifications');
        await notifyEngagementCreated(
          customer.ownerIds,
          customer.name,
          engagementData.title
        );
      }
    } catch (notifError) {
      console.error('Error sending engagement notification:', notifError);
      // Don't throw - notification failure shouldn't prevent engagement creation
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding engagement:', error);
    throw error;
  }
};

export const updateEngagement = async (
  customerId: string,
  engagementId: string,
  engagementData: Partial<Engagement>
) => {
  try {
    const engagementRef = doc(db, 'customers', customerId, 'engagements', engagementId);
    
    // Get old engagement data for status change notification
    let oldStatus: string | undefined;
    if (engagementData.status) {
      const engagementDoc = await getDoc(engagementRef);
      if (engagementDoc.exists()) {
        oldStatus = engagementDoc.data().status;
      }
    }
    
    await updateDoc(engagementRef, {
      ...engagementData,
      lastUpdated: new Date().toISOString(),
    });
    
    // Update customer's lastActivity
    await updateCustomer(customerId, {});
    
    // Send push notifications if status changed
    if (engagementData.status && oldStatus && oldStatus !== engagementData.status) {
      try {
        const customer = await getCustomer(customerId);
        const engagementDoc = await getDoc(engagementRef);
        
        if (customer && engagementDoc.exists() && customer.ownerIds && customer.ownerIds.length > 0) {
          const { notifyEngagementStatusChanged } = await import('../notifications/pushNotifications');
          await notifyEngagementStatusChanged(
            customer.ownerIds,
            customer.name,
            engagementDoc.data().title,
            oldStatus,
            engagementData.status
          );
        }
      } catch (notifError) {
        console.error('Error sending status change notification:', notifError);
        // Don't throw - notification failure shouldn't prevent update
      }
    }
  } catch (error) {
    console.error('Error updating engagement:', error);
    throw error;
  }
};

export const getEngagements = async (customerId: string): Promise<Engagement[]> => {
  try {
    const engagementsRef = collection(db, 'customers', customerId, 'engagements');
    const snapshot = await getDocs(engagementsRef);
    
    const engagements: Engagement[] = [];
    snapshot.forEach((doc) => {
      engagements.push({ id: doc.id, ...doc.data() } as Engagement);
    });
    
    return engagements;
  } catch (error) {
    console.error('Error getting engagements:', error);
    throw error;
  }
};

// Attachments
export const uploadAttachment = async (
  customerId: string,
  uri: string,
  fileName: string,
  fileType: string
): Promise<string> => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();

    console.log('Starting attachment upload:', { customerId, fileName, fileType, uri: uri.substring(0, 50) + '...' });
    
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Validate file size (limit to 10MB for attachments)
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error('File size too large. Please choose a file smaller than 10MB.');
    }
    
    if (blob.size === 0) {
      throw new Error('Invalid file - file appears to be empty');
    }
    
    const storageRef = ref(storage, `customers/${customerId}/attachments/${fileName}`);
    await uploadBytes(storageRef, blob);
    
    const downloadURL = await getDownloadURL(storageRef);
    
    // Save attachment metadata to Firestore
    const attachmentsRef = collection(db, 'customers', customerId, 'attachments');
    await addDoc(attachmentsRef, {
      name: fileName,
      url: downloadURL,
      type: fileType,
      uploadedAt: new Date().toISOString(),
    });
    
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please sign in again and try uploading.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled. Please try again.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Unknown storage error. Please check your internet connection.');
    } else if (error.code === 'auth/user-not-found' || error.message?.includes('auth')) {
      throw new Error('Authentication error. Please sign in again.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to upload attachment. Please try again.');
    }
  }
};

export const getAttachments = async (customerId: string): Promise<Attachment[]> => {
  try {
    const attachmentsRef = collection(db, 'customers', customerId, 'attachments');
    const snapshot = await getDocs(attachmentsRef);
    
    const attachments: Attachment[] = [];
    snapshot.forEach((doc) => {
      attachments.push({ id: doc.id, ...doc.data() } as Attachment);
    });
    
    return attachments;
  } catch (error) {
    console.error('Error getting attachments:', error);
    throw error;
  }
};

export const uploadAvatar = async (
  customerId: string,
  uri: string
): Promise<string> => {
  try {
    console.log('Starting avatar upload for customer:', customerId);
    console.log('Image URI:', uri);

    // Validate inputs
    if (!customerId || !uri) {
      throw new Error('Customer ID and image URI are required');
    }

    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();

    // Check if URI is valid - be more flexible with URI formats
    const validUriPrefixes = [
      'file://',
      'content://',
      'http://',
      'https://',
      'blob:', // Web blob URIs
      'assets-library://', // iOS
      'ph://', // iOS Photos
      'data:', // Base64 data URIs
      '/var/', // iOS file paths
      '/storage/', // Android file paths
      '/android_asset/', // Android assets
    ];
    
    const isValidUri = validUriPrefixes.some(prefix => uri.startsWith(prefix)) || 
                      uri.startsWith('/') || // Unix-style paths
                      /^[A-Za-z]:\\/.test(uri); // Windows-style paths
    
    if (!isValidUri) {
      console.error('Invalid URI format detected:', uri);
      throw new Error(`Invalid image URI format: ${uri.substring(0, 50)}...`);
    }

    // Fetch the image with better error handling
    console.log('Fetching image from URI...');
    let response: Response;
    let blob: Blob;
    
    try {
      response = await fetch(uri);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      blob = await response.blob();
      console.log('Image blob size:', blob.size, 'bytes');
      console.log('Image blob type:', blob.type);
      
    } catch (fetchError: any) {
      console.error('Fetch error details:', fetchError);
      
      // Handle specific fetch errors
      if (fetchError.message.includes('Network request failed')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (fetchError.message.includes('CORS')) {
        throw new Error('Cross-origin request blocked. Please try a different image.');
      } else if (fetchError.message.includes('HTTP 404')) {
        throw new Error('Image file not found. Please select a different image.');
      } else {
        throw new Error(`Failed to load image: ${fetchError.message}`);
      }
    }

    // Check blob size (limit to 5MB)
    if (blob.size > 5 * 1024 * 1024) {
      throw new Error('Image size too large. Please choose an image smaller than 5MB.');
    }

    // Check if blob is valid
    if (blob.size === 0) {
      throw new Error('Invalid image file - file appears to be empty');
    }

    // Create storage reference with timestamp to avoid caching issues
    const timestamp = Date.now();
    const fileName = `avatar_${timestamp}.jpg`;
    const storagePath = `customers/${customerId}/${fileName}`;
    console.log('Storage path:', storagePath);
    
    const storageRef = ref(storage, storagePath);
    
    console.log('Uploading to Firebase Storage...');
    const uploadResult = await uploadBytes(storageRef, blob);
    console.log('Upload successful, getting download URL...');
    
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('Avatar upload completed successfully:', downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please sign in again and try uploading.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled. Please try again.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Unknown storage error. Please check your internet connection.');
    } else if (error.code === 'auth/user-not-found' || error.message?.includes('auth')) {
      throw new Error('Authentication error. Please sign in again.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to upload avatar. Please try again.');
    }
  }
};

/**
 * Assign customer to phone number owner
 */
export const assignCustomerToPhoneOwner = async (
  customerId: string,
  phoneNumber: string,
  assignedByUserId: string
) => {
  try {
    const phoneOwnerUserId = await findUserByPhoneNumber(phoneNumber);
    
    if (!phoneOwnerUserId) {
      throw new Error('No user found with this phone number');
    }
    
    // Use the existing addCustomerOwner function
    await addCustomerOwner(customerId, phoneOwnerUserId, assignedByUserId);
    
    return phoneOwnerUserId;
  } catch (error) {
    console.error('Error assigning customer to phone owner:', error);
    throw error;
  }
};

/**
 * Add an owner to a customer
 */
export const addCustomerOwner = async (
  customerId: string,
  ownerId: string,
  addedByUserId: string
) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);
    
    if (!customerDoc.exists()) {
      throw new Error('Customer not found');
    }
    
    const currentOwners = customerDoc.data().ownerIds || [];
    
    if (currentOwners.includes(ownerId)) {
      throw new Error('User is already an owner');
    }
    
    await updateDoc(customerRef, {
      ownerIds: [...currentOwners, ownerId],
      lastActivity: new Date().toISOString(),
    });
    
    // Send push notifications
    try {
      const customer = customerDoc.data() as Customer;
      
      // Get user names for notifications
      const addedByUserRef = doc(db, 'users', addedByUserId);
      const newOwnerRef = doc(db, 'users', ownerId);
      
      const [addedByUserDoc, newOwnerDoc] = await Promise.all([
        getDoc(addedByUserRef),
        getDoc(newOwnerRef)
      ]);
      
      const addedByUserName = addedByUserDoc.exists() 
        ? (addedByUserDoc.data().displayName || addedByUserDoc.data().email || 'Someone')
        : 'Someone';
      
      const newOwnerName = newOwnerDoc.exists()
        ? (newOwnerDoc.data().displayName || newOwnerDoc.data().email || 'New owner')
        : 'New owner';
      
      const { notifyOwnerAdded, notifyOwnersAboutNewOwner } = await import('../notifications/pushNotifications');
      
      // Notify the new owner
      await notifyOwnerAdded(ownerId, customer.name, addedByUserName);
      
      // Notify existing owners (excluding the one who added)
      await notifyOwnersAboutNewOwner(
        [...currentOwners, ownerId],
        customer.name,
        newOwnerName,
        addedByUserId
      );
    } catch (notifError) {
      console.error('Error sending owner notification:', notifError);
      // Don't throw - notification failure shouldn't prevent owner addition
    }
  } catch (error) {
    console.error('Error adding customer owner:', error);
    throw error;
  }
};

/**
 * Remove an owner from a customer
 */
export const removeCustomerOwner = async (
  customerId: string,
  ownerId: string
) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);
    
    if (!customerDoc.exists()) {
      throw new Error('Customer not found');
    }
    
    const currentOwners = customerDoc.data().ownerIds || [];
    const updatedOwners = currentOwners.filter((id: string) => id !== ownerId);
    
    if (updatedOwners.length === 0) {
      throw new Error('Cannot remove the last owner');
    }
    
    await updateDoc(customerRef, {
      ownerIds: updatedOwners,
      lastActivity: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error removing customer owner:', error);
    throw error;
  }
};
