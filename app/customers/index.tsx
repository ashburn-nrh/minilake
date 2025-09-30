import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import {
  Customer,
  subscribeToCustomers,
  deleteCustomer,
} from '../../lib/firebase/customers';
import { auth } from '../../lib/firebase/config';
import { CustomerCard } from '../../components/CustomerCard';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { AddCustomerModal } from '../../components/AddCustomerModal';
import { showAlert, showMessage } from '../../lib/utils/alert';

type SortOption = 'recent' | 'name';

export default function CustomersScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showAddModal, setShowAddModal] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribe = subscribeToCustomers(userId, (data) => {
      setCustomers(data);
      
      // Extract all unique tags
      const tags = new Set<string>();
      data.forEach((customer) => {
        customer.tags?.forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery)
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((customer) =>
        selectedTags.some((tag) => customer.tags?.includes(tag))
      );
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort(
        (a, b) =>
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredCustomers(filtered);
  }, [customers, searchQuery, selectedTags, sortBy]);

  const handleLogout = async () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
            showMessage('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    showAlert(
      'Delete Customer',
      `Are you sure you want to delete ${customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting customer:', customerId);
              await deleteCustomer(customerId);
              console.log('Customer deleted successfully');
              showMessage('Success', 'Customer deleted successfully');
            } catch (error: any) {
              console.error('Delete error:', error);
              showMessage('Error', error.message || 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-800">Customers</Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="p-2 bg-red-50 rounded-full"
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-3">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        {allTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            {allTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                className={`mr-2 px-4 py-2 rounded-full ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    selectedTags.includes(tag) ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Sort Dropdown */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 mr-3">Sort by:</Text>
          <TouchableOpacity
            onPress={() => setSortBy('recent')}
            className={`mr-3 px-4 py-2 rounded-lg ${
              sortBy === 'recent' ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`font-semibold ${
                sortBy === 'recent' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy('name')}
            className={`px-4 py-2 rounded-lg ${
              sortBy === 'name' ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`font-semibold ${
                sortBy === 'name' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Name
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onPress={() => router.push(`/customers/${item.id}`)}
            onEdit={() => router.push(`/customers/${item.id}`)}
            onDelete={() => handleDeleteCustomer(item.id, item.name)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-400 text-lg mt-4">No customers found</Text>
            <Text className="text-gray-400 text-sm mt-2">
              Tap the + button to add your first customer
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <FloatingActionButton
        onPress={() => setShowAddModal(true)}
        label="Add Customer"
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {}}
      />
    </SafeAreaView>
  );
}
