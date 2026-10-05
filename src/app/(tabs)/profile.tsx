import { auth, db } from '@/services/firebase';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Chỉnh sửa thông tin cá nhân
  const [editingProfile, setEditingProfile] = useState(false);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);

  // Cài đặt giao diện
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          setUserEmail(currentUser.email ?? '');

          try {
            const userRef = doc(
              db,
              'users',
              currentUser.uid
            );

            const userSnapshot = await getDoc(userRef);

            if (userSnapshot.exists()) {
              const data = userSnapshot.data();

              setUserName(
                data.name ?? 'Người dùng'
              );
            } else {
              setUserName(
                currentUser.displayName ??
                  'Người dùng'
              );
            }
          } catch (error) {
            console.error(
              'Lỗi lấy thông tin người dùng:',
              error
            );

            setUserName(
              currentUser.displayName ??
                'Người dùng'
            );
          }
        } else {
          setUserEmail('');
          setUserName('');
        }

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // =========================
  // ĐĂNG NHẬP
  // =========================
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập email và mật khẩu.'
      );
      return;
    }

    try {
      setSubmitting(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      setEmail('');
      setPassword('');

      Alert.alert(
        'Đăng nhập thành công',
        'Chào mừng bạn quay lại! 👋'
      );
    } catch (error: any) {
      console.error('Lỗi đăng nhập:', error);

      if (
        error.code ===
        'auth/invalid-credential'
      ) {
        Alert.alert(
          'Đăng nhập thất bại',
          'Email hoặc mật khẩu không đúng.'
        );
      } else if (
        error.code ===
        'auth/user-not-found'
      ) {
        Alert.alert(
          'Đăng nhập thất bại',
          'Tài khoản chưa tồn tại.'
        );
      } else if (
        error.code ===
        'auth/wrong-password'
      ) {
        Alert.alert(
          'Đăng nhập thất bại',
          'Mật khẩu không đúng.'
        );
      } else {
        Alert.alert(
          'Đăng nhập thất bại',
          'Đã xảy ra lỗi. Vui lòng thử lại.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // ĐĂNG KÝ
  // =========================
  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Mật khẩu chưa hợp lệ',
        'Mật khẩu phải có ít nhất 6 ký tự.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      await updateProfile(credential.user, {
        displayName: name.trim(),
      });

      await setDoc(
        doc(db, 'users', credential.user.uid),
        {
          name: name.trim(),
          email: email.trim(),
          createdAt: new Date(),
        }
      );

      setName('');
      setEmail('');
      setPassword('');

      Alert.alert(
        'Đăng ký thành công 🎉',
        'Tài khoản của bạn đã được tạo.'
      );
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);

      if (
        error.code ===
        'auth/email-already-in-use'
      ) {
        Alert.alert(
          'Email đã tồn tại',
          'Email này đã được đăng ký. Hãy đăng nhập.'
        );
      } else if (
        error.code ===
        'auth/invalid-email'
      ) {
        Alert.alert(
          'Email không hợp lệ',
          'Vui lòng kiểm tra lại email.'
        );
      } else if (
        error.code ===
        'auth/weak-password'
      ) {
        Alert.alert(
          'Mật khẩu yếu',
          'Mật khẩu phải có ít nhất 6 ký tự.'
        );
      } else {
        Alert.alert(
          'Đăng ký thất bại',
          'Đã xảy ra lỗi. Vui lòng thử lại.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // BẮT ĐẦU CHỈNH SỬA
  // =========================
  const handleStartEditing = () => {
    if (!user) {
      return;
    }

    setEditName(
      userName || 'Người dùng'
    );

    setEditEmail(
      user.email ?? ''
    );

    setEditPassword('');
    setCurrentPassword('');
    setEditingProfile(true);
  };

  // =========================
  // HỦY CHỈNH SỬA
  // =========================
  const handleCancelEditing = () => {
    setEditName('');
    setEditEmail('');
    setEditPassword('');
    setCurrentPassword('');
    setEditingProfile(false);
  };

  // =========================
  // LƯU THÔNG TIN CÁ NHÂN
  // =========================
  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    const newName = editName.trim();
    const newEmail = editEmail.trim();
    const oldEmail = user.email ?? '';

    if (!newName) {
      Alert.alert(
        'Thiếu tên',
        'Vui lòng nhập họ tên.'
      );
      return;
    }

    if (!newEmail) {
      Alert.alert(
        'Thiếu email',
        'Vui lòng nhập email.'
      );
      return;
    }

    const emailChanged =
      newEmail.toLowerCase() !==
      oldEmail.toLowerCase();

    const passwordChanged =
      editPassword.trim().length > 0;

    if (
      (emailChanged || passwordChanged) &&
      !currentPassword
    ) {
      Alert.alert(
        'Cần xác nhận',
        'Vui lòng nhập mật khẩu hiện tại để đổi email hoặc mật khẩu.'
      );
      return;
    }

    if (
      passwordChanged &&
      editPassword.length < 6
    ) {
      Alert.alert(
        'Mật khẩu mới chưa hợp lệ',
        'Mật khẩu mới phải có ít nhất 6 ký tự.'
      );
      return;
    }

    try {
      setSavingProfile(true);

      // XÁC THỰC LẠI TÀI KHOẢN
      if (emailChanged || passwordChanged) {
        if (!user.email) {
          Alert.alert(
            'Lỗi',
            'Tài khoản này không sử dụng email/mật khẩu.'
          );
          return;
        }

        const credential =
          EmailAuthProvider.credential(
            user.email,
            currentPassword
          );

        await reauthenticateWithCredential(
          user,
          credential
        );
      }

      // ĐỔI TÊN
      if (newName !== userName) {
        await updateProfile(user, {
          displayName: newName,
        });
      }

      // ĐỔI EMAIL
      if (emailChanged) {
        await updateEmail(
          user,
          newEmail
        );
      }

      // ĐỔI MẬT KHẨU
      if (passwordChanged) {
        await updatePassword(
          user,
          editPassword
        );
      }

      // CẬP NHẬT FIRESTORE
      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: newName,
          email: newEmail,
        },
        {
          merge: true,
        }
      );

      setUserName(newName);
      setUserEmail(newEmail);

      setEditName('');
      setEditEmail('');
      setEditPassword('');
      setCurrentPassword('');
      setEditingProfile(false);

      Alert.alert(
        'Cập nhật thành công 🎉',
        'Thông tin cá nhân của bạn đã được cập nhật.'
      );
    } catch (error: any) {
      console.error(
        'Lỗi cập nhật thông tin:',
        error
      );

      if (
        error.code ===
        'auth/wrong-password'
      ) {
        Alert.alert(
          'Mật khẩu không đúng',
          'Mật khẩu hiện tại bạn nhập không chính xác.'
        );
      } else if (
        error.code ===
        'auth/invalid-credential'
      ) {
        Alert.alert(
          'Xác thực thất bại',
          'Mật khẩu hiện tại không đúng hoặc phiên đăng nhập đã hết hạn.'
        );
      } else if (
        error.code ===
        'auth/requires-recent-login'
      ) {
        Alert.alert(
          'Cần đăng nhập lại',
          'Vì lý do bảo mật, bạn cần đăng nhập lại trước khi đổi email hoặc mật khẩu.'
        );
      } else if (
        error.code ===
        'auth/email-already-in-use'
      ) {
        Alert.alert(
          'Email đã tồn tại',
          'Email mới này đã được sử dụng bởi tài khoản khác.'
        );
      } else if (
        error.code ===
        'auth/invalid-email'
      ) {
        Alert.alert(
          'Email không hợp lệ',
          'Vui lòng kiểm tra lại email mới.'
        );
      } else if (
        error.code ===
        'auth/weak-password'
      ) {
        Alert.alert(
          'Mật khẩu quá yếu',
          'Mật khẩu mới phải có ít nhất 6 ký tự.'
        );
      } else {
        Alert.alert(
          'Cập nhật thất bại',
          'Không thể cập nhật thông tin. Vui lòng thử lại.'
        );
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // =========================
  // ĐĂNG XUẤT
  // GIỮ NGUYÊN LOGIC CŨ
  // =========================
  const handleLogout = async () => {
    try {
      await signOut(auth);

      Alert.alert(
        'Đã đăng xuất',
        'Bạn đã đăng xuất khỏi tài khoản.'
      );
    } catch (error) {
      console.error(
        'Lỗi đăng xuất:',
        error
      );

      Alert.alert(
        'Lỗi',
        'Không thể đăng xuất. Vui lòng thử lại.'
      );
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Đang tải...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================
  // CHƯA ĐĂNG NHẬP
  // =========================
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.authContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {isRegister
              ? 'Tạo tài khoản'
              : 'Đăng nhập'}
          </Text>

          <Text style={styles.subtitle}>
            {isRegister
              ? 'Đăng ký để sử dụng đầy đủ chức năng đặt phòng.'
              : 'Đăng nhập để xem thông tin và lịch sử đặt phòng.'}
          </Text>

          <View style={styles.authCard}>
            {isRegister && (
              <>
                <Text style={styles.inputLabel}>
                  Họ và tên
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </>
            )}

            <Text style={styles.inputLabel}>
              Email
            </Text>

            <TextInput
              style={styles.input}
              placeholder="example@gmail.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>
              Mật khẩu
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ít nhất 6 ký tự"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable
              style={[
                styles.primaryButton,
                submitting &&
                  styles.disabledButton,
              ]}
              onPress={
                isRegister
                  ? handleRegister
                  : handleLogin
              }
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isRegister
                    ? 'Đăng ký'
                    : 'Đăng nhập'}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.switchButton}
              onPress={() => {
                setIsRegister(!isRegister);
                setName('');
                setEmail('');
                setPassword('');
              }}
            >
              <Text style={styles.switchText}>
                {isRegister
                  ? 'Đã có tài khoản? Đăng nhập'
                  : 'Chưa có tài khoản? Đăng ký'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================
  // TRANG CÁ NHÂN
  // =========================
  return (
    <SafeAreaView
      style={[
        styles.container,
        darkMode && styles.darkContainer,
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            styles.title,
            darkMode && styles.darkText,
          ]}
        >
          Cá nhân
        </Text>

        {/* PROFILE CARD */}
        <View
          style={[
            styles.profileCard,
            darkMode && styles.darkCard,
          ]}
        >
          <Text style={styles.avatar}>
            👤
          </Text>

          <View style={styles.profileInfo}>
            <Text
              style={[
                styles.name,
                darkMode && styles.darkText,
              ]}
            >
              {userName || 'Người dùng'}
            </Text>

            <Text
              style={[
                styles.email,
                darkMode && styles.darkSubText,
              ]}
            >
              {userEmail}
            </Text>
          </View>
        </View>

        {/* THÔNG TIN CÁ NHÂN */}
        {!editingProfile ? (
          <View
            style={[
              styles.menu,
              darkMode && styles.darkCard,
            ]}
          >
            <Pressable
              style={styles.menuItem}
              onPress={handleStartEditing}
            >
              <Text style={styles.menuIcon}>
                👤
              </Text>

              <View style={styles.menuTextContainer}>
                <Text
                  style={[
                    styles.menuTitle,
                    darkMode && styles.darkText,
                  ]}
                >
                  Thông tin cá nhân
                </Text>

                <Text
                  style={[
                    styles.menuSubtitle,
                    darkMode && styles.darkSubText,
                  ]}
                >
                  {userEmail}
                </Text>
              </View>

              <Text
                style={[
                  styles.arrow,
                  darkMode && styles.darkSubText,
                ]}
              >
                ›
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.editCard,
              darkMode && styles.darkCard,
            ]}
          >
            <Text
              style={[
                styles.editTitle,
                darkMode && styles.darkText,
              ]}
            >
              Chỉnh sửa thông tin cá nhân
            </Text>

            <Text
              style={[
                styles.inputLabel,
                darkMode && styles.darkText,
              ]}
            >
              Họ và tên
            </Text>

            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
              ]}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#999"
              value={editName}
              onChangeText={setEditName}
              autoCapitalize="words"
            />

            <Text
              style={[
                styles.inputLabel,
                darkMode && styles.darkText,
              ]}
            >
              Email mới
            </Text>

            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
              ]}
              placeholder="example@gmail.com"
              placeholderTextColor="#999"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text
              style={[
                styles.inputLabel,
                darkMode && styles.darkText,
              ]}
            >
              Mật khẩu hiện tại
            </Text>

            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
              ]}
              placeholder="Nhập khi đổi email/mật khẩu"
              placeholderTextColor="#999"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <Text
              style={[
                styles.inputLabel,
                darkMode && styles.darkText,
              ]}
            >
              Mật khẩu mới
            </Text>

            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
              ]}
              placeholder="Để trống nếu không đổi"
              placeholderTextColor="#999"
              value={editPassword}
              onChangeText={setEditPassword}
              secureTextEntry
            />

            <Text
              style={[
                styles.editHint,
                darkMode && styles.darkSubText,
              ]}
            >
              Nếu chỉ đổi tên, không cần nhập mật khẩu.
              {'\n'}
              Nếu đổi email hoặc mật khẩu, hãy nhập mật khẩu hiện tại.
            </Text>

            <View style={styles.editButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={handleCancelEditing}
                disabled={savingProfile}
              >
                <Text style={styles.cancelText}>
                  Hủy
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.primaryButton,
                  savingProfile &&
                    styles.disabledButton,
                ]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Lưu thay đổi
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* CÀI ĐẶT */}
        <View
          style={[
            styles.menu,
            darkMode && styles.darkCard,
          ]}
        >
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>
              ⚙️
            </Text>

            <View style={styles.menuTextContainer}>
              <Text
                style={[
                  styles.menuTitle,
                  darkMode && styles.darkText,
                ]}
              >
                Cài đặt
              </Text>

              <Text
                style={[
                  styles.menuSubtitle,
                  darkMode && styles.darkSubText,
                ]}
              >
                Giao diện ứng dụng
              </Text>
            </View>

            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
            />
          </View>
        </View>

        {/* ĐĂNG XUẤT */}
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            Đăng xuất
          </Text>
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

  darkContainer: {
    backgroundColor: '#121212',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  authContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: '#666',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },

  authCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  input: {
    height: 50,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#111',
    marginBottom: 16,
  },

  darkInput: {
    backgroundColor: '#2A2A2A',
    borderColor: '#444',
    color: '#FFF',
  },

  primaryButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  switchButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  switchText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },

  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },

  darkCard: {
    backgroundColor: '#1E1E1E',
  },

  avatar: {
    fontSize: 42,
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },

  email: {
    fontSize: 14,
    color: '#666',
  },

  menu: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 20,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },

  menuIcon: {
    fontSize: 22,
  },

  menuTextContainer: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 3,
  },

  menuSubtitle: {
    fontSize: 13,
    color: '#888',
  },

  arrow: {
    fontSize: 26,
    color: '#999',
  },

  editCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },

  editTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111',
    marginBottom: 18,
  },

  editHint: {
    fontSize: 13,
    color: '#777',
    lineHeight: 20,
    marginBottom: 16,
  },

  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },

  logoutButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },

  darkText: {
    color: '#FFF',
  },

  darkSubText: {
    color: '#AAA',
  },
});
