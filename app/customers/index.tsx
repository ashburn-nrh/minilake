import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Platform,
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
import { LoadingSpinner } from '../../components/LoadingSpinner';
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
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribe = subscribeToCustomers(userId, (data) => {
      setCustomers(data);
      setIsLoading(false);
      setRefreshing(false);
      
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

  const onRefresh = () => {
    setRefreshing(true);
    // The subscription will automatically update the data
  };

  const getNumColumns = () => {
    if (Platform.OS === 'web') {
      return 1; // 2 columns on web for better layout
    }
    return 1; // Single column on mobile
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200 web:px-6 web:py-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800 web:text-3xl">Customers</Text>
            <Text className="text-gray-500 text-sm web:text-base mt-1">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
              {searchQuery && ` matching "${searchQuery}"`}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              className="p-2 bg-gray-100 rounded-full web:hover:bg-gray-200 web:transition-colors"
            >
              <Ionicons name="settings-outline" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              className="p-2 bg-red-50 rounded-full web:hover:bg-red-100 web:transition-colors"
            >
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4 web:mb-6">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base web:text-lg"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              className="web:hover:bg-gray-200 web:rounded-full web:p-1 web:transition-colors"
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        {allTags.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-2 web:text-base">Filter by tags:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="web:flex-row web:flex-wrap"
            >
              {allTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  className={`mr-2 mb-2 px-4 py-2 rounded-full web:hover:shadow-sm web:transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 web:bg-blue-600'
                      : 'bg-gray-200 web:hover:bg-gray-300'
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm web:text-base ${
                      selectedTags.includes(tag) ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sort Options */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 mr-3 text-sm web:text-base font-medium">Sort by:</Text>
          <TouchableOpacity
            onPress={() => setSortBy('recent')}
            className={`mr-3 px-4 py-2 rounded-lg web:hover:shadow-sm web:transition-all ${
              sortBy === 'recent' ? 'bg-blue-500 web:bg-blue-600' : 'bg-gray-200 web:hover:bg-gray-300'
            }`}
          >
            <Text
              className={`font-semibold text-sm web:text-base ${
                sortBy === 'recent' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy('name')}
            className={`px-4 py-2 rounded-lg web:hover:shadow-sm web:transition-all ${
              sortBy === 'name' ? 'bg-blue-500 web:bg-blue-600' : 'bg-gray-200 web:hover:bg-gray-300'
            }`}
          >
            <Text
              className={`font-semibold text-sm web:text-base ${
                sortBy === 'name' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Name
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer List */}
      {isLoading ? (
        <View className="flex-1 justify-center">
          <LoadingSpinner message="Loading customers..." size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          numColumns={getNumColumns()}
          key={getNumColumns()} // Force re-render when columns change
          contentContainerClassName="p-4 web:px-6"
          columnWrapperStyle={getNumColumns() > 1 ? { gap: 16 } : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
          renderItem={({ item }) => (
            <View className={getNumColumns() > 1 ? 'flex-1' : 'w-full'}>
              <CustomerCard
                customer={item}
                onPress={() => router.push(`/customers/${item.id}`)}
                onEdit={() => router.push(`/customers/${item.id}`)}
                onDelete={() => handleDeleteCustomer(item.id, item.name)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 web:py-32">
              <View className="bg-gray-100 rounded-full p-6 mb-6">
                <Ionicons name="people-outline" size={64} color="#9ca3af" />
              </View>
              <Text className="text-gray-500 text-xl font-semibold mb-2 web:text-2xl">
                {searchQuery || selectedTags.length > 0 ? 'No customers found' : 'No customers yet'}
              </Text>
              <Text className="text-gray-400 text-base text-center max-w-sm web:text-lg">
                {searchQuery || selectedTags.length > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Start building your customer base by adding your first customer'
                }
              </Text>
              {(!searchQuery && selectedTags.length === 0) && (
                <TouchableOpacity
                  onPress={() => setShowAddModal(true)}
                  className="mt-6 bg-blue-500 px-6 py-3 rounded-xl web:hover:bg-blue-600 web:transition-colors"
                >
                  <Text className="text-white font-semibold text-base">Add Your First Customer</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

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
