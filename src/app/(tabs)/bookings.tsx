import { db } from '@/services/firebase';
import { useFocusEffect } from 'expo-router';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Booking = {
  id: string;
  roomId?: string;
  roomName?: string;
  date?: string;
  time?: string;
  price?: number;
  status?: string;
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      setLoading(true);

      const bookingsRef = collection(db, 'bookings');

      const q = query(
        bookingsRef,
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      const data: Booking[] = snapshot.docs.map((bookingDoc) => ({
        id: bookingDoc.id,
        ...bookingDoc.data(),
      }));

      setBookings(data);
    } catch (error) {
      console.error('Lỗi lấy lịch sử đặt phòng:', error);

      Alert.alert(
        'Lỗi',
        'Không thể tải lịch sử đặt phòng.'
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Hủy phòng',
      'Bạn có chắc chắn muốn hủy phòng này không?',
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Hủy phòng',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingId(bookingId);

              const bookingRef = doc(
                db,
                'bookings',
                bookingId
              );

              await updateDoc(bookingRef, {
                status: 'cancelled',
              });

              setBookings((currentBookings) =>
                currentBookings.map((booking) =>
                  booking.id === bookingId
                    ? {
                        ...booking,
                        status: 'cancelled',
                      }
                    : booking
                )
              );

              Alert.alert(
                'Đã hủy phòng',
                'Phòng đã được hủy thành công.'
              );
            } catch (error) {
              console.error(
                'Lỗi hủy phòng:',
                error
              );

              Alert.alert(
                'Hủy phòng thất bại',
                'Không thể hủy phòng. Vui lòng thử lại.'
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const renderBooking = ({
    item,
  }: {
    item: Booking;
  }) => {
    const isConfirmed = item.status === 'confirmed';
    const isCancelling = cancellingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.roomContainer}>
            <Text style={styles.roomIcon}>🏫</Text>

            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>
                {item.roomName || 'Phòng học'}
              </Text>

              <Text style={styles.roomId}>
                Mã phòng: {item.roomId || '---'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              isConfirmed
                ? styles.confirmedBadge
                : styles.cancelledBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isConfirmed
                  ? styles.confirmedText
                  : styles.cancelledText,
              ]}
            >
              {isConfirmed ? 'Đã đặt' : 'Đã hủy'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>📅 Ngày</Text>

          <Text style={styles.value}>
            {item.date || '---'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>🕐 Thời gian</Text>

          <Text style={styles.value}>
            {item.time || '---'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>💰 Giá</Text>

          <Text style={styles.price}>
            {(item.price || 0).toLocaleString('vi-VN')}đ
          </Text>
        </View>

        {isConfirmed && (
          <Pressable
            style={[
              styles.cancelButton,
              isCancelling && styles.cancelButtonDisabled,
            ]}
            onPress={() => handleCancelBooking(item.id)}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator
                size="small"
                color="#DC2626"
              />
            ) : (
              <Text style={styles.cancelButtonText}>
                Hủy phòng
              </Text>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={[
          styles.content,
          bookings.length === 0 && styles.emptyContent,
        ]}
        refreshing={loading}
        onRefresh={loadBookings}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>
              Lịch sử đặt phòng
            </Text>

            <Text style={styles.subtitle}>
              Các phòng bạn đã đặt
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" />

              <Text style={styles.emptyText}>
                Đang tải lịch sử...
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>
                📋
              </Text>

              <Text style={styles.emptyTitle}>
                Chưa có lịch sử đặt phòng
              </Text>

              <Text style={styles.emptyText}>
                Khi bạn đặt phòng, thông tin sẽ hiển thị
                ở đây.
              </Text>
            </View>
          )
        }
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

  emptyContent: {
    flexGrow: 1,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: '#666',
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  roomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  roomIcon: {
    fontSize: 32,
    marginRight: 12,
  },

  roomInfo: {
    flex: 1,
  },

  roomName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },

  roomId: {
    fontSize: 13,
    color: '#777',
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  confirmedBadge: {
    backgroundColor: '#DCFCE7',
  },

  cancelledBadge: {
    backgroundColor: '#FEE2E2',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  confirmedText: {
    color: '#15803D',
  },

  cancelledText: {
    color: '#DC2626',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  label: {
    fontSize: 14,
    color: '#666',
  },

  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },

  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },

  cancelButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  cancelButtonDisabled: {
    opacity: 0.6,
  },

  cancelButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 21,
  },
});
