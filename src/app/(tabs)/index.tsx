import { db } from '@/services/firebase';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const rooms = [
  {
    id: '1',
    name: 'Phòng học nhóm A',
    address: 'Cơ sở chính',
    beds: 6,
    price: 30000,
    image:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800',
  },
  {
    id: '2',
    name: 'Phòng học nhóm B',
    address: 'Cơ sở 2',
    beds: 8,
    price: 40000,
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
  },
  {
    id: '3',
    name: 'Phòng tự học C',
    address: 'Cơ sở chính',
    beds: 4,
    price: 25000,
    image:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const [searchText, setSearchText] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<number | null>(
    null
  );
  const [priceFilter, setPriceFilter] = useState<
    '30k' | '40k' | '40k+' | null
  >(null);

  console.log('Firebase Firestore:', db);

  const filteredRooms = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesSearch =
        keyword === '' ||
        room.name.toLowerCase().includes(keyword) ||
        room.address.toLowerCase().includes(keyword);

      const matchesCapacity =
        capacityFilter === null ||
        room.beds >= capacityFilter;

      let matchesPrice = true;

      if (priceFilter === '30k') {
        matchesPrice = room.price <= 30000;
      }

      if (priceFilter === '40k') {
        matchesPrice = room.price <= 40000;
      }

      if (priceFilter === '40k+') {
        matchesPrice = room.price > 40000;
      }

      return (
        matchesSearch &&
        matchesCapacity &&
        matchesPrice
      );
    });
  }, [searchText, capacityFilter, priceFilter]);

  const clearFilters = () => {
    setSearchText('');
    setCapacityFilter(null);
    setPriceFilter(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={styles.greeting}>Xin chào 👋</Text>

            <Text style={styles.title}>Tìm phòng học</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo tên phòng, địa chỉ..."
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
            />

            <View style={styles.filterRow}>
              <Pressable
                style={[
                  styles.filterButton,
                  capacityFilter !== null &&
                    styles.activeFilterButton,
                ]}
                onPress={() => {
                  if (capacityFilter === null) {
                    setCapacityFilter(6);
                  } else if (capacityFilter === 6) {
                    setCapacityFilter(8);
                  } else {
                    setCapacityFilter(null);
                  }
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    capacityFilter !== null &&
                      styles.activeFilterText,
                  ]}
                >
                  🛏{' '}
                  {capacityFilter === null
                    ? 'Sức chứa'
                    : `${capacityFilter}+ chỗ`}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterButton,
                  priceFilter !== null &&
                    styles.activeFilterButton,
                ]}
                onPress={() => {
                  if (priceFilter === null) {
                    setPriceFilter('30k');
                  } else if (priceFilter === '30k') {
                    setPriceFilter('40k');
                  } else if (priceFilter === '40k') {
                    setPriceFilter('40k+');
                  } else {
                    setPriceFilter(null);
                  }
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    priceFilter !== null &&
                      styles.activeFilterText,
                  ]}
                >
                  💰{' '}
                  {priceFilter === null
                    ? 'Giá'
                    : priceFilter === '30k'
                      ? '≤ 30.000đ'
                      : priceFilter === '40k'
                        ? '≤ 40.000đ'
                        : '> 40.000đ'}
                </Text>
              </Pressable>

              {(searchText ||
                capacityFilter !== null ||
                priceFilter !== null) && (
                <Pressable
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearText}>
                    Xóa
                  </Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.sectionTitle}>
              Phòng học có sẵn
            </Text>

            <Text style={styles.resultText}>
              {filteredRooms.length} phòng phù hợp
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>

            <Text style={styles.emptyTitle}>
              Không tìm thấy phòng
            </Text>

            <Text style={styles.emptyText}>
              Thử tìm kiếm hoặc thay đổi bộ lọc.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={clearFilters}
            >
              <Text style={styles.emptyButtonText}>
                Xóa bộ lọc
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.roomCard}
            onPress={() =>
              router.push(`/room/${item.id}` as any)
            }
          >
            <Image
              source={{ uri: item.image }}
              style={styles.roomImage}
            />

            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>
                {item.name}
              </Text>

              <Text style={styles.address}>
                📍 {item.address}
              </Text>

              <Text style={styles.beds}>
                🛏 {item.beds} chỗ
              </Text>

              <Text style={styles.price}>
                {item.price.toLocaleString('vi-VN')}đ / giờ
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
  },

  searchInput: {
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 14,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
  },

  filterButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  activeFilterButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  filterText: {
    fontSize: 14,
    color: '#333',
  },

  activeFilterText: {
    color: '#FFF',
    fontWeight: '600',
  },

  clearButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  clearText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: '#111',
  },

  resultText: {
    fontSize: 13,
    color: '#777',
    marginBottom: 14,
  },

  roomCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },

  roomImage: {
    width: '100%',
    height: 180,
  },

  roomInfo: {
    padding: 14,
  },

  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },

  beds: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },

  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 18,
  },

  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
