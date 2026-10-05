import { db } from '@/services/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  getDocs,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1000',
    description:
      'Phòng học nhóm yên tĩnh, phù hợp cho học tập và làm việc nhóm. Phòng có bàn ghế, điều hòa và Wi-Fi.',
  },
  {
    id: '2',
    name: 'Phòng học nhóm B',
    address: 'Cơ sở 2',
    beds: 8,
    price: 40000,
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1000',
    description:
      'Phòng học nhóm rộng rãi, phù hợp cho các nhóm đông người. Phòng có bàn ghế, điều hòa và Wi-Fi.',
  },
  {
    id: '3',
    name: 'Phòng tự học C',
    address: 'Cơ sở chính',
    beds: 4,
    price: 25000,
    image:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1000',
    description:
      'Phòng tự học yên tĩnh, phù hợp cho học tập cá nhân và làm việc. Có bàn ghế, điều hòa và Wi-Fi.',
  },
];

const dates = [
  'Hôm nay',
  'Ngày mai',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
];

const times = [
  '07:00 - 09:00',
  '09:00 - 11:00',
  '13:00 - 15:00',
  '15:00 - 17:00',
  '17:00 - 19:00',
  '19:00 - 21:00',
];

type Booking = {
  roomId?: string;
  date?: string;
  time?: string;
  status?: string;
};

export default function RoomDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const roomId = Array.isArray(id) ? id[0] : id;

  const room = rooms.find(
    (item) => item.id === String(roomId),
  );

  const [selectedDate, setSelectedDate] = useState(
    dates[0],
  );

  const [bookedTimes, setBookedTimes] = useState<string[]>(
    [],
  );

  const [loadingAvailability, setLoadingAvailability] =
    useState(true);

  const loadAvailability = useCallback(async () => {
    if (!roomId) {
      return;
    }

    try {
      setLoadingAvailability(true);

      const snapshot = await getDocs(
        collection(db, 'bookings'),
      );

      const booked: string[] = [];

      snapshot.forEach((document) => {
        const data = document.data() as Booking;

        const sameRoom =
          String(data.roomId) === String(roomId);

        const sameDate =
          data.date === selectedDate;

        const activeBooking =
          data.status !== 'cancelled';

        if (
          sameRoom &&
          sameDate &&
          activeBooking &&
          data.time
        ) {
          booked.push(data.time);
        }
      });

      setBookedTimes(booked);
    } catch (error) {
      console.error(
        'Lỗi kiểm tra trạng thái phòng:',
        error,
      );

      setBookedTimes([]);
    } finally {
      setLoadingAvailability(false);
    }
  }, [roomId, selectedDate]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundIcon}>🏫</Text>

          <Text style={styles.notFoundTitle}>
            Không tìm thấy phòng
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>
              ← Quay lại
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isTimeBooked = (time: string) =>
    bookedTimes.includes(time);

  const allTimesBooked =
    times.length > 0 &&
    times.every((time) => bookedTimes.includes(time));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image
          source={{ uri: room.image }}
          style={styles.image}
        />

        <View style={styles.content}>
          <Text style={styles.title}>
            {room.name}
          </Text>

          <Text style={styles.address}>
            📍 {room.address}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>🛏</Text>

              <Text style={styles.infoLabel}>
                Sức chứa
              </Text>

              <Text style={styles.infoValue}>
                {room.beds} người
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💰</Text>

              <Text style={styles.infoLabel}>
                Giá
              </Text>

              <Text style={styles.infoValue}>
                {room.price.toLocaleString('vi-VN')}đ/giờ
              </Text>
            </View>
          </View>

          {/* TRẠNG THÁI PHÒNG */}
          <View
            style={[
              styles.availabilityBox,
              allTimesBooked &&
                styles.fullAvailabilityBox,
            ]}
          >
            <View style={styles.availabilityHeader}>
              <Text style={styles.availabilityTitle}>
                Trạng thái phòng
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  allTimesBooked
                    ? styles.fullBadge
                    : styles.availableBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    allTimesBooked
                      ? styles.fullText
                      : styles.availableText,
                  ]}
                >
                  {allTimesBooked
                    ? 'Hết chỗ'
                    : 'Còn chỗ'}
                </Text>
              </View>
            </View>

            <Text style={styles.dateLabel}>
              Chọn ngày để xem giờ còn trống
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateScroll}
            >
              {dates.map((date) => {
                const selected =
                  selectedDate === date;

                return (
                  <Pressable
                    key={date}
                    style={[
                      styles.dateButton,
                      selected &&
                        styles.selectedDateButton,
                    ]}
                    onPress={() =>
                      setSelectedDate(date)
                    }
                  >
                    <Text
                      style={[
                        styles.dateButtonText,
                        selected &&
                          styles.selectedDateText,
                      ]}
                    >
                      {date}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {loadingAvailability ? (
              <View style={styles.loadingAvailability}>
                <ActivityIndicator />

                <Text style={styles.loadingText}>
                  Đang kiểm tra phòng...
                </Text>
              </View>
            ) : (
              <>
                {allTimesBooked && (
                  <View style={styles.fullMessage}>
                    <Text style={styles.fullMessageText}>
                      🔒 Tất cả khung giờ trong ngày này
                      đã được đặt.
                    </Text>
                  </View>
                )}

                <Text style={styles.timeTitle}>
                  Khung giờ
                </Text>

                <View style={styles.timeGrid}>
                  {times.map((time) => {
                    const booked =
                      isTimeBooked(time);

                    return (
                      <View
                        key={time}
                        style={[
                          styles.timeButton,
                          booked &&
                            styles.bookedTimeButton,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeText,
                            booked &&
                              styles.bookedTimeText,
                          ]}
                        >
                          {time}
                        </Text>

                        <Text
                          style={[
                            styles.timeStatus,
                            booked &&
                              styles.bookedTimeStatus,
                          ]}
                        >
                          {booked
                            ? 'Đã đặt'
                            : 'Còn trống'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          <Text style={styles.sectionTitle}>
            Mô tả
          </Text>

          <Text style={styles.description}>
            {room.description}
          </Text>

          <Text style={styles.sectionTitle}>
            Tiện ích
          </Text>

          <View style={styles.amenities}>
            <Text style={styles.amenity}>
              📶 Wi-Fi
            </Text>

            <Text style={styles.amenity}>
              ❄️ Điều hòa
            </Text>

            <Text style={styles.amenity}>
              🔌 Ổ điện
            </Text>

            <Text style={styles.amenity}>
              🪑 Bàn ghế
            </Text>
          </View>

          <Pressable
            style={styles.bookingButton}
            onPress={() =>
              router.push(
                `/booking/confirm?id=${room.id}` as any,
              )
            }
          >
            <Text style={styles.bookingText}>
              Đặt phòng
            </Text>
          </Pressable>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>
              ← Quay lại
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  image: {
    width: '100%',
    height: 260,
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  address: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
  },

  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  infoBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
  },

  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  infoLabel: {
    fontSize: 13,
    color: '#777',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  availabilityBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  fullAvailabilityBox: {
    borderColor: '#FECACA',
  },

  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  availabilityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  availableBadge: {
    backgroundColor: '#DCFCE7',
  },

  fullBadge: {
    backgroundColor: '#FEE2E2',
  },

  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },

  availableText: {
    color: '#15803D',
  },

  fullText: {
    color: '#DC2626',
  },

  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },

  dateScroll: {
    marginBottom: 16,
  },

  dateButton: {
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },

  selectedDateButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  dateButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },

  selectedDateText: {
    color: '#FFF',
  },

  loadingAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },

  fullMessage: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },

  fullMessageText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '600',
  },

  timeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },

  timeGrid: {
    gap: 8,
  },

  timeButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bookedTimeButton: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },

  timeText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
  },

  bookedTimeText: {
    color: '#FFF',
  },

  timeStatus: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '700',
  },

  bookedTimeStatus: {
    color: '#D4D4D8',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
    marginTop: 8,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#555',
    marginBottom: 20,
  },

  amenities: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },

  amenity: {
    fontSize: 15,
    color: '#333',
  },

  bookingButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },

  bookingText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },

  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  backText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },

  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  notFoundIcon: {
    fontSize: 50,
    marginBottom: 16,
  },

  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
  },
});
