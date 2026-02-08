import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import userService from '../services/userService';
import useAuthStore from '../store/authStore';
import { showSuccessToast, showErrorToast } from '../utils/toast';

const ProfileScreen = ({ navigation }) => {
  console.log('ProfileScreen rendered');
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Modal states
  const [showProfessionModal, setShowProfessionModal] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);

  // Options
  const [professions, setProfessions] = useState([]);
  const [interestTags, setInterestTags] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  useEffect(() => {
    loadProfile();
    loadOptions();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading profile...');
      const data = await userService.getFullProfile();
      console.log('Profile loaded:', data);
      setProfile(data);
      setEditData({
        firstName: data?.firstName || '',
        lastName: data?.lastName || '',
        bio: data?.bio || '',
        profession: data?.profession || '',
        company: data?.company || '',
        location: data?.location || '',
        linkedInUrl: data?.linkedInUrl || '',
        gitHubUrl: data?.gitHubUrl || '',
        websiteUrl: data?.websiteUrl || '',
      });
      setSelectedInterests(data?.interests || []);
    } catch (err) {
      console.error('Profile load error:', err);
      setError(err?.message || 'Profil yuklenemedi');
      // Hata olsa bile user bilgisini authStore'dan al
      if (user) {
        setProfile({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
        });
        setEditData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          bio: '',
          profession: '',
          company: '',
          location: '',
          linkedInUrl: '',
          gitHubUrl: '',
          websiteUrl: '',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [profs, tags] = await Promise.all([
        userService.getProfessions().catch(() => null),
        userService.getInterestTags().catch(() => null),
      ]);

      // Fallback listeler
      const defaultProfessions = [
        { id: '1', name: 'Software Developer', nameTr: 'Yazilim Gelistirici', category: 'Development' },
        { id: '2', name: 'Frontend Developer', nameTr: 'Frontend Gelistirici', category: 'Development' },
        { id: '3', name: 'Backend Developer', nameTr: 'Backend Gelistirici', category: 'Development' },
        { id: '4', name: 'Full Stack Developer', nameTr: 'Full Stack Gelistirici', category: 'Development' },
        { id: '5', name: 'DevOps Engineer', nameTr: 'DevOps Muhendisi', category: 'DevOps & Cloud' },
        { id: '6', name: 'Cybersecurity Analyst', nameTr: 'Siber Guvenlik Analisti', category: 'Security' },
        { id: '7', name: 'Data Scientist', nameTr: 'Veri Bilimci', category: 'Data & AI' },
        { id: '8', name: 'Mobile Developer', nameTr: 'Mobil Gelistirici', category: 'Development' },
        { id: '9', name: 'Student', nameTr: 'Ogrenci', category: 'Other' },
      ];

      const defaultTags = [
        'Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'Docker',
        'Kubernetes', 'Cybersecurity', 'Machine Learning', 'Data Science'
      ];

      setProfessions(profs || defaultProfessions);
      setInterestTags(tags || defaultTags);
    } catch (err) {
      console.error('Options load error:', err);
    }
  };

  // Meslekleri kategoriye gore grupla
  const groupedProfessions = React.useMemo(() => {
    const groups = {};
    professions.forEach(prof => {
      const category = prof.category || 'Diger';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(prof);
    });
    return groups;
  }, [professions]);

  // Secili meslegin goruntuleme adi
  const getDisplayProfession = () => {
    if (!editData.profession) return '';
    const found = professions.find(p => p.name === editData.profession);
    return found?.nameTr || found?.name || editData.profession;
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showErrorToast('Galeri erişim izni gerekli');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image pick error:', err);
      showErrorToast('Resim seçilemedi');
    }
  };

  const uploadAvatar = async (uri) => {
    try {
      setIsUploading(true);
      const response = await userService.uploadAvatar(uri);
      setProfile(prev => ({ ...prev, profileImageUrl: response.profileImageUrl }));
      showSuccessToast('Profil fotoğrafı güncellendi');
    } catch (err) {
      console.error('Upload error:', err);
      showErrorToast('Fotoğraf yüklenemedi');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updateData = {
        ...editData,
        interests: selectedInterests,
      };
      const updated = await userService.updateProfile(updateData);
      setProfile(prev => ({ ...prev, ...updated }));
      setIsEditing(false);
      showSuccessToast('Profil güncellendi');
    } catch (err) {
      console.error('Save error:', err);
      showErrorToast('Profil güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInterest = (tag) => {
    setSelectedInterests(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      if (prev.length >= 10) {
        showErrorToast('En fazla 10 ilgi alanı seçebilirsiniz');
        return prev;
      }
      return [...prev, tag];
    });
  };

  const handleLogout = () => {
    logout();
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
  };

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textLight }}>Profil yukleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 16, color: COLORS.error, marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
            onPress={loadProfile}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadProfile} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profilim</Text>
          {!isEditing ? (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Duzenle</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelButtonText}>Vazgec</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={isUploading}>
            {isUploading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : profile?.profileImageUrl ? (
              <Image source={{ uri: getImageUrl(profile.profileImageUrl) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {(profile?.firstName?.[0] || '') + (profile?.lastName?.[0] || '')}
                </Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>+</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Degistirmek icin dokunun</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.enrolledCoursesCount || 0}</Text>
            <Text style={styles.statLabel}>Kayitli Kurs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.completedCoursesCount || 0}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.certificatesCount || 0}</Text>
            <Text style={styles.statLabel}>Sertifika</Text>
          </View>
        </View>

        {/* Profile Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Kisisel Bilgiler</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Ad</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={editData.firstName}
                onChangeText={(text) => setEditData(prev => ({ ...prev, firstName: text }))}
                editable={isEditing}
                placeholder="Adiniz"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Soyad</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={editData.lastName}
                onChangeText={(text) => setEditData(prev => ({ ...prev, lastName: text }))}
                editable={isEditing}
                placeholder="Soyadiniz"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Hakkimda</Text>
          <TextInput
            style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]}
            value={editData.bio}
            onChangeText={(text) => setEditData(prev => ({ ...prev, bio: text }))}
            editable={isEditing}
            placeholder="Kendinizi kisaca tanitin..."
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>Meslek</Text>
          <TouchableOpacity
            style={[styles.input, styles.selectInput, !isEditing && styles.inputDisabled]}
            onPress={() => isEditing && setShowProfessionModal(true)}
            disabled={!isEditing}
          >
            <Text style={editData.profession ? styles.selectText : styles.selectPlaceholder}>
              {getDisplayProfession() || 'Meslek seciniz'}
            </Text>
            <Text style={styles.selectArrow}>v</Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Sirket</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={editData.company}
            onChangeText={(text) => setEditData(prev => ({ ...prev, company: text }))}
            editable={isEditing}
            placeholder="Calistiginiz sirket"
          />

          <Text style={styles.inputLabel}>Konum</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={editData.location}
            onChangeText={(text) => setEditData(prev => ({ ...prev, location: text }))}
            editable={isEditing}
            placeholder="Istanbul, Turkiye"
          />
        </View>

        {/* Interests Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ilgi Alanlari</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => setShowInterestsModal(true)}>
                <Text style={styles.addButton}>+ Ekle</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tagsContainer}>
            {selectedInterests.length > 0 ? (
              selectedInterests.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  {isEditing && (
                    <TouchableOpacity onPress={() => toggleInterest(tag)} style={styles.tagRemove}>
                      <Text style={styles.tagRemoveText}>x</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noTagsText}>Henuz ilgi alani eklenmemis</Text>
            )}
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Sosyal Baglantilar</Text>

          <Text style={styles.inputLabel}>LinkedIn</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={editData.linkedInUrl}
            onChangeText={(text) => setEditData(prev => ({ ...prev, linkedInUrl: text }))}
            editable={isEditing}
            placeholder="https://linkedin.com/in/kullanici"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>GitHub</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={editData.gitHubUrl}
            onChangeText={(text) => setEditData(prev => ({ ...prev, gitHubUrl: text }))}
            editable={isEditing}
            placeholder="https://github.com/kullanici"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Website</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={editData.websiteUrl}
            onChangeText={(text) => setEditData(prev => ({ ...prev, websiteUrl: text }))}
            editable={isEditing}
            placeholder="https://website.com"
            autoCapitalize="none"
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cikis Yap</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Profession Modal */}
      <Modal visible={showProfessionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Meslek Seciniz</Text>
              <TouchableOpacity onPress={() => setShowProfessionModal(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.professionScrollView}>
              {Object.keys(groupedProfessions).map((category) => (
                <View key={category}>
                  <Text style={styles.categoryHeader}>{category}</Text>
                  {groupedProfessions[category].map((prof) => (
                    <TouchableOpacity
                      key={prof.id || prof.name}
                      style={[
                        styles.modalItem,
                        editData.profession === prof.name && styles.modalItemSelected,
                      ]}
                      onPress={() => {
                        setEditData(prev => ({ ...prev, profession: prof.name }));
                        setShowProfessionModal(false);
                      }}
                    >
                      <Text style={[
                        styles.modalItemText,
                        editData.profession === prof.name && styles.modalItemTextSelected,
                      ]}>
                        {prof.nameTr || prof.name}
                      </Text>
                      {prof.nameTr && (
                        <Text style={styles.modalItemSubtext}>{prof.name}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Interests Modal */}
      <Modal visible={showInterestsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ilgi Alanlari ({selectedInterests.length}/10)</Text>
              <TouchableOpacity onPress={() => setShowInterestsModal(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.interestsScrollView}>
              <View style={styles.interestsGrid}>
                {interestTags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.interestTag,
                      selectedInterests.includes(tag) && styles.interestTagSelected,
                    ]}
                    onPress={() => toggleInterest(tag)}
                  >
                    <Text style={[
                      styles.interestTagText,
                      selectedInterests.includes(tag) && styles.interestTagTextSelected,
                    ]}>
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowInterestsModal(false)}
            >
              <Text style={styles.modalDoneButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 8,
  },
  editButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  avatarBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding,
    marginVertical: SIZES.padding,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  formSection: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  addButton: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDisabled: {
    backgroundColor: COLORS.background,
    color: COLORS.textLight,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectPlaceholder: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  selectArrow: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  tagRemove: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagRemoveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noTagsText: {
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginHorizontal: SIZES.padding,
    marginVertical: SIZES.padding,
    padding: SIZES.padding,
    backgroundColor: COLORS.error + '20',
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 16,
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 18,
    color: COLORS.textLight,
    padding: 4,
  },
  modalItem: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemSelected: {
    backgroundColor: COLORS.primary + '20',
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  modalItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalItemSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  professionScrollView: {
    maxHeight: 450,
  },
  categoryHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 8,
    marginTop: 4,
  },
  interestsScrollView: {
    maxHeight: 400,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SIZES.padding,
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.border,
  },
  interestTagSelected: {
    backgroundColor: COLORS.primary,
  },
  interestTagText: {
    fontSize: 14,
    color: COLORS.text,
  },
  interestTagTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  modalDoneButton: {
    margin: SIZES.padding,
    padding: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ProfileScreen;
