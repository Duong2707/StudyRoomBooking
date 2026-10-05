import { auth, db } from '@/services/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
    price: 30000,
  },
  {
    id: '2',
    name: 'Phòng học nhóm B',
    price: 40000,
  },
  {
    id: '3',
    name: 'Phòng tự học C',
    price: 25000,
  },
];

const times = [
  '07:00 - 09:00',
  '09:00 - 11:00',
  '13:00 - 15:00',
  '15:00 - 17:00',
  '17:00 - 19:00',
  '19:00 - 21:00',
];

function getDateList() {
  const result = [];

  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const value = `${year}-${month}-${day}`;

    let label = '';

    if (i === 0) {
      label = 'Hôm nay';
    } else if (i === 1) {
      label = 'Ngày mai';
    } else {
      const days = [
        'Chủ nhật',
        'Thứ 2',
        'Thứ 3',
        'Thứ 4',
        'Thứ 5',
        'Thứ 6',
        'Thứ 7',
      ];

      label = days[date.getDay()];
    }

    result.push({
      value,
      label,
    });
  }

  return result;
}

const dates = getDateList();

export default function BookingConfirmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const roomId = Array.isArray(id) ? id[0] : id;

  const room = rooms.find(
    (item) => item.id === String(roomId)
  );

  const [selectedDate, setSelectedDate] = useState(
    dates[0].value
  );

  const [selectedTime, setSelectedTime] = useState('');

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const [loadingBookings, setLoadingBookings] =
    useState(true);

  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (roomId && selectedDate) {
      loadBookedTimes();
    }
  }, [roomId, selectedDate]);

  const loadBookedTimes = async () => {
    try {
      setLoadingBookings(true);
      setSelectedTime('');

      if (!roomId) {
        return;
      }

      const bookingsRef = collection(db, 'bookings');

      const q = query(
        bookingsRef,
        where('roomId', '==', String(roomId)),
        where('date', '==', selectedDate),
        where('status', '==', 'confirmed')
      );

      const snapshot = await getDocs(q);

      const booked = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return data.time as string;
        })
        .filter(Boolean);

      setBookedTimes(booked);
    } catch (error) {
      console.error(
        'Lỗi kiểm tra lịch phòng:',
        error
      );

      Alert.alert(
        'Lỗi',
        'Không thể kiểm tra tình trạng phòng.'
      );
    } finally {
      setLoadingBookings(false);
    }
  };

  const isTimeBooked = (time: string) => {
    return bookedTimes.includes(time);
  };

  const allTimesBooked =
    bookedTimes.length >= times.length;

  const handleConfirmBooking = async () => {
    if (!room) {
      Alert.alert(
        'Lỗi',
        'Không tìm thấy thông tin phòng.'
      );
      return;
    }

    if (!selectedTime) {
      Alert.alert(
        'Chưa chọn giờ',
        'Vui lòng chọn một khung giờ còn trống.'
      );
      return;
    }

    if (isTimeBooked(selectedTime)) {
      Alert.alert(
        'Khung giờ đã được đặt',
        'Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác.'
      );

      await loadBookedTimes();
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert(
        'Chưa đăng nhập',
        'Vui lòng đăng nhập trước khi đặt phòng.'
      );
      return;
    }

    try {
      setBooking(true);

      /*
       * Kiểm tra lại Firebase ngay trước khi tạo booking.
       * Điều này giúp tránh trường hợp 2 người cùng bấm
       * đặt một phòng trong cùng một khung giờ.
       */
      const bookingsRef = collection(db, 'bookings');

      const checkQuery = query(
        bookingsRef,
        where('roomId', '==', String(room.id)),
        where('date', '==', selectedDate),
        where('time', '==', selectedTime),
        where('status', '==', 'confirmed')
      );

      const checkSnapshot = await getDocs(checkQuery);

      if (!checkSnapshot.empty) {
        Alert.alert(
          'Khung giờ đã được đặt',
          'Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác.'
        );

        await loadBookedTimes();
        return;
      }

      const totalPrice = room.price * 2;

      await addDoc(bookingsRef, {
        userId: currentUser.uid,
        userEmail: currentUser.email ?? '',

        roomId: String(room.id),
        roomName: room.name,

        date: selectedDate,
        time: selectedTime,

        price: totalPrice,

        status: 'confirmed',

        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Đặt phòng thành công 🎉',
        `Bạn đã đặt ${room.name} vào ${selectedDate}, ${selectedTime}.`,
        [
          {
            text: 'Xem lịch sử',
            onPress: () => {
              router.replace(
                '/(tabs)/bookings' as any
              );
            },
          },
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'Lỗi đặt phòng:',
        error
      );

      Alert.alert(
        'Đặt phòng thất bại',
        'Không thể lưu thông tin đặt phòng. Vui lòng thử lại.'
      );
    } finally {
      setBooking(false);
    }
  };

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundIcon}>
            🏫
          </Text>

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Quay lại
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Đặt phòng
        </Text>

        <Text style={styles.roomText}>
          {room.name}
        </Text>

        <Text style={styles.sectionTitle}>
          Chọn ngày
        </Text>

        <View style={styles.options}>
          {dates.map((date) => {
            const selected =
              selectedDate === date.value;

            return (
              <Pressable
                key={date.value}
                style={[
                  styles.dateButton,
                  selected &&
                    styles.selectedButton,
                ]}
                onPress={() =>
                  setSelectedDate(date.value)
                }
              >
                <Text
                  style={[
                    styles.dateText,
                    selected &&
                      styles.selectedText,
                  ]}
                >
                  {date.label}
                </Text>

                <Text
                  style={[
                    styles.dateSubText,
                    selected &&
                      styles.selectedSubText,
                  ]}
                >
                  {date.value}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>
          Chọn giờ
        </Text>

        {loadingBookings ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />

            <Text style={styles.loadingText}>
              Đang kiểm tra lịch phòng...
            </Text>
          </View>
        ) : (
          <>
            {allTimesBooked && (
              <View style={styles.fullBox}>
                <Text style={styles.fullIcon}>
                  🔴
                </Text>

                <View style={styles.fullContent}>
                  <Text style={styles.fullTitle}>
                    Phòng đã kín
                  </Text>

                  <Text style={styles.fullText}>
                    Tất cả khung giờ trong ngày này
                    đã được đặt.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.options}>
              {times.map((time) => {
                const booked =
                  isTimeBooked(time);

                const selected =
                  selectedTime === time;

                return (
                  <Pressable
                    key={time}
                    disabled={booked}
                    style={[
                      styles.timeButton,
                      selected &&
                        styles.selectedButton,
                      booked &&
                        styles.bookedButton,
                    ]}
                    onPress={() =>
                      setSelectedTime(time)
                    }
                  >
                    <View
                      style={styles.timeContent}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selected &&
                            styles.selectedText,
                          booked &&
                            styles.bookedText,
                        ]}
                      >
                        {time}
                      </Text>

                      {booked && (
                        <Text
                          style={
                            styles.bookedLabel
                          }
                        >
                          Đã đặt
                        </Text>
                      )}

                      {!booked &&
                        selected && (
                          <Text
                            style={
                              styles.availableLabel
                            }
                          >
                            Đang chọn
                          </Text>
                        )}

                      {!booked &&
                        !selected && (
                          <Text
                            style={
                              styles.availableLabel
                            }
                          >
                            Còn trống
                          </Text>
                        )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            Thông tin đặt phòng
          </Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Phòng
            </Text>

            <Text style={styles.summaryValue}>
              {room.name}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Ngày
            </Text>

            <Text style={styles.summaryValue}>
              {selectedDate}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Thời gian
            </Text>

            <Text style={styles.summaryValue}>
              {selectedTime || 'Chưa chọn'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Giá
            </Text>

            <Text style={styles.price}>
              {(room.price * 2).toLocaleString(
                'vi-VN'
              )}
              đ
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.confirmButton,
            (booking ||
              loadingBookings ||
              allTimesBooked ||
              !selectedTime) &&
              styles.disabledButton,
          ]}
          onPress={handleConfirmBooking}
          disabled={
            booking ||
            loadingBookings ||
            allTimesBooked ||
            !selectedTime
          }
        >
          {booking ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmText}>
              Xác nhận đặt phòng
            </Text>
          )}
        </Pressable>
      </ScrollView>
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

  backButton: {
    marginBottom: 20,
  },

  backText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  roomText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 14,
  },

  options: {
    gap: 10,
    marginBottom: 28,
  },

  dateButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 15,
  },

  selectedButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },

  dateSubText: {
    fontSize: 13,
    color: '#777',
  },

  selectedText: {
    color: '#FFF',
    fontWeight: '700',
  },

  selectedSubText: {
    color: '#DBEAFE',
  },

  timeButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 15,
  },

  bookedButton: {
    backgroundColor: '#111',
    borderColor: '#111',
  },

  timeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },

  bookedText: {
    color: '#FFF',
  },

  bookedLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  availableLabel: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '600',
  },

  loadingBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
    alignItems: 'center',
  },

  loadingText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },

  fullBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 15,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fullIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  fullContent: {
    flex: 1,
  },

  fullTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 3,
  },

  fullText: {
    fontSize: 14,
    color: '#B91C1C',
    lineHeight: 20,
  },

  summary: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  summaryLabel: {
    color: '#666',
    fontSize: 14,
  },

  summaryValue: {
    color: '#111',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },

  price: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
  },

  confirmButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  confirmText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
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
