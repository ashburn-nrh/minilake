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
import { db, storage } from './config';

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

export const createCustomer = async (
  userId: string,
  customerData: Omit<Customer, 'id' | 'createdAt' | 'lastActivity' | 'userId'>
) => {
  try {
    const customersRef = collection(db, 'customers');
    const docRef = await addDoc(customersRef, {
      ...customerData,
      userId,
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
    await updateDoc(customerRef, {
      ...customerData,
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
  const q = query(
    collection(db, 'customers'),
    where('userId', '==', userId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const customers: Customer[] = [];
      snapshot.forEach((doc) => {
        customers.push({ id: doc.id, ...doc.data() } as Customer);
      });
      
      // Sort by lastActivity in descending order (most recent first)
      customers.sort((a, b) => {
        const dateA = new Date(a.lastActivity).getTime();
        const dateB = new Date(b.lastActivity).getTime();
        return dateB - dateA;
      });
      
      callback(customers);
    },
    (error) => {
      console.error('Error subscribing to customers:', error);
      // Return empty array on error
      callback([]);
    }
  );

  return unsubscribe;
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
    await updateDoc(engagementRef, {
      ...engagementData,
      lastUpdated: new Date().toISOString(),
    });
    
    // Update customer's lastActivity
    await updateCustomer(customerId, {});
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
    const response = await fetch(uri);
    const blob = await response.blob();
    
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
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
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
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const storageRef = ref(storage, `customers/${customerId}/avatar.jpg`);
    await uploadBytes(storageRef, blob);
    
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};
